import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AccessSummary = {
  migrationPending?: boolean;
  all: { total: number; nfc: number; qr: number };
  today: number;
  last7: number;
  last30: number;
  month: number;
  series: { day: string; total: number; nfc: number; qr: number }[];
};

export async function fetchAccessSummary(
  options: {
    plateId?: string;
    clientId?: string;
    days?: number;
    from?: string;
    to?: string;
  } = {},
): Promise<AccessSummary> {
  const { data, error } = await (supabase as SupabaseClient).rpc("access_summary", {
    p_plate_id: options.plateId ?? null,
    p_client_id: options.clientId ?? null,
    p_days: options.days ?? 30,
    p_from: options.from ?? null,
    p_to: options.to ?? null,
  });
  if (error?.code === "PGRST202") {
    const { fallbackAccessSummary } = await import("@/lib/summary-fallback");
    return fallbackAccessSummary(options);
  }
  if (error) throw error;
  return data as AccessSummary;
}
