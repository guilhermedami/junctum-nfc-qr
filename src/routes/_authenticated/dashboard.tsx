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

import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { brl, num, dateBR } from "@/lib/junctum";
import { fetchAccessSummary } from "@/lib/access-summary";
import { fetchCommercialSummary } from "@/lib/commercial-summary";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type Range = 7 | 30 | 90;

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
      const [commercial, access] = await Promise.all([
        fetchCommercialSummary(),
        fetchAccessSummary({ days: range }),
      ]);
      return { commercial, access };
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando dados…</p>;
  }
  if (!data)
    return (
      <p className="text-sm text-destructive">
        Não foi possível carregar o dashboard. Verifique as migrations do banco.
      </p>
    );

  const { commercial } = data;
  const ticket = commercial.sales.mes ? commercial.sales.faturamento / commercial.sales.mes : 0;
  const conversao = commercial.leads.total
    ? (commercial.sales.total / commercial.leads.total) * 100
    : 0;

  // daily series
  const days: { dia: string; nfc: number; qr: number; total: number }[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayEvents = data.access.series.find((e) => e.day === day);
    days.push({
      dia: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      nfc: dayEvents?.nfc ?? 0,
      qr: dayEvents?.qr ?? 0,
      total: dayEvents?.total ?? 0,
    });
  }

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
            <Metric label="Leads" value={num(commercial.leads.total)} />
            <Metric label="Leads novos" value={num(commercial.leads.novos)} />
            <Metric label="Contatados" value={num(commercial.leads.contatados)} />
            <Metric label="Interessados" value={num(commercial.leads.interessados)} />
            <Metric label="Propostas abertas" value={num(commercial.leads.propostas)} />
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Vendas (mês atual)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Vendas no mês" value={num(commercial.sales.mes)} />
              <Metric label="Faturamento" value={brl(commercial.sales.faturamento)} />
              <Metric label="Ticket médio" value={brl(ticket)} />
              <Metric label="Taxa de conversão" value={`${conversao.toFixed(1)}%`} />
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Clientes e placas
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Clientes ativos" value={num(commercial.clients.ativos)} />
              <Metric label="Novos clientes (mês)" value={num(commercial.clients.novos)} />
              <Metric label="Placas totais" value={num(commercial.plates.total)} />
              <Metric
                label="Placas ativas"
                value={num(commercial.plates.ativas)}
                hint={`${commercial.plates.producao} em produção · ${commercial.plates.inativas} inativas/pausadas`}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Interações NFC/QR
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Hoje" value={num(data.access.today)} />
            <Metric label="7 dias" value={num(data.access.last7)} />
            <Metric label="30 dias" value={num(data.access.last30)} />
            <Metric label="Mês atual" value={num(data.access.month)} />
            <Metric
              label="Total histórico"
              value={num(data.access.all.total)}
              hint={`NFC ${num(data.access.all.nfc)} · QR ${num(data.access.all.qr)}`}
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
            value={num(commercial.followups.hoje)}
            hint={commercial.followups.hoje ? "Pendentes para hoje" : "Nenhum agendado"}
          />
          <Metric
            label="Follow-ups atrasados"
            value={num(commercial.followups.atrasados)}
            hint={
              commercial.followups.atrasados
                ? `Mais antigo: ${dateBR(commercial.followups.mais_antigo)}`
                : "Nada em atraso"
            }
          />
        </section>
      </div>
    </div>
  );
}
