import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { ArrowLeft, Copy, Download, ExternalLink, Nfc, QrCode } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dateBR, isValidHttpUrl, num, PLATE_STATUS, trackingUrls } from "@/lib/junctum";

export const Route = createFileRoute("/_authenticated/placas/$id")({
  head: () => ({ meta: [{ title: "Placa — JUNCTUM" }] }),
  component: PlacaDetail,
});

function dt(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium break-all">{value}</div>
    </div>
  );
}

function PlacaDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: plate, isLoading } = useQuery({
    queryKey: ["plate", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plates")
        .select("*, clients(id, nome_empresa, responsavel), plate_types(nome)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["plate-history", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("destination_history")
        .select("*")
        .eq("plate_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["plate-events", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("access_events")
        .select("source, created_at")
        .eq("plate_id", id);
      if (error) throw error;
      return data;
    },
  });

  const [dest, setDest] = useState("");
  const [status, setStatus] = useState("");
  const [venda, setVenda] = useState("");
  const [ativacao, setAtivacao] = useState("");
  useEffect(() => {
    if (plate) {
      setDest(plate.destination_url ?? "");
      setStatus(plate.status);
      setVenda(plate.data_venda ?? "");
      setAtivacao(plate.data_ativacao ?? "");
    }
  }, [plate]);

  const urls = useMemo(() => (plate ? trackingUrls(plate.public_id) : null), [plate]);
  const [qrPng, setQrPng] = useState("");
  const [qrSvg, setQrSvg] = useState("");
  useEffect(() => {
    if (!urls) return;
    QRCode.toDataURL(urls.qr, { width: 1024, margin: 2 }).then(setQrPng);
    QRCode.toString(urls.qr, { type: "svg", margin: 2 }).then(setQrSvg);
  }, [urls]);

  const save = useMutation({
    mutationFn: async () => {
      if (dest && !isValidHttpUrl(dest)) throw new Error("URL de destino inválida (use http:// ou https://)");
      const { error } = await supabase
        .from("plates")
        .update({
          destination_url: dest || null,
          status,
          data_venda: venda || null,
          data_ativacao: ativacao || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Placa atualizada — links NFC/QR mantidos");
      qc.invalidateQueries({ queryKey: ["plate", id] });
      qc.invalidateQueries({ queryKey: ["plate-history", id] });
      qc.invalidateQueries({ queryKey: ["plates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const d7 = now.getTime() - 7 * 86_400_000;
    const d30 = now.getTime() - 30 * 86_400_000;
    const month = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const count = (from: number) => events.filter((e) => new Date(e.created_at).getTime() >= from).length;
    return {
      total: events.length,
      nfc: events.filter((e) => e.source === "nfc").length,
      qr: events.filter((e) => e.source === "qr").length,
      hoje: count(startToday),
      d7: count(d7),
      d30: count(d30),
      mes: count(month),
    };
  }, [events]);

  const copy = (text: string, label: string) =>
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado`));

  const download = (href: string, name: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    a.click();
  };

  if (isLoading) return <div className="p-6 text-muted-foreground">Carregando…</div>;
  if (!plate)
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Placa não encontrada ou sem permissão de acesso.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/placas">Voltar</Link>
        </Button>
      </div>
    );

  const client = plate.clients as { nome_empresa: string; responsavel: string | null } | null;
  const type = plate.plate_types as { nome: string } | null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/placas">
          <ArrowLeft className="mr-2 size-4" /> Placas
        </Link>
      </Button>
      <PageHeader
        title={plate.nome}
        description={`Código público ${plate.public_id}`}
        action={
          <Badge variant={plate.status === "ativa" ? "default" : "secondary"}>
            {PLATE_STATUS[plate.status] ?? plate.status}
          </Badge>
        }
      />

      <section className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-3">
        <Field label="Código interno" value={plate.codigo_interno ?? "—"} />
        <Field label="Empresa" value={client?.nome_empresa ?? "—"} />
        <Field label="Cliente (responsável)" value={client?.responsavel ?? "—"} />
        <Field label="Tipo" value={type?.nome ?? "—"} />
        <Field label="Data da venda" value={dateBR(plate.data_venda)} />
        <Field label="Data da ativação" value={dateBR(plate.data_ativacao)} />
        <Field label="URL de destino atual" value={plate.destination_url ?? "—"} />
        <Field label="Criada em" value={dt(plate.created_at)} />
        <Field label="Última atualização" value={dt(plate.updated_at)} />
      </section>

      {urls && (
        <section className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="space-y-4 rounded-lg border border-border p-4">
            <h2 className="font-semibold">Links permanentes</h2>
            <p className="text-xs text-muted-foreground">
              Estes links nunca mudam, mesmo se o destino for alterado. Grave o link NFC no chip e
              imprima o QR Code com o link QR.
            </p>
            {[
              { k: "NFC", url: urls.nfc, icon: Nfc },
              { k: "QR", url: urls.qr, icon: QrCode },
            ].map(({ k, url, icon: Icon }) => (
              <div key={k} className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Icon className="size-4" /> Link {k}
                </Label>
                <div className="flex gap-2">
                  <Input readOnly value={url} className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={() => copy(url, `Link ${k}`)} aria-label={`Copiar link ${k}`}>
                    <Copy className="size-4" />
                  </Button>
                  <Button size="icon" variant="outline" asChild aria-label={`Testar link ${k}`}>
                    <a href={url} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Cada teste de um link ativo também conta como uma interação. Configure o destino e ative a placa antes de imprimir.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border p-4">
            {qrPng && <img src={qrPng} alt="QR Code da placa" className="size-48 rounded bg-background" />}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={!qrPng} onClick={() => download(qrPng, `junctum-${plate.public_id}.png`)}>
                <Download className="mr-1 size-4" /> PNG
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!qrSvg}
                onClick={() =>
                  download(
                    URL.createObjectURL(new Blob([qrSvg], { type: "image/svg+xml" })),
                    `junctum-${plate.public_id}.svg`,
                  )
                }
              >
                <Download className="mr-1 size-4" /> SVG
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="font-semibold">Editar placa</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="dest">URL de destino</Label>
            <Input id="dest" placeholder="https://..." value={dest} onChange={(e) => setDest(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PLATE_STATUS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="venda">Data da venda</Label>
            <Input id="venda" type="date" value={venda} onChange={(e) => setVenda(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ativ">Data da ativação</Label>
            <Input id="ativ" type="date" value={ativacao} onChange={(e) => setAtivacao(e.target.value)} />
          </div>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar alterações</Button>
      </section>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="font-semibold">Interações registradas</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {[
            ["Total", stats.total],
            ["NFC", stats.nfc],
            ["QR", stats.qr],
            ["Hoje", stats.hoje],
            ["7 dias", stats.d7],
            ["30 dias", stats.d30],
            ["Mês atual", stats.mes],
          ].map(([l, v]) => (
            <div key={l as string} className="rounded-md bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground">{l}</div>
              <div className="text-xl font-semibold">{num(v as number)}</div>
            </div>
          ))}
        </div>
        {!stats.total && (
          <p className="text-xs text-muted-foreground">Nenhuma interação registrada ainda.</p>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="font-semibold">Histórico de destino</h2>
        {history.length ? (
          <ul className="space-y-2 text-sm">
            {history.map((h) => (
              <li key={h.id} className="rounded-md bg-muted/50 p-3">
                <div className="text-xs text-muted-foreground">{dt(h.created_at)}</div>
                <div className="break-all"><span className="text-muted-foreground">De:</span> {h.url_anterior ?? "—"}</div>
                <div className="break-all"><span className="text-muted-foreground">Para:</span> {h.url_nova ?? "—"}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhuma alteração de destino.</p>
        )}
      </section>
    </div>
  );
}
