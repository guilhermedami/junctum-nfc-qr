import { supabaseAdmin } from "@/integrations/supabase/client.server";

const route = /^\/r\/([a-z0-9]{8,32})\/(nfc|qr)\/?$/;

function notice(message: string, status: number) {
  return new Response(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JUNCTUM</title><body style="font:16px system-ui;max-width:32rem;margin:12vh auto;padding:1.5rem"><h1>JUNCTUM</h1><p>${message}</p></body></html>`, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}

/** Public endpoint for permanent links printed on NFC tags and QR codes. */
export async function handlePlateRedirect(request: Request): Promise<Response | null> {
  const pathname = new URL(request.url).pathname;
  if (!pathname.startsWith("/r/")) return null;
  if (request.method !== "GET") return notice("Método não permitido.", 405);
  const match = route.exec(pathname);
  if (!match) return notice("Placa não encontrada.", 404);

  try {
    const { data: plate, error } = await supabaseAdmin
      .from("plates")
      .select("id, client_id, status, destination_url")
      .eq("public_id", match[1])
      .maybeSingle();
    if (error) throw error;
    if (!plate) return notice("Placa não encontrada.", 404);
    if (plate.status !== "ativa") return notice("Esta placa está indisponível no momento.", 404);

    const destination = plate.destination_url;
    if (!destination) return notice("O destino desta placa ainda não foi configurado.", 404);
    const url = new URL(destination);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return notice("O destino desta placa está indisponível.", 404);
    }

    // Wait for the write: returning a redirect before persistence silently loses analytics.
    const { error: insertError } = await supabaseAdmin.from("access_events").insert({
      plate_id: plate.id,
      client_id: plate.client_id,
      source: match[2] as "nfc" | "qr",
      destination_url_snapshot: destination,
      user_agent: request.headers.get("user-agent")?.slice(0, 512) ?? null,
    });
    if (insertError) throw insertError;
    return new Response(null, {
      status: 302,
      headers: { location: url.href, "cache-control": "no-store", "x-robots-tag": "noindex" },
    });
  } catch (error) {
    console.error("Plate redirect failed", error);
    return notice("Não foi possível abrir esta placa agora. Tente novamente em instantes.", 503);
  }
}
