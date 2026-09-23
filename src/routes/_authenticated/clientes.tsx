import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { CLIENT_STATUS, dateBR, num } from "@/lib/junctum";
import type { SupabaseClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: Clientes,
});

const FIELDS = [
  ["nome_empresa", "Empresa"],
  ["responsavel", "Responsável"],
  ["cnpj", "CNPJ"],
  ["telefone", "Telefone"],
  ["whatsapp", "WhatsApp"],
  ["email", "E-mail"],
  ["instagram", "Instagram"],
  ["site", "Site"],
  ["endereco", "Endereço"],
  ["cidade", "Cidade"],
  ["estado", "Estado"],
  ["plano", "Plano"],
  ["google_business_url", "Google Business (URL)"],
  ["google_review_url", "Google Avaliações (URL)"],
] as const;

function Clientes() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [leadId, setLeadId] = useState("");
  const [valor, setValor] = useState("");
  const [reviewsStart, setReviewsStart] = useState("");

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: wonLeads = [] } = useQuery({
    queryKey: ["won-leads"],
    queryFn: async () => {
      const { data: stages } = await supabase
        .from("pipeline_stages")
        .select("id")
        .eq("tipo", "ganho");
      const ids = (stages ?? []).map((s) => s.id);
      if (!ids.length) return [];
      const { data, error } = await supabase.from("leads").select("*").in("stage_id", ids);
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      const { data: client, error } = await supabase
        .from("clients")
        .insert({
          ...form,
          nome_empresa: form["nome_empresa"] ?? "",
          lead_id: leadId || null,
          owner_id: uid,
          reviews_at_start: reviewsStart ? Number(reviewsStart) : null,
          reviews_current: reviewsStart ? Number(reviewsStart) : null,
          reviews_last_updated_at: reviewsStart ? new Date().toISOString() : null,
        })
        .select()
        .single();
      if (error) throw error;
      if (valor || leadId) {
        await supabase.from("sales").insert({
          lead_id: leadId || null,
          client_id: client.id,
          valor: Number(valor || 0),
          plano: form["plano"] ?? null,
          vendedor_id: uid,
        });
      }
    },
    onSuccess: () => {
      toast.success("Cliente cadastrado");
      setForm({});
      setLeadId("");
      setValor("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateReviews = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: number }) => {
      const { error } = await (supabase as SupabaseClient).rpc("record_review_snapshot", {
        p_client_id: id,
        p_total: value,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avaliações atualizadas");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Converta leads com venda fechada em clientes e acompanhe as avaliações do Google."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" /> Novo cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Converter em cliente</DialogTitle>
                <DialogDescription>
                  Selecione um lead com venda fechada para pré-preencher os dados.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label>Lead (venda fechada)</Label>
                <Select
                  value={leadId}
                  onValueChange={(v) => {
                    setLeadId(v);
                    const lead = wonLeads.find((l) => l.id === v);
                    if (lead)
                      setForm({
                        nome_empresa: lead.nome_empresa,
                        responsavel: lead.responsavel ?? "",
                        telefone: lead.telefone ?? "",
                        whatsapp: lead.whatsapp ?? "",
                        email: lead.email ?? "",
                        cidade: lead.cidade ?? "",
                        estado: lead.estado ?? "",
                        endereco: lead.endereco ?? "",
                      });
                    if (lead?.valor_estimado) setValor(String(lead.valor_estimado));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    {wonLeads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.nome_empresa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {FIELDS.map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      value={form[key] ?? ""}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label htmlFor="valor">Valor da venda (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rev">Avaliações no início</Label>
                  <Input
                    id="rev"
                    type="number"
                    value={reviewsStart}
                    onChange={(e) => setReviewsStart(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button disabled={!form["nome_empresa"]} onClick={() => create.mutate()}>
                  Cadastrar cliente
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-3 md:grid-cols-2">
        {clients.map((c) => {
          const diff = (c.reviews_current ?? 0) - (c.reviews_at_start ?? 0);
          return (
            <div key={c.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">{c.nome_empresa}</h3>
                  <p className="text-xs text-muted-foreground">
                    {c.responsavel ?? "—"} · início {dateBR(c.data_inicio)}
                  </p>
                </div>
                <Badge variant={c.status === "ativo" ? "default" : "secondary"}>
                  {CLIENT_STATUS[c.status] ?? c.status}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Avaliações início</p>
                  <p className="font-semibold tabular-nums">
                    {c.reviews_at_start != null ? num(c.reviews_at_start) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Atuais</p>
                  <p className="font-semibold tabular-nums">
                    {c.reviews_current != null ? num(c.reviews_current) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Observadas no período</p>
                  <p className="font-semibold tabular-nums">
                    {c.reviews_at_start != null && c.reviews_current != null
                      ? `${diff >= 0 ? "+" : ""}${num(diff)}`
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Input
                  className="h-9 w-36"
                  type="number"
                  placeholder="Avaliações hoje"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const value = Number((e.target as HTMLInputElement).value);
                      if (Number.isInteger(value) && value >= 0)
                        updateReviews.mutate({ id: c.id, value });
                    }
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  Enter para atualizar manualmente
                </span>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/placas">Placas do cliente</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/relatorios/$id" params={{ id: c.id }}>
                    Relatório
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
        {!clients.length && (
          <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>
        )}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        As novas avaliações observadas são apresentadas separadamente das interações da placa — não
        existe relação de causalidade comprovada. A integração oficial com a API do Google não está
        configurada; a atualização é manual.
      </p>
    </div>
  );
}
