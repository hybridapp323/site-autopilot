import postgres from "postgres";

const FUNCTION_VERSION = "2026-07-04.1";
const MAX_BODY_BYTES = 12_000;
const SITE_ORIGIN = "https://site.autopilotcrm.com.br";
const LOCAL_ORIGIN_RE = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const DEFAULT_PIXEL_ID = "150859304541599";
const DEFAULT_GRAPH_API_VERSION = "v23.0";

const dbUrl = Deno.env.get("SUPABASE_DB_URL");
const sql = dbUrl
  ? postgres(dbUrl, {
      prepare: false,
      max: 2,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : null;

type MetaLeadPayload = Record<string, unknown>;

type NormalizedMetaLead = {
  leadId: string;
  eventId: string;
  eventSourceUrl: string;
  emailHash: string;
  phoneHash: string;
  fbp: string;
  fbc: string;
  clientIp: string;
  clientIpHash: string | null;
  userAgent: string;
  customData: Record<string, string>;
};

type EventRow = {
  id: string;
  status: string;
  attempts: number;
};

function isAllowedOrigin(origin: string) {
  return origin === SITE_ORIGIN || LOCAL_ORIGIN_RE.test(origin);
}

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || SITE_ORIGIN;
  const allowOrigin = isAllowedOrigin(origin) ? origin : SITE_ORIGIN;

  return new Headers({
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  });
}

function jsonResponse(req: Request, body: Record<string, unknown>, status = 200) {
  const headers = corsHeaders(req);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanToken(value: unknown, maxLength: number) {
  return cleanString(value, maxLength).replace(/[^\w.:-]/g, "");
}

function normalizeEmail(value: unknown) {
  return cleanString(value, 254).toLowerCase();
}

function normalizePhoneForMeta(value: unknown) {
  const digits = cleanString(value, 40).replace(/\D/g, "");
  if (digits.length === 11) return `55${digits}`;
  return digits.slice(0, 16);
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for") || "";
  const cloudflareIp = req.headers.get("cf-connecting-ip") || "";
  return (forwardedFor.split(",")[0] || cloudflareIp).trim().slice(0, 120);
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeUrl(value: unknown) {
  const raw = cleanString(value, 800);
  try {
    const url = new URL(raw || SITE_ORIGIN);
    if (url.protocol !== "https:" && url.protocol !== "http:") return SITE_ORIGIN;
    return url.toString().slice(0, 800);
  } catch {
    return SITE_ORIGIN;
  }
}

async function normalizeLead(payload: MetaLeadPayload, req: Request): Promise<NormalizedMetaLead> {
  const lead = (payload.lead && typeof payload.lead === "object" ? payload.lead : payload) as Record<string, unknown>;
  const email = normalizeEmail(lead.email);
  const phone = normalizePhoneForMeta(lead.phone);
  const eventId = cleanToken(payload.eventId || payload.event_id, 180) || `site_demo_${crypto.randomUUID()}`;
  const clientIp = getClientIp(req);
  const userAgent = cleanString(req.headers.get("user-agent") || payload.userAgent || lead.userAgent, 512);
  const ipSalt = Deno.env.get("DEMO_LEAD_IP_SALT") || Deno.env.get("SUPABASE_URL") || "site-autopilot";

  return {
    leadId: cleanToken(payload.leadId || payload.lead_id, 120),
    eventId,
    eventSourceUrl: normalizeUrl(payload.sourceUrl || lead.sourceUrl),
    emailHash: email ? await sha256Hex(email) : "",
    phoneHash: phone ? await sha256Hex(phone) : "",
    fbp: cleanToken(payload.fbp || payload._fbp, 120),
    fbc: cleanToken(payload.fbc || payload._fbc, 220),
    clientIp,
    clientIpHash: clientIp ? await sha256Hex(`${ipSalt}:${clientIp}`) : null,
    userAgent,
    customData: {
      content_name: cleanString(payload.contentName, 120) || "Demo AutoPilot CRM",
      page_variant: cleanString(payload.pageVariant, 40) || "v2",
      store_name: cleanString(lead.store, 180),
      monthly_sales: cleanString(lead.monthlySales, 32),
      salespeople: cleanString(lead.salespeople, 32),
    },
  };
}

function validateLead(lead: NormalizedMetaLead) {
  const fields: Record<string, string> = {};
  if (lead.eventId.length < 8) fields.eventId = "Invalid event id.";
  if (!lead.emailHash && !lead.phoneHash && !lead.fbp && !lead.fbc) {
    fields.userData = "Missing match data.";
  }
  return fields;
}

function buildMetaEvent(lead: NormalizedMetaLead) {
  const userData: Record<string, unknown> = {};
  if (lead.emailHash) userData.em = [lead.emailHash];
  if (lead.phoneHash) userData.ph = [lead.phoneHash];
  if (lead.fbp) userData.fbp = lead.fbp;
  if (lead.fbc) userData.fbc = lead.fbc;
  if (lead.clientIp) userData.client_ip_address = lead.clientIp;
  if (lead.userAgent) userData.client_user_agent = lead.userAgent;

  return {
    event_name: "Lead",
    event_time: Math.floor(Date.now() / 1000),
    event_id: lead.eventId,
    action_source: "website",
    event_source_url: lead.eventSourceUrl,
    user_data: userData,
    custom_data: lead.customData,
  };
}

function sanitizedRequestSnapshot(lead: NormalizedMetaLead, pixelId: string, graphApiVersion: string) {
  return {
    function_version: FUNCTION_VERSION,
    pixel_id: pixelId,
    graph_api_version: graphApiVersion,
    event_name: "Lead",
    event_id: lead.eventId,
    event_source_url: lead.eventSourceUrl,
    has_email_hash: Boolean(lead.emailHash),
    has_phone_hash: Boolean(lead.phoneHash),
    has_fbp: Boolean(lead.fbp),
    has_fbc: Boolean(lead.fbc),
    has_client_ip: Boolean(lead.clientIp),
    has_user_agent: Boolean(lead.userAgent),
    custom_data: lead.customData,
  };
}

async function ensureEventRow(lead: NormalizedMetaLead, metaRequest: Record<string, unknown>, testEventCode: string) {
  if (!sql) return null;

  const [row] = await sql<EventRow[]>`
    insert into site_autopilot.demo_lead_meta_events (
      lead_id,
      event_name,
      event_id,
      pixel_id,
      status,
      action_source,
      event_source_url,
      fbp,
      fbc,
      email_hash,
      phone_hash,
      client_ip_hash,
      user_agent,
      custom_data,
      meta_request,
      attempts,
      test_event_code
    ) values (
      ${lead.leadId || null},
      'Lead',
      ${lead.eventId},
      ${(metaRequest.pixel_id as string) || null},
      'received',
      'website',
      ${lead.eventSourceUrl},
      ${lead.fbp || null},
      ${lead.fbc || null},
      ${lead.emailHash || null},
      ${lead.phoneHash || null},
      ${lead.clientIpHash},
      ${lead.userAgent || null},
      ${sql.json(lead.customData)},
      ${sql.json(metaRequest)},
      1,
      ${testEventCode || null}
    )
    on conflict (event_id) do update set
      updated_at = now(),
      attempts = site_autopilot.demo_lead_meta_events.attempts + 1
    returning id::text as id, status, attempts
  `;

  return row;
}

async function recordResult(input: {
  id: string | null;
  status: "sent" | "failed" | "skipped_missing_config" | "duplicate_sent";
  httpStatus?: number | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  fbtraceId?: string | null;
  responseBody?: unknown;
}) {
  if (!sql || !input.id) return;

  await sql`
    update site_autopilot.demo_lead_meta_events
    set
      updated_at = now(),
      status = ${input.status},
      http_status = ${input.httpStatus || null},
      duration_ms = ${input.durationMs || null},
      error_message = ${input.errorMessage ? input.errorMessage.slice(0, 500) : null},
      fbtrace_id = ${input.fbtraceId || null},
      meta_response = ${sql.json(input.responseBody || {})}
    where id = ${input.id}
  `;
}

function extractFbtraceId(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const error = record.error && typeof record.error === "object" ? (record.error as Record<string, unknown>) : null;
  return cleanString(record.fbtrace_id || error?.fbtrace_id, 120) || null;
}

async function sendMetaEvent(lead: NormalizedMetaLead) {
  const accessToken = cleanString(Deno.env.get("SITE_META_ACCESS_TOKEN"), 2_000);
  const pixelId = cleanToken(Deno.env.get("SITE_META_PIXEL_ID") || DEFAULT_PIXEL_ID, 80);
  const graphApiVersion = cleanToken(Deno.env.get("SITE_META_GRAPH_API_VERSION") || DEFAULT_GRAPH_API_VERSION, 20);
  const testEventCode = cleanToken(Deno.env.get("SITE_META_TEST_EVENT_CODE"), 120);
  const metaRequest = sanitizedRequestSnapshot(lead, pixelId, graphApiVersion);
  const row = await ensureEventRow(lead, metaRequest, testEventCode);

  if (row?.status === "sent") {
    return { status: "duplicate_sent" as const, eventId: lead.eventId };
  }

  if (!accessToken || !pixelId) {
    await recordResult({
      id: row?.id || null,
      status: "skipped_missing_config",
      errorMessage: "Missing SITE_META_ACCESS_TOKEN or SITE_META_PIXEL_ID",
    });
    return { status: "skipped_missing_config" as const, eventId: lead.eventId };
  }

  const body: Record<string, unknown> = { data: [buildMetaEvent(lead)] };
  if (testEventCode) body.test_event_code = testEventCode;

  const endpoint = new URL(`https://graph.facebook.com/${graphApiVersion}/${pixelId}/events`);
  endpoint.searchParams.set("access_token", accessToken);

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), 8_000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const responseText = await response.text().catch(() => "");
    let responseBody: unknown = {};
    try {
      responseBody = responseText ? JSON.parse(responseText) : {};
    } catch {
      responseBody = { body_preview: responseText.slice(0, 500) };
    }

    const status = response.ok ? "sent" : "failed";
    await recordResult({
      id: row?.id || null,
      status,
      httpStatus: response.status,
      durationMs: Date.now() - startedAt,
      fbtraceId: extractFbtraceId(responseBody),
      errorMessage: response.ok ? null : responseText.slice(0, 500),
      responseBody,
    });

    return { status, eventId: lead.eventId, httpStatus: response.status };
  } catch (error) {
    await recordResult({
      id: row?.id || null,
      status: "failed",
      durationMs: Date.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return { status: "failed" as const, eventId: lead.eventId };
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse(req, { ok: false, error: "method_not_allowed" }, 405);
  }

  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return jsonResponse(req, { ok: false, error: "forbidden" }, 403);
  }

  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return jsonResponse(req, { ok: false, error: "validation_error", fields: {} }, 413);
    }

    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
      return jsonResponse(req, { ok: false, error: "validation_error", fields: {} }, 413);
    }

    const payload = JSON.parse(rawBody || "{}") as MetaLeadPayload;
    const honeypot = cleanString(payload.website || payload.companyWebsite || payload._gotcha, 120);
    if (honeypot) {
      return jsonResponse(req, { ok: false, error: "validation_error", fields: {} }, 400);
    }

    const lead = await normalizeLead(payload, req);
    const fields = validateLead(lead);
    if (Object.keys(fields).length > 0) {
      return jsonResponse(req, { ok: false, error: "validation_error", fields }, 400);
    }

    const result = await sendMetaEvent(lead);
    const httpStatus = "httpStatus" in result ? result.httpStatus : null;
    return jsonResponse(req, { ok: true, metaStatus: result.status, eventId: result.eventId, httpStatus });
  } catch (error) {
    console.error("site-meta-lead-event error", error);
    return jsonResponse(req, { ok: false, error: "server_error" }, 500);
  }
});
