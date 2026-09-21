import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Plus, ArrowRightCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { dateBR } from "@/lib/junctum";

export const Route = createFileRoute("/_authenticated/prospeccao")({
  component: Prospeccao,
});

const FIELDS = [
  "nome_empresa",
  "nome_fantasia",
  "cnpj",
  "segmento",
  "categoria",
  "responsavel",
  "telefone",
  "whatsapp",
  "email",
  "instagram",
  "site",
  "google_url",
  "endereco",
  "bairro",
  "cidade",
  "estado",
  "cep",
  "observacoes",
] as const;

const LABELS: Record<string, string> = {
  nome_empresa: "Nome da empresa",
  nome_fantasia: "Nome fantasia",
  cnpj: "CNPJ",
  segmento: "Segmento",
  categoria: "Categoria",
  responsavel: "Responsável",
  telefone: "Telefone",
  whatsapp: "WhatsApp",
  email: "E-mail",
  instagram: "Instagram",
  site: "Site",
  google_url: "Google",
  endereco: "Endereço",
  bairro: "Bairro",
  cidade: "Cidade",
  estado: "Estado",
  cep: "CEP",
  observacoes: "Observações",
};

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = line.split(sep);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      if ((FIELDS as readonly string[]).includes(h)) row[h] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

function Prospeccao() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ nome: "", cidade: "", estado: "", segmento: "" });
  const [form, setForm] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });
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

  const createCompany = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("companies").insert({
        ...payload,
        nome_empresa: payload.nome_empresa,
        owner_id: userData.user?.id ?? null,
        created_by: userData.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Empresa cadastrada");
      setForm({});
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importCsv = useMutation({
    mutationFn: async (rows: Record<string, string>[]) => {
      const { data: userData } = await supabase.auth.getUser();
      const valid = rows.filter((r) => r.nome_empresa);
      if (!valid.length) throw new Error("Nenhuma linha válida (coluna nome_empresa obrigatória)");
      const { error } = await supabase.from("companies").insert(
        valid.map((r) => ({
          ...r,
          origem: "csv",
          owner_id: userData.user?.id ?? null,
          created_by: userData.user?.id ?? null,
        })),
      );
      if (error) throw error;
      return valid.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} empresas importadas`);
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toCrm = useMutation({
    mutationFn: async (company: Record<string, unknown>) => {
      const { data: userData } = await supabase.auth.getUser();
      const firstStage = stages[0];
      const { error } = await supabase.from("leads").insert({
        company_id: company.id as string,
        nome_empresa: company.nome_empresa as string,
        responsavel: (company.responsavel as string) ?? null,
        telefone: (company.telefone as string) ?? null,
        whatsapp: (company.whatsapp as string) ?? null,
        email: (company.email as string) ?? null,
        cidade: (company.cidade as string) ?? null,
        estado: (company.estado as string) ?? null,
        endereco: (company.endereco as string) ?? null,
        segmento: (company.segmento as string) ?? null,
        stage_id: firstStage?.id ?? null,
        owner_id: userData.user?.id ?? null,
      });
      if (error) throw error;
      await supabase
        .from("companies")
        .update({ status: "no_crm" })
        .eq("id", company.id as string);
    },
    onSuccess: () => {
      toast.success("Adicionado ao CRM");
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(
    () =>
      companies.filter((c) => {
        const match = (v: string | null, f: string) =>
          !f || (v ?? "").toLowerCase().includes(f.toLowerCase());
        return (
          match(c.nome_empresa, filters.nome) &&
          match(c.cidade, filters.cidade) &&
          match(c.estado, filters.estado) &&
          match(c.segmento, filters.segmento)
        );
      }),
    [companies, filters],
  );

  return (
    <div>
      <PageHeader
        title="Prospecção"
        description="Cadastre empresas manualmente ou importe um CSV. Nenhum dado é inventado pela plataforma."
        action={
          <div className="flex gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                importCsv.mutate(parseCsv(await file.text()));
                e.target.value = "";
              }}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 size-4" /> Importar CSV
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" /> Nova empresa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nova empresa</DialogTitle>
                  <DialogDescription>
                    Apenas o nome da empresa é obrigatório.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 sm:grid-cols-2">
                  {FIELDS.map((f) =>
                    f === "observacoes" ? (
                      <div key={f} className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor={f}>{LABELS[f]}</Label>
                        <Textarea
                          id={f}
                          value={form[f] ?? ""}
                          onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div key={f} className="space-y-1.5">
                        <Label htmlFor={f}>{LABELS[f]}</Label>
                        <Input
                          id={f}
                          value={form[f] ?? ""}
                          onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                        />
                      </div>
                    ),
                  )}
                </div>
                <DialogFooter>
                  <Button
                    disabled={!form.nome_empresa || createCompany.isPending}
                    onClick={() => createCompany.mutate(form)}
                  >
                    Salvar empresa
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        {(["nome", "cidade", "estado", "segmento"] as const).map((f) => (
          <Input
            key={f}
            placeholder={f === "nome" ? "Buscar nome" : `Filtrar ${f}`}
            value={filters[f]}
            onChange={(e) => setFilters({ ...filters, [f]: e.target.value })}
          />
        ))}
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Integração com API de dados empresariais: estrutura preparada (campo origem), aguardando
        definição de um provedor legítimo e respetiva chave.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Local</th>
              <th className="px-4 py-3">Segmento</th>
              <th className="px-4 py-3">Origem</th>
              <th className="px-4 py-3">Criado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <p className="font-medium">{c.nome_empresa}</p>
                  <p className="text-xs text-muted-foreground">{c.nome_fantasia ?? ""}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.telefone ?? c.whatsapp ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {[c.cidade, c.estado].filter(Boolean).join(" / ") || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.segmento ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">{c.origem ?? "manual"}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{dateBR(c.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  {c.status === "no_crm" ? (
                    <Badge>No CRM</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => toCrm.mutate(c)}>
                      <ArrowRightCircle className="mr-1.5 size-3.5" /> Adicionar ao CRM
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhuma empresa cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
