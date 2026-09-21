export const PLATE_STATUS: Record<string, string> = {
  producao: "Produção",
  aguardando_entrega: "Aguardando entrega",
  entregue: "Entregue",
  ativa: "Ativa",
  pausada: "Pausada",
  inativa: "Inativa",
  substituida: "Substituída",
};

export const CLIENT_STATUS: Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  cancelado: "Cancelado",
};

export const FOLLOWUP_TYPES: Record<string, string> = {
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  visita: "Visita",
  proposta: "Proposta",
  reuniao: "Reunião",
  retorno: "Retorno",
  outro: "Outro",
};

export const TEMPLATE_CATEGORIES: Record<string, string> = {
  primeiro_contato: "Primeiro contato",
  pos_visita: "Pós-visita",
  followup: "Follow-up",
  proposta: "Proposta",
  fechamento: "Fechamento",
  pos_venda: "Pós-venda",
  renovacao: "Renovação",
};

export const GOAL_METRICS: Record<string, string> = {
  prospeccoes: "Prospecções",
  visitas: "Visitas",
  contatos: "Contatos",
  followups: "Follow-ups",
  propostas: "Propostas",
  vendas: "Vendas",
  faturamento: "Faturamento",
  novos_clientes: "Novos clientes",
};

export function brl(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value ?? 0),
  );
}

export function num(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR").format(Number(value ?? 0));
}

export function dateBR(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function daysSince(value: string | null | undefined) {
  if (!value) return null;
  const diff = Date.now() - new Date(value).getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export function onlyDigits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function whatsappLink(phone: string | null | undefined, message?: string) {
  const digits = onlyDigits(phone);
  if (!digits) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const base = `https://wa.me/${withCountry}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function mapsLink(parts: (string | null | undefined)[]) {
  const q = parts.filter(Boolean).join(", ");
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function applyTemplate(
  content: string,
  vars: Record<string, string | null | undefined>,
) {
  return content.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) => vars[key] ?? "");
}

/** Public tracking URLs — the permanent JUNCTUM links printed on the plate. */
export function trackingUrls(publicId: string, origin?: string) {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return {
    nfc: `${base}/r/${publicId}/nfc`,
    qr: `${base}/r/${publicId}/qr`,
  };
}

export function isValidHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
