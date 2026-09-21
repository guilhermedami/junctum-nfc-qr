import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Nfc, QrCode, LineChart, Users } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JUNCTUM — CRM e analytics de placas NFC/QR" },
      {
        name: "description",
        content:
          "Plataforma JUNCTUM: prospecção, CRM, gestão de clientes e medição de interações NFC e QR Code por placa.",
      },
      { property: "og:title", content: "JUNCTUM — CRM e analytics de placas NFC/QR" },
      {
        property: "og:description",
        content:
          "Prospecção, CRM, gestão de placas físicas e analytics de interações NFC e QR Code.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Users, title: "Prospecção e CRM", desc: "Do primeiro contato à venda fechada." },
  { icon: Nfc, title: "Placas NFC", desc: "Cada placa com registro e link permanente." },
  { icon: QrCode, title: "QR Code rastreável", desc: "Interações NFC e QR contadas separadamente." },
  { icon: LineChart, title: "Analytics", desc: "Resultados por placa, cliente e período." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-display text-lg font-bold tracking-tight">JUNCTUM</span>
        <Button asChild size="sm">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-20 sm:py-28">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-electric">
            CRM · Placas NFC/QR · Analytics
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.1] sm:text-6xl">
            Transforme a venda de uma placa física em um serviço mensurável.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Prospecção, pipeline comercial, gestão de clientes e medição real das interações de cada
            placa — NFC e QR Code separados.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Acessar plataforma <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border p-6">
              <f.icon className="size-5 text-electric" />
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <p className="mx-auto max-w-6xl px-6 text-xs text-muted-foreground">
          JUNCTUM — os números apresentados representam interações/acessos, não pessoas únicas.
        </p>
      </footer>
    </div>
  );
}
