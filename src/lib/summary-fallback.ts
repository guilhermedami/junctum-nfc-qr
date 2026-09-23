import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AccessSummary } from "@/lib/access-summary";
import type { CommercialSummary } from "@/lib/commercial-summary";

const db = supabase as SupabaseClient;
const PAGE = 1000;
const zone = "America/Sao_Paulo";
const dayInBrazil = (value: Date) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
const midnight = (date: string) => new Date(`${date}T03:00:00.000Z`).toISOString();
const nextDay = (date: string) => {
  const value = new Date(midnight(date));
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString();
};

async function allRows<T>(table: string, columns: string, since?: string): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE) {
    let query = db.from(table).select(columns).order("id").range(offset, offset + PAGE - 1);
    if (since) query = query.gte("created_at", since);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) return rows;
  }
}

export async function fallbackCommercialSummary(): Promise<CommercialSummary> {
  type Lead = { stage_id: string | null };
  type Stage = { id: string; nome: string };
  type Sale = { valor: number | null; data_venda: string };
  type Client = { status: string; created_at: string };
  type Plate = { status: string };
  type Followup = { data: string; status: string };
  const [leads, stages, sales, clients, plates, followups] = await Promise.all([
    allRows<Lead>("leads", "id,stage_id"),
    allRows<Stage>("pipeline_stages", "id,nome"),
    allRows<Sale>("sales", "id,valor,data_venda"),
    allRows<Client>("clients", "id,status,created_at"),
    allRows<Plate>("plates", "id,status"),
    allRows<Followup>("followups", "id,data,status"),
  ]);
  const today = dayInBrazil(new Date());
  const month = today.slice(0, 7);
  const stageNames = new Map(stages.map((s) => [s.id, s.nome.toLowerCase()]));
  const inStage = (name: string) => leads.filter((l) => stageNames.get(l.stage_id ?? "")?.includes(name)).length;
  const monthSales = sales.filter((s) => s.data_venda?.startsWith(month));
  const overdue = followups.filter((f) => f.status === "pendente" && f.data < today);
  return {
    migrationPending: true,
    leads: { total: leads.length, novos: inStage("novo"), contatados: inStage("contatado"),
      interessados: inStage("interessado"), propostas: inStage("proposta") },
    sales: { total: sales.length, mes: monthSales.length,
      faturamento: monthSales.reduce((sum, s) => sum + Number(s.valor ?? 0), 0) },
    clients: { ativos: clients.filter((c) => c.status === "ativo").length,
      novos: clients.filter((c) => c.created_at?.slice(0, 7) === month).length },
    plates: { total: plates.length, ativas: plates.filter((p) => p.status === "ativa").length,
      producao: plates.filter((p) => p.status === "producao").length,
      inativas: plates.filter((p) => ["inativa", "pausada"].includes(p.status)).length },
    followups: { hoje: followups.filter((f) => f.status === "pendente" && f.data === today).length,
      atrasados: overdue.length, mais_antigo: overdue.map((f) => f.data).sort()[0] ?? null },
  };
}

export async function fallbackAccessSummary(options: {
  plateId?: string; clientId?: string; days?: number; from?: string; to?: string;
}): Promise<AccessSummary> {
  const today = dayInBrazil(new Date());
  const dayAgo = (n: number) => {
    const d = new Date(midnight(today));
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString();
  };
  const base = () => {
    let q = db.from("access_events").select("id", { count: "exact", head: true });
    if (options.plateId) q = q.eq("plate_id", options.plateId);
    if (options.clientId) q = q.eq("client_id", options.clientId);
    return q;
  };
  const count = async (source?: string, since?: string) => {
    let q = base();
    if (source) q = q.eq("source", source);
    if (since) q = q.gte("created_at", since);
    const { count, error } = await q;
    if (error) throw error;
    return count ?? 0;
  };
  const start = options.from ?? dayInBrazil(new Date(dayAgo((options.days ?? 30) - 1)));
  const end = options.to ?? today;
  const [total, nfc, qr, todayCount, last7, last30, month] = await Promise.all([
    count(), count("nfc"), count("qr"), count(undefined, midnight(today)),
    count(undefined, dayAgo(6)), count(undefined, dayAgo(29)),
    count(undefined, midnight(`${today.slice(0, 7)}-01`)),
  ]);
  const series: AccessSummary["series"] = [];
  for (let offset = 0; ; offset += PAGE) {
    let q = db.from("access_events").select("id,source,created_at").gte("created_at", midnight(start))
      .lt("created_at", nextDay(end)).order("id").range(offset, offset + PAGE - 1);
    if (options.plateId) q = q.eq("plate_id", options.plateId);
    if (options.clientId) q = q.eq("client_id", options.clientId);
    const { data, error } = await q;
    if (error) throw error;
    for (const event of data ?? []) {
      const day = dayInBrazil(new Date(event.created_at));
      let bucket = series.find((s) => s.day === day);
      if (!bucket) { bucket = { day, total: 0, nfc: 0, qr: 0 }; series.push(bucket); }
      bucket.total++;
      if (event.source === "nfc") bucket.nfc++;
      if (event.source === "qr") bucket.qr++;
    }
    if (!data || data.length < PAGE) break;
  }
  series.sort((a, b) => a.day.localeCompare(b.day));
  return { migrationPending: true, all: { total, nfc, qr }, today: todayCount, last7, last30, month, series };
}
