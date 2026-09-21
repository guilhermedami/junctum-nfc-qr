import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { dateBR, FOLLOWUP_TYPES } from "@/lib/junctum";

export const Route = createFileRoute("/_authenticated/followups")({
  component: Followups,
});

function Followups() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    lead_id: "",
    tipo: "ligacao",
    data: new Date().toISOString().slice(0, 10),
    hora: "",
    prioridade: "media",
    observacao: "",
  });

  const { data: followups = [] } = useQuery({
    queryKey: ["followups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("followups")
        .select("*, leads(nome_empresa)")
        .order("data");
      if (error) throw error;
      return data;
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("id, nome_empresa");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("followups").insert({
        lead_id: form.lead_id || null,
        tipo: form.tipo,
        data: form.data,
        hora: form.hora || null,
        prioridade: form.prioridade,
        observacao: form.observacao || null,
        owner_id: userData.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Follow-up agendado");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["followups"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const complete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("followups")
        .update({ status: "concluido", concluido_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const today = new Date().toISOString().slice(0, 10);
  const pendentes = followups.filter((f) => f.status === "pendente");
  const groups = [
    { title: "Atrasados", items: pendentes.filter((f) => f.data < today) },
    { title: "Hoje", items: pendentes.filter((f) => f.data === today) },
    { title: "Próximos", items: pendentes.filter((f) => f.data > today) },
    { title: "Concluídos", items: followups.filter((f) => f.status === "concluido") },
  ];

  return (
    <div>
      <PageHeader
        title="Follow-ups"
        description="Tarefas comerciais ligadas aos leads."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" /> Novo follow-up
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo follow-up</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Lead</Label>
                  <Select
                    value={form.lead_id}
                    onValueChange={(v) => setForm({ ...form, lead_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.nome_empresa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FOLLOWUP_TYPES).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Prioridade</Label>
                    <Select
                      value={form.prioridade}
                      onValueChange={(v) => setForm({ ...form, prioridade: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="data">Data</Label>
                    <Input
                      id="data"
                      type="date"
                      value={form.data}
                      onChange={(e) => setForm({ ...form, data: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hora">Horário</Label>
                    <Input
                      id="hora"
                      type="time"
                      value={form.hora}
                      onChange={(e) => setForm({ ...form, hora: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="obs">Observação</Label>
                  <Textarea
                    id="obs"
                    value={form.observacao}
                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => create.mutate()}>Agendar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {g.title} ({g.items.length})
            </h2>
            <div className="space-y-2">
              {g.items.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{FOLLOWUP_TYPES[f.tipo] ?? f.tipo}</Badge>
                      {f.prioridade === "alta" && <Badge variant="destructive">Alta</Badge>}
                      <span className="text-sm font-medium">
                        {f.lead_id ? (
                          <Link
                            to="/leads/$id"
                            params={{ id: f.lead_id }}
                            className="hover:text-electric"
                          >
                            {(f.leads as { nome_empresa: string } | null)?.nome_empresa ?? "Lead"}
                          </Link>
                        ) : (
                          "Sem lead"
                        )}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {dateBR(f.data)} {f.hora ? `· ${String(f.hora).slice(0, 5)}` : ""}{" "}
                      {f.observacao ? `· ${f.observacao}` : ""}
                    </p>
                  </div>
                  {f.status === "pendente" && (
                    <Button size="sm" variant="outline" onClick={() => complete.mutate(f.id)}>
                      <Check className="mr-1.5 size-3.5" /> Concluir
                    </Button>
                  )}
                </div>
              ))}
              {!g.items.length && <p className="text-sm text-muted-foreground">Nada aqui.</p>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
