import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { brl, num, dateBR } from "@/lib/junctum";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type Range = 7 | 30 | 90;

function startOf(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return d;
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const [range, setRange] = useState<Range>(30);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", range],
    queryFn: async () => {
      const since = startOf(range).toISOString();
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [stages, leads, sales, clients, plates, events, followups] = await Promise.all([
        supabase.from("pipeline_stages").select("id, nome, tipo").eq("arquivada", false),
        supabase.from("leads").select("id, stage_id, valor_estimado, created_at"),
        supabase.from("sales").select("id, valor, data_venda"),
        supabase.from("clients").select("id, status, created_at"),
        supabase.from("plates").select("id, status"),
        supabase.from("access_events").select("id, source, created_at").gte("created_at", since),
        supabase.from("followups").select("id, data, status"),
      ]);

      const allEvents = await supabase
        .from("access_events")
        .select("id, source, created_at");

      return {
        stages: stages.data ?? [],
        leads: leads.data ?? [],
        sales: sales.data ?? [],
        clients: clients.data ?? [],
        plates: plates.data ?? [],
        events: events.data ?? [],
        allEvents: allEvents.data ?? [],
        followups: followups.data ?? [],
        monthStart,
        todayISO: today.toISOString(),
      };
    },
  });

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Carregando dados…</p>;
  }

  const stageName = (id: string | null) =>
    data.stages.find((s) => s.id === id)?.nome?.toLowerCase() ?? "";
  const countStage = (needle: string) =>
    data.leads.filter((l) => stageName(l.stage_id).includes(needle)).length;

  const monthSales = data.sales.filter((s) => new Date(s.data_venda) >= new Date(data.monthStart));
  const faturamento = monthSales.reduce((acc, s) => acc + Number(s.valor ?? 0), 0);
  const ticket = monthSales.length ? faturamento / monthSales.length : 0;
  const conversao = data.leads.length ? (data.sales.length / data.leads.length) * 100 : 0;

  const eventsToday = data.allEvents.filter((e) => e.created_at >= data.todayISO);
  const inRange = (days: number) =>
    data.allEvents.filter((e) => new Date(e.created_at) >= startOf(days));
  const monthEvents = data.allEvents.filter((e) => e.created_at >= data.monthStart);
  const bySource = (list: { source: string }[], s: string) =>
    list.filter((e) => e.source === s).length;

  // daily series
  const days: { dia: string; nfc: number; qr: number; total: number }[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const dayEvents = data.events.filter(
      (e) => new Date(e.created_at) >= d && new Date(e.created_at) < next,
    );
    days.push({
      dia: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      nfc: bySource(dayEvents, "nfc"),
      qr: bySource(dayEvents, "qr"),
      total: dayEvents.length,
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const followupsHoje = data.followups.filter((f) => f.data === todayStr && f.status === "pendente");
  const followupsAtrasados = data.followups.filter(
    (f) => f.data < todayStr && f.status === "pendente",
  );

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Indicadores calculados a partir dos dados reais da plataforma."
        action={
          <div className="flex gap-1 rounded-lg border border-border p-1">
            {([7, 30, 90] as Range[]).map((r) => (
              <Button
                key={r}
                size="sm"
                variant={range === r ? "default" : "ghost"}
                onClick={() => setRange(r)}
              >
                {r} dias
              </Button>
            ))}
          </div>
        }
      />

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Prospecção
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Leads" value={num(data.leads.length)} />
            <Metric label="Leads novos" value={num(countStage("novo"))} />
            <Metric label="Contatados" value={num(countStage("contatado"))} />
            <Metric label="Interessados" value={num(countStage("interessado"))} />
            <Metric label="Propostas abertas" value={num(countStage("proposta"))} />
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Vendas (mês atual)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Vendas no mês" value={num(monthSales.length)} />
              <Metric label="Faturamento" value={brl(faturamento)} />
              <Metric label="Ticket médio" value={brl(ticket)} />
              <Metric label="Taxa de conversão" value={`${conversao.toFixed(1)}%`} />
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Clientes e placas
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric
                label="Clientes ativos"
                value={num(data.clients.filter((c) => c.status === "ativo").length)}
              />
              <Metric
                label="Novos clientes (mês)"
                value={num(data.clients.filter((c) => c.created_at >= data.monthStart).length)}
              />
              <Metric label="Placas totais" value={num(data.plates.length)} />
              <Metric
                label="Placas ativas"
                value={num(data.plates.filter((p) => p.status === "ativa").length)}
                hint={`${data.plates.filter((p) => p.status === "producao").length} em produção · ${
                  data.plates.filter((p) => ["inativa", "pausada"].includes(p.status)).length
                } inativas/pausadas`}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Interações NFC/QR
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric
              label="Hoje"
              value={num(eventsToday.length)}
              hint={`NFC ${bySource(eventsToday, "nfc")} · QR ${bySource(eventsToday, "qr")}`}
            />
            <Metric
              label="7 dias"
              value={num(inRange(7).length)}
              hint={`NFC ${bySource(inRange(7), "nfc")} · QR ${bySource(inRange(7), "qr")}`}
            />
            <Metric
              label="30 dias"
              value={num(inRange(30).length)}
              hint={`NFC ${bySource(inRange(30), "nfc")} · QR ${bySource(inRange(30), "qr")}`}
            />
            <Metric
              label="Mês atual"
              value={num(monthEvents.length)}
              hint={`NFC ${bySource(monthEvents, "nfc")} · QR ${bySource(monthEvents, "qr")}`}
            />
            <Metric
              label="Total histórico"
              value={num(data.allEvents.length)}
              hint={`NFC ${bySource(data.allEvents, "nfc")} · QR ${bySource(data.allEvents, "qr")}`}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Os valores representam interações/acessos registrados, não pessoas únicas.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interações — últimos {range} dias</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="dia" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--electric)"
                    fill="var(--electric-soft)"
                    strokeWidth={2}
                    name="Interações"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">NFC × QR Code</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="dia" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="nfc" name="NFC" fill="var(--electric)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="qr" name="QR" fill="var(--chart-2)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <Metric
            label="Follow-ups de hoje"
            value={num(followupsHoje.length)}
            hint={followupsHoje.length ? "Pendentes para hoje" : "Nenhum agendado"}
          />
          <Metric
            label="Follow-ups atrasados"
            value={num(followupsAtrasados.length)}
            hint={
              followupsAtrasados.length
                ? `Mais antigo: ${dateBR(followupsAtrasados[0]?.data)}`
                : "Nada em atraso"
            }
          />
        </section>
      </div>
    </div>
  );
}
