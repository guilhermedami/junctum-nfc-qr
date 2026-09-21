import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Settings2, GripVertical } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { brl, daysSince, dateBR } from "@/lib/junctum";
import { useRole } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type Stage = Database["public"]["Tables"]["pipeline_stages"]["Row"];

export const Route = createFileRoute("/_authenticated/crm")({
  component: Crm,
});

function Crm() {
  const queryClient = useQueryClient();
  const { data: role } = useRole();
  const [dragging, setDragging] = useState<string | null>(null);
  const [newLead, setNewLead] = useState({ nome_empresa: "", telefone: "", valor: "" });
  const [openLead, setOpenLead] = useState(false);
  const [openStage, setOpenStage] = useState(false);
  const [stageName, setStageName] = useState("");

  const { data: stages = [] } = useQuery({
    queryKey: ["stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_stages")
        .select("*")
        .eq("arquivada", false)
        .order("posicao");
      if (error) throw error;
      return data as Stage[];
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Lead[];
    },
  });

  const moveLead = useMutation({
    mutationFn: async ({ leadId, stageId }: { leadId: string; stageId: string }) => {
      const { error } = await supabase.from("leads").update({ stage_id: stageId }).eq("id", leadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createLead = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("leads").insert({
        nome_empresa: newLead.nome_empresa,
        telefone: newLead.telefone || null,
        whatsapp: newLead.telefone || null,
        valor_estimado: newLead.valor ? Number(newLead.valor) : 0,
        stage_id: stages[0]?.id ?? null,
        owner_id: userData.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead criado");
      setNewLead({ nome_empresa: "", telefone: "", valor: "" });
      setOpenLead(false);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createStage = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pipeline_stages").insert({
        nome: stageName,
        posicao: (stages[stages.length - 1]?.posicao ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Etapa criada");
      setStageName("");
      setOpenStage(false);
      queryClient.invalidateQueries({ queryKey: ["stages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pipeline_stages")
        .update({ arquivada: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Etapa arquivada");
      queryClient.invalidateQueries({ queryKey: ["stages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="CRM"
        description="Arraste os cards entre etapas. Cada mudança gera um registro no histórico do lead."
        action={
          <div className="flex gap-2">
            {role === "admin" && (
              <Dialog open={openStage} onOpenChange={setOpenStage}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings2 className="mr-2 size-4" /> Nova etapa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova etapa do pipeline</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="stage">Nome</Label>
                    <Input
                      id="stage"
                      value={stageName}
                      onChange={(e) => setStageName(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button disabled={!stageName} onClick={() => createStage.mutate()}>
                      Criar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={openLead} onOpenChange={setOpenLead}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" /> Novo lead
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo lead</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input
                      id="empresa"
                      value={newLead.nome_empresa}
                      onChange={(e) => setNewLead({ ...newLead, nome_empresa: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tel">Telefone / WhatsApp</Label>
                    <Input
                      id="tel"
                      value={newLead.telefone}
                      onChange={(e) => setNewLead({ ...newLead, telefone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="valor">Valor estimado (R$)</Label>
                    <Input
                      id="valor"
                      type="number"
                      value={newLead.valor}
                      onChange={(e) => setNewLead({ ...newLead, valor: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button disabled={!newLead.nome_empresa} onClick={() => createLead.mutate()}>
                    Criar lead
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage_id === stage.id);
          const total = stageLeads.reduce((acc, l) => acc + Number(l.valor_estimado ?? 0), 0);
          return (
            <div
              key={stage.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragging) moveLead.mutate({ leadId: dragging, stageId: stage.id });
                setDragging(null);
              }}
              className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/30"
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{stage.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {stageLeads.length} · {brl(total)}
                  </p>
                </div>
                {role === "admin" && (
                  <button
                    onClick={() => archiveStage.mutate(stage.id)}
                    className="text-xs text-muted-foreground hover:text-destructive"
                    title="Arquivar etapa"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="space-y-2 p-2">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDragging(lead.id)}
                    className="rounded-md border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/leads/$id"
                          params={{ id: lead.id }}
                          className="block truncate text-sm font-medium hover:text-electric"
                        >
                          {lead.nome_empresa}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {lead.responsavel ?? "Sem responsável"}
                        </p>
                        <p className="text-xs text-muted-foreground">{lead.telefone ?? "—"}</p>
                        <p className="mt-1.5 text-sm font-semibold tabular-nums">
                          {brl(lead.valor_estimado)}
                        </p>
                        <div className="mt-1.5 space-y-0.5 text-[11px] text-muted-foreground">
                          <p>Último contato: {dateBR(lead.ultimo_contato_at)}</p>
                          <p>Próxima ação: {lead.proxima_acao ?? "—"}</p>
                          <p>{daysSince(lead.stage_changed_at)} dia(s) nesta etapa</p>
                        </div>
                        <Select
                          value={lead.stage_id ?? ""}
                          onValueChange={(v) => moveLead.mutate({ leadId: lead.id, stageId: v })}
                        >
                          <SelectTrigger className="mt-2 h-8 text-xs lg:hidden">
                            <SelectValue placeholder="Mover" />
                          </SelectTrigger>
                          <SelectContent>
                            {stages.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
                {!stageLeads.length && (
                  <p className="px-2 py-6 text-center text-xs text-muted-foreground">Vazio</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
