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
import { dateBR, isValidHttpUrl, PLATE_STATUS } from "@/lib/junctum";

export const Route = createFileRoute("/_authenticated/placas")({
  component: Placas,
});

function Placas() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    codigo_interno: "",
    client_id: "",
    plate_type_id: "",
    destination_url: "",
    status: "producao",
  });

  const { data: plates = [] } = useQuery({
    queryKey: ["plates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plates")
        .select("*, clients(nome_empresa), plate_types(nome)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, nome_empresa");
      if (error) throw error;
      return data;
    },
  });

  const { data: types = [] } = useQuery({
    queryKey: ["plate-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plate_types").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (form.destination_url && !isValidHttpUrl(form.destination_url)) {
        throw new Error("URL de destino inválida (use http:// ou https://)");
      }
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("plates").insert({
        nome: form.nome,
        codigo_interno: form.codigo_interno || null,
        client_id: form.client_id || null,
        plate_type_id: form.plate_type_id || null,
        destination_url: form.destination_url || null,
        status: form.status,
        created_by: userData.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Placa criada");
      setForm({
        nome: "",
        codigo_interno: "",
        client_id: "",
        plate_type_id: "",
        destination_url: "",
        status: "producao",
      });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["plates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Placas"
        description="Cada placa física tem registro próprio e um código público não previsível para os links NFC e QR."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" /> Nova placa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova placa</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    placeholder="Google — Balcão"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cod">Código interno</Label>
                  <Input
                    id="cod"
                    value={form.codigo_interno}
                    onChange={(e) => setForm({ ...form, codigo_interno: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cliente</Label>
                  <Select
                    value={form.client_id}
                    onValueChange={(v) => setForm({ ...form, client_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome_empresa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select
                    value={form.plate_type_id}
                    onValueChange={(v) => setForm({ ...form, plate_type_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de placa" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dest">URL de destino</Label>
                  <Input
                    id="dest"
                    placeholder="https://..."
                    value={form.destination_url}
                    onChange={(e) => setForm({ ...form, destination_url: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLATE_STATUS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button disabled={!form.nome} onClick={() => create.mutate()}>
                  Criar placa
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Placa</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Código público</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ativação</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {plates.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{p.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {(p.clients as { nome_empresa: string } | null)?.nome_empresa ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {(p.plate_types as { nome: string } | null)?.nome ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{p.public_id}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.status === "ativa" ? "default" : "secondary"}>
                    {PLATE_STATUS[p.status] ?? p.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{dateBR(p.data_ativacao)}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/placas/$id" params={{ id: p.id }}>
                      Abrir
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
            {!plates.length && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  Nenhuma placa cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
