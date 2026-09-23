import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const inviteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { email: string; role: "vendedor" }) => input)
  .handler(async ({ data, context }) => {
    const email = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-mail inválido");
    if (data.role !== "vendedor") throw new Error("Perfil inválido");
    const { data: roles, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (roleError || !roles?.some((r) => r.role === "admin"))
      throw new Error("Apenas administradores podem convidar usuários");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as SupabaseClient;
    const { error: insertError } = await admin.from("staff_invitations").insert({
      email,
      role: data.role,
      invited_by: context.userId,
    });
    if (insertError)
      throw new Error(
        "Não foi possível preparar o convite. Verifique se o e-mail já foi convidado.",
      );
    const appUrl = process.env["PUBLIC_APP_URL"];
    if (!appUrl || !appUrl.startsWith("https://")) {
      await admin.from("staff_invitations").delete().eq("email", email);
      throw new Error(
        "Configure PUBLIC_APP_URL com o endereço HTTPS do aplicativo antes de enviar convites.",
      );
    }
    const redirectTo = new URL("/definir-senha", appUrl).toString();
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });
    if (inviteError) {
      await admin.from("staff_invitations").delete().eq("email", email);
      throw new Error(`Convite não enviado: ${inviteError.message}`);
    }
    return { email };
  });
