import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, MessageCircle, Copy } from "lucide-react";

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
import { applyTemplate, TEMPLATE_CATEGORIES, whatsappLink } from "@/lib/junctum";
import { useProfile } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/mensagens")({
  component: Mensagens,
});

function Mensagens() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    categoria: "primeiro_contato",
    conteudo: "",
  });
  const [leadId, setLeadId] = useState("");

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("message_templates")
        .insert({ ...form, created_by: userData.user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mensagem salva");
      setForm({ titulo: "", categoria: "primeiro_contato", conteudo: "" });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lead = leads.find((l) => l.id === leadId);
  const render = (content: string) =>
    applyTemplate(content, {
      nome: lead?.responsavel ?? "",
      empresa: lead?.nome_empresa ?? "",
      cidade: lead?.cidade ?? "",
      vendedor: profile?.nome ?? "",
      produto: "placa NFC/QR JUNCTUM",
      valor: lead?.valor_estimado ? String(lead.valor_estimado) : "",
    });

  return (
    <div>
      <PageHeader
        title="Mensagens"
        description="Biblioteca de mensagens comerciais com variáveis {{nome}}, {{empresa}}, {{cidade}}, {{vendedor}}, {{produto}}, {{valor}}."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" /> Nova mensagem
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova mensagem</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Select
                    value={form.categoria}
                    onValueChange={(v) => setForm({ ...form, categoria: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TEMPLATE_CATEGORIES).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="conteudo">Conteúdo</Label>
                  <Textarea
                    id="conteudo"
                    rows={6}
                    value={form.conteudo}
                    onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={!form.titulo || !form.conteudo}
                  onClick={() => create.mutate()}
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-6 max-w-sm space-y-1.5">
        <Label>Pré-visualizar para o lead</Label>
        <Select value={leadId} onValueChange={setLeadId}>
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

      <div className="grid gap-3 md:grid-cols-2">
        {templates.map((t) => {
          const texto = render(t.conteudo);
          const wa = whatsappLink(lead?.whatsapp ?? lead?.telefone, texto);
          return (
            <div key={t.id} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{t.titulo}</h3>
                <Badge variant="secondary">
                  {TEMPLATE_CATEGORIES[t.categoria] ?? t.categoria}
                </Badge>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{texto}</p>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(texto);
                    toast.success("Copiado");
                  }}
                >
                  <Copy className="mr-1.5 size-3.5" /> Copiar
                </Button>
                <Button size="sm" disabled={!wa} asChild={!!wa}>
                  {wa ? (
                    <a href={wa} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-1.5 size-3.5" /> Enviar pelo WhatsApp
                    </a>
                  ) : (
                    <span>
                      <MessageCircle className="mr-1.5 size-3.5" /> Selecione um lead
                    </span>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
        {!templates.length && (
          <p className="text-sm text-muted-foreground">Nenhuma mensagem cadastrada.</p>
        )}
      </div>
    </div>
  );
}
