import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/definir-senha")({ component: DefinirSenha });

function DefinirSenha() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  return (
    <main className="mx-auto mt-24 max-w-sm space-y-5 px-5">
      <h1 className="text-2xl font-semibold">Ativar acesso à JUNCTUM</h1>
      <p className="text-sm text-muted-foreground">
        Abra o convite recebido por e-mail e defina sua senha.
      </p>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const { data } = await supabase.auth.getSession();
            if (!data.session)
              throw new Error("Abra o link do convite novamente para ativar sua conta.");
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            toast.success("Senha definida");
            navigate({ to: "/dashboard" });
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível ativar a conta");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="new-password">Nova senha</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button disabled={busy}>{busy ? "Salvando…" : "Definir senha"}</Button>
      </form>
    </main>
  );
}
