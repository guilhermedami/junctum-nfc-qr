import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type CommercialSummary = {
  leads: {
    total: number;
    novos: number;
    contatados: number;
    interessados: number;
    propostas: number;
  };
  sales: { total: number; mes: number; faturamento: number };
  clients: { ativos: number; novos: number };
  plates: { total: number; ativas: number; producao: number; inativas: number };
  followups: { hoje: number; atrasados: number; mais_antigo: string | null };
};

export async function fetchCommercialSummary(): Promise<CommercialSummary> {
  const { data, error } = await (supabase as SupabaseClient).rpc("commercial_summary");
  if (error) throw error;
  return data as CommercialSummary;
}
