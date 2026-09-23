import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brl, dateBR, GOAL_METRICS, num } from "@/lib/junctum";

export const Route = createFileRoute("/_authenticated/metas")({
  component: Metas,
});

function Metas() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  const [form, setForm] = useState({
    metrica: "vendas",
    periodo: "mensal",
    data_inicio: monthStart.toISOString().slice(0, 10),
    data_fim: monthEnd.toISOString().slice(0, 10),
    alvo: "",
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("goals").select("*").order("data_inicio");
      if (error) throw error;
      return data;
    },
  });

  const { data: realized } = useQuery({
    queryKey: ["goals-realized"],
    queryFn: async () => {
      const [companies, leads, sales, clients, followups, activities] = await Promise.all([
        supabase.from("companies").select("id, created_at"),
        supabase.from("leads").select("id, created_at"),
        supabase.from("sales").select("id, valor, data_venda"),
        supabase.from("clients").select("id, created_at"),
        supabase.from("followups").select("id, data, status"),
        supabase.from("activities").select("id, tipo, created_at"),
      ]);
      return {
        companies: companies.data ?? [],
        leads: leads.data ?? [],
        sales: sales.data ?? [],
        clients: clients.data ?? [],
        followups: followups.data ?? [],
        activities: activities.data ?? [],
      };
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        metrica: form.metrica,
        periodo: form.periodo,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
        alvo: Number(form.alvo || 0),
      };
      if (editingId) {
        const { error } = await supabase.from("goals").update(payload).eq("id", editingId);
        if (error) throw error;
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("goals")
        .insert({ ...payload, owner_id: userData.user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editingId ? "Meta atualizada" : "Meta criada");
      setOpen(false);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Meta excluída");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openNew() {
    setEditingId(null);
    setForm({
      metrica: "vendas",
      periodo: "mensal",
      data_inicio: monthStart.toISOString().slice(0, 10),
      data_fim: monthEnd.toISOString().slice(0, 10),
      alvo: "",
    });
    setOpen(true);
  }

  function openEdit(g: {
    id: string;
    metrica: string;
    periodo: string;
    data_inicio: string;
    data_fim: string;
    alvo: number;
  }) {
    setEditingId(g.id);
    setForm({
      metrica: g.metrica,
      periodo: g.periodo,
      data_inicio: g.data_inicio,
      data_fim: g.data_fim,
      alvo: String(g.alvo ?? ""),
    });
    setOpen(true);
  }

  function computeRealized(metrica: string, start: string, end: string) {
    if (!realized) return 0;
    const inWindow = (date: string) => date >= start && date <= `${end}T23:59:59`;
    switch (metrica) {
      case "prospeccoes":
        return realized.companies.filter((c) => inWindow(c.created_at)).length;
      case "contatos":
        return realized.activities.filter(
          (a) => a.tipo === "nota" && inWindow(a.created_at),
        ).length;
      case "visitas":
        return realized.activities.filter(
          (a) => a.tipo === "visita" && inWindow(a.created_at),
        ).length;
      case "propostas":
        return realized.activities.filter(
          (a) => a.tipo === "proposta" && inWindow(a.created_at),
        ).length;
      case "followups":
        return realized.followups.filter((f) => f.status === "concluido" && inWindow(f.data))
          .length;
      case "vendas":
        return realized.sales.filter((s) => inWindow(s.data_venda)).length;
      case "faturamento":
        return realized.sales
          .filter((s) => inWindow(s.data_venda))
          .reduce((acc, s) => acc + Number(s.valor ?? 0), 0);
      case "novos_clientes":
        return realized.clients.filter((c) => inWindow(c.created_at)).length;
      default:
        return 0;
    }
  }

  return (
    <div>
      <PageHeader
        title="Metas"
        description="Metas comparadas com o realizado calculado a partir dos dados reais."
        action={
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) setEditingId(null);
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="mr-2 size-4" /> Nova meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar meta" : "Nova meta"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Métrica</Label>
                  <Select
                    value={form.metrica}
                    onValueChange={(v) => setForm({ ...form, metrica: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GOAL_METRICS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Período</Label>
                  <Select
                    value={form.periodo}
                    onValueChange={(v) => setForm({ ...form, periodo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diaria">Diária</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="personalizada">Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ini">Início</Label>
                    <Input
                      id="ini"
                      type="date"
                      value={form.data_inicio}
                      onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fim">Fim</Label>
                    <Input
                      id="fim"
                      type="date"
                      value={form.data_fim}
                      onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="alvo">Meta</Label>
                  <Input
                    id="alvo"
                    type="number"
                    value={form.alvo}
                    onChange={(e) => setForm({ ...form, alvo: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button disabled={!form.alvo} onClick={() => create.mutate()}>
                  Criar meta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        {goals.map((g) => {
          const done = computeRealized(g.metrica, g.data_inicio, g.data_fim);
          const target = Number(g.alvo ?? 0);
          const pct = target ? Math.min(100, (done / target) * 100) : 0;
          const isMoney = g.metrica === "faturamento";
          const fmt = (v: number) => (isMoney ? brl(v) : num(v));
          return (
            <div key={g.id} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {GOAL_METRICS[g.metrica] ?? g.metrica}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {dateBR(g.data_inicio)} – {dateBR(g.data_fim)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Meta</p>
                  <p className="font-semibold tabular-nums">{fmt(target)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Realizado</p>
                  <p className="font-semibold tabular-nums">{fmt(done)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Faltante</p>
                  <p className="font-semibold tabular-nums">{fmt(Math.max(0, target - done))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">%</p>
                  <p className="font-semibold tabular-nums">{pct.toFixed(0)}%</p>
                </div>
              </div>
              <Progress value={pct} className="mt-4" />
            </div>
          );
        })}
        {!goals.length && <p className="text-sm text-muted-foreground">Nenhuma meta definida.</p>}
      </div>
    </div>
  );
}
