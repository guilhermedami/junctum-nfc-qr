import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Phone, MessageCircle, MapPin, CalendarPlus, FileText, CheckCircle2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brl, dateBR, mapsLink, whatsappLink } from "@/lib/junctum";

export const Route = createFileRoute("/_authenticated/leads/$id")({
  component: LeadDetail,
});

function LeadDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [nota, setNota] = useState("");

  const { data: lead } = useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: stages = [] } = useQuery({
    queryKey: ["stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_stages")
        .select("*")
        .eq("arquivada", false)
        .order("posicao");
      if (error) throw error;
      return data;
    },
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: followups = [] } = useQuery({
    queryKey: ["followups", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("followups")
        .select("*")
        .eq("lead_id", id)
        .order("data");
      if (error) throw error;
      return data;
    },
  });

  const logActivity = useMutation({
    mutationFn: async ({ tipo, descricao }: { tipo: string; descricao: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("activities")
        .insert({ lead_id: id, tipo, descricao, user_id: userData.user?.id ?? null });
      if (error) throw error;
      await supabase
        .from("leads")
        .update({ ultimo_contato_at: new Date().toISOString() })
        .eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", id] });
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      setNota("");
      toast.success("Registro adicionado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changeStage = useMutation({
    mutationFn: async (stageId: string) => {
      const { error } = await supabase.from("leads").update({ stage_id: stageId }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      queryClient.invalidateQueries({ queryKey: ["activities", id] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!lead) return <p className="text-sm text-muted-foreground">Carregando lead…</p>;

  const wa = whatsappLink(lead.whatsapp ?? lead.telefone);
  const maps = mapsLink([lead.endereco, lead.cidade, lead.estado]);
  const stageNome = stages.find((s) => s.id === lead.stage_id)?.nome ?? "—";
  const isGanho = stages.find((s) => s.id === lead.stage_id)?.tipo === "ganho";

  return (
    <div>
      <PageHeader
        title={lead.nome_empresa}
        description={`${lead.responsavel ?? "Sem responsável"} · ${stageNome}`}
        action={
          <Select value={lead.stage_id ?? ""} onValueChange={(v) => changeStage.mutate(v)}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Etapa" />
            </SelectTrigger>
            <SelectContent>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {lead.telefone && (
          <Button variant="outline" size="sm" asChild>
            <a href={`tel:${lead.telefone}`}>
              <Phone className="mr-1.5 size-3.5" /> Ligar
            </a>
          </Button>
        )}
        {wa && (
          <Button variant="outline" size="sm" asChild>
            <a href={wa} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-1.5 size-3.5" /> WhatsApp
            </a>
          </Button>
        )}
        {maps && (
          <Button variant="outline" size="sm" asChild>
            <a href={maps} target="_blank" rel="noreferrer">
              <MapPin className="mr-1.5 size-3.5" /> Mapa
            </a>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => logActivity.mutate({ tipo: "visita", descricao: "Visita realizada" })}
        >
          <CalendarPlus className="mr-1.5 size-3.5" /> Registrar visita
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => logActivity.mutate({ tipo: "proposta", descricao: "Proposta enviada" })}
        >
          <FileText className="mr-1.5 size-3.5" /> Proposta
        </Button>
        {isGanho && (
          <Button size="sm" asChild>
            <a href="/clientes">
              <CheckCircle2 className="mr-1.5 size-3.5" /> Converter em cliente
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Telefone:</span> {lead.telefone ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">WhatsApp:</span> {lead.whatsapp ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">E-mail:</span> {lead.email ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Local:</span>{" "}
              {[lead.cidade, lead.estado].filter(Boolean).join(" / ") || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Segmento:</span> {lead.segmento ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Valor estimado:</span>{" "}
              {brl(lead.valor_estimado)}
            </p>
            <p>
              <span className="text-muted-foreground">Último contato:</span>{" "}
              {dateBR(lead.ultimo_contato_at)}
            </p>
            <p>
              <span className="text-muted-foreground">Observações:</span> {lead.observacoes ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Follow-ups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {followups.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-2">
                <span>{dateBR(f.data)}</span>
                <Badge variant={f.status === "pendente" ? "secondary" : "outline"}>{f.tipo}</Badge>
              </div>
            ))}
            {!followups.length && <p className="text-muted-foreground">Nenhum agendado.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova observação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={4} />
            <Button
              size="sm"
              disabled={!nota}
              onClick={() => logActivity.mutate({ tipo: "nota", descricao: nota })}
            >
              Registrar
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {activities.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-electric" />
                  <span className="text-muted-foreground">{dateBR(a.created_at)}</span>
                  <span>{a.descricao ?? a.tipo}</span>
                </li>
              ))}
              {!activities.length && (
                <li className="text-sm text-muted-foreground">Sem histórico.</li>
              )}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
