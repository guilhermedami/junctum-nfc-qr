import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAccessSummary } from "@/lib/access-summary";
import { dateBR, num } from "@/lib/junctum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/relatorios/$id")({ component: Relatorio });

const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = () => localDate(new Date());
const thirtyDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return localDate(d);
};

function Relatorio() {
  const { id } = Route.useParams();
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);
  const valid =
    !!from &&
    !!to &&
    from <= to &&
    new Date(to).getTime() - new Date(from).getTime() <= 365 * 86400000;
  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: ["report-client", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, nome_empresa")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: plates = [] } = useQuery({
    queryKey: ["report-plates", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plates")
        .select("id, nome, status")
        .eq("client_id", id)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });
  const {
    data: access,
    isLoading: loadingAccess,
    error: accessError,
  } = useQuery({
    queryKey: ["report-access", id, from, to],
    enabled: valid,
    queryFn: () => fetchAccessSummary({ clientId: id, from, to }),
  });
  const { data: before } = useQuery({
    queryKey: ["report-reviews-before", id, from],
    enabled: valid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_snapshots")
        .select("total_reviews, created_at")
        .eq("client_id", id)
        .lt("created_at", `${from}T03:00:00Z`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: last } = useQuery({
    queryKey: ["report-reviews-last", id, to],
    enabled: valid,
    queryFn: async () => {
      const end = new Date(`${to}T12:00:00Z`);
      end.setUTCDate(end.getUTCDate() + 1);
      const { data, error } = await supabase
        .from("review_snapshots")
        .select("total_reviews, created_at")
        .eq("client_id", id)
        .lt("created_at", end.toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (loadingClient) return <p>Carregando cliente…</p>;
  if (!client) return <p>Cliente não encontrado ou sem permissão de acesso.</p>;
  const baseline = before?.total_reviews ?? null;
  const reviewsDiff =
    baseline != null && last?.total_reviews != null ? last.total_reviews - baseline : null;
  const periodTotal = access?.series.reduce((sum, day) => sum + day.total, 0) ?? 0;
  const nfc = access?.series.reduce((sum, day) => sum + day.nfc, 0) ?? 0;
  const qr = access?.series.reduce((sum, day) => sum + day.qr, 0) ?? 0;

  return (
    <div className="client-report mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Button variant="ghost" asChild>
          <Link to="/clientes">
            <ArrowLeft className="mr-2 size-4" />
            Clientes
          </Link>
        </Button>
        <Button onClick={() => window.print()} disabled={!access || !valid}>
          <Printer className="mr-2 size-4" />
          Imprimir / salvar PDF
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 print:hidden">
        <div>
          <Label htmlFor="from">Início</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="to">Fim</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      {!valid && (
        <p className="text-sm text-destructive">Selecione um período válido de até 365 dias.</p>
      )}
      {accessError && (
        <p className="text-sm text-destructive">
          Não foi possível carregar as métricas. Verifique a migration do banco.
        </p>
      )}
      <header className="border-b pb-5">
        <p className="font-bold tracking-widest text-electric">JUNCTUM</p>
        <h1 className="mt-3 text-3xl font-semibold">Relatório de interações</h1>
        <p className="mt-2 text-muted-foreground">
          {client.nome_empresa} · {dateBR(`${from}T12:00:00`)} a {dateBR(`${to}T12:00:00`)}
        </p>
      </header>
      {loadingAccess ? (
        <p>Carregando métricas…</p>
      ) : (
        access &&
        valid && (
          <>
            <section className="grid grid-cols-3 gap-3">
              {[
                ["Interações", periodTotal],
                ["NFC", nfc],
                ["QR Code", qr],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{num(Number(value))}</p>
                </div>
              ))}
            </section>
            <section className="rounded-lg border p-5">
              <h2 className="font-semibold">Placas cadastradas</h2>
              <ul className="mt-3 space-y-1 text-sm">
                {plates.map((p) => (
                  <li key={p.id}>
                    {p.nome} · {p.status}
                  </li>
                ))}
              </ul>
              {!plates.length && (
                <p className="mt-2 text-sm text-muted-foreground">Nenhuma placa cadastrada.</p>
              )}
            </section>
            <section className="rounded-lg border p-5">
              <h2 className="font-semibold">Avaliações Google informadas manualmente</h2>
              <p className="mt-2 text-sm">
                Referência anterior: {baseline == null ? "sem registro" : num(baseline)} · Último
                registro até o fim do período: {last ? num(last.total_reviews) : "sem registro"}
              </p>
              <p className="mt-1 text-sm">
                Variação observada:{" "}
                {reviewsDiff == null
                  ? "sem dados suficientes"
                  : `${reviewsDiff >= 0 ? "+" : ""}${num(reviewsDiff)}`}
              </p>
            </section>
            <p className="text-xs text-muted-foreground">
              Interações representam acessos registrados, não pessoas únicas. Avaliações são
              lançadas manualmente; sua variação não comprova que foram causadas pelas placas.
            </p>
          </>
        )
      )}
    </div>
  );
}
