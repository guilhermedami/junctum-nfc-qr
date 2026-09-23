import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRole } from "@/lib/auth";
import { inviteTeamMember } from "@/lib/invite";

export const Route = createFileRoute("/_authenticated/equipe")({ component: Equipe });

function Equipe() {
  const { data: role, isLoading } = useRole();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  if (isLoading) return <p>Carregando…</p>;
  if (role !== "admin") return <Navigate to="/dashboard" />;

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader
        title="Equipe e acessos"
        description="Convide pessoas por e-mail. Cada vendedor acessa somente os próprios registros comerciais."
      />
      <form
        className="space-y-4 rounded-lg border p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          try {
            await inviteTeamMember({ data: { email, role: "vendedor" } });
            toast.success("Convite enviado por e-mail");
            setEmail("");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Falha ao convidar");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="invite-email">E-mail</Label>
          <Input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button disabled={busy}>{busy ? "Enviando…" : "Enviar convite"}</Button>
        <p className="text-xs text-muted-foreground">
          Os convites criam acessos de vendedor. O portal de clientes será tratado separadamente.
        </p>
      </form>
    </div>
  );
}
