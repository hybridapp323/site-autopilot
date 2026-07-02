import postgres from "postgres";

const FUNCTION_VERSION = "2026-07-01.1";
const MAX_BODY_BYTES = 12_000;
const SITE_ORIGIN = "https://site.autopilotcrm.com.br";
const LOCAL_ORIGIN_RE = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const WEBHOOK_USER_AGENT = "AutoPilot-Site-Lead/1.0";
const DEFAULT_WEBHOOK_URL = "https://anwejdokgnfwqykszowz.supabase.co/functions/v1/site-autopilot-webhook";

const dbUrl = Deno.env.get("SUPABASE_DB_URL");
const sql = dbUrl
  ? postgres(dbUrl, {
      prepare: false,
      max: 2,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : null;

type DemoLeadPayload = Record<string, unknown>;

type NormalizedLead = {
  name: string;
  phone: string;
  phoneDigits: string;
  email: string;
  emailNormalized: string;
  store: string;
  instagram: string;
  monthlySales: number;
  salespeople: number;
  sourcePath: string;
  sourceUrl: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  userAgent: string;
  ipHash: string | null;
  metadata: Record<string, unknown>;
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

function parseInteger(value: unknown) {
  const text = cleanString(value, 32);
  if (!/^-?\d+$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function normalizeInstagram(value: unknown) {
  let instagram = cleanString(value, 100);
  instagram = instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  instagram = instagram.split(/[/?#]/)[0] || instagram;
  instagram = instagram.replace(/^@+/, "").replace(/[^\w.]/g, "").slice(0, 79);
  return instagram ? `@${instagram}` : "";
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

async function normalizeLead(payload: DemoLeadPayload, req: Request) {
  const email = cleanString(payload.email, 254);
  const phone = cleanString(payload.phone, 40);
  const phoneDigits = phone.replace(/\D/g, "");
  const sourceUrl = cleanString(payload.sourceUrl, 800);
  const sourcePath = cleanString(payload.sourcePath, 240);
  const referrer = cleanString(payload.referrer, 800);
  const userAgent = cleanString(req.headers.get("user-agent") || payload.userAgent, 512);
  const ip = getClientIp(req);
  const salt = Deno.env.get("DEMO_LEAD_IP_SALT") || Deno.env.get("SUPABASE_URL") || "site-autopilot";

  const lead: NormalizedLead = {
    name: cleanString(payload.name, 160),
    phone,
    phoneDigits,
    email,
    emailNormalized: email.toLowerCase(),
    store: cleanString(payload.store, 180),
    instagram: normalizeInstagram(payload.instagram),
    monthlySales: parseInteger(payload.monthlySales) ?? -1,
    salespeople: parseInteger(payload.salespeople) ?? 0,
    sourcePath,
    sourceUrl,
    referrer,
    utmSource: cleanString(payload.utmSource, 160),
    utmMedium: cleanString(payload.utmMedium, 160),
    utmCampaign: cleanString(payload.utmCampaign, 200),
    utmTerm: cleanString(payload.utmTerm, 200),
    utmContent: cleanString(payload.utmContent, 200),
    userAgent,
    ipHash: ip ? await sha256Hex(`${salt}:${ip}`) : null,
    metadata: {
      captured_at: cleanString(payload.capturedAt, 80),
      endpoint_version: FUNCTION_VERSION,
      page_variant: "v2",
    },
  };

  return lead;
}

function validateLead(lead: NormalizedLead) {
  const fields: Record<string, string> = {};

  if (lead.name.length < 2) fields.name = "Informe seu nome.";
  if (lead.phoneDigits.length !== 11) fields.phone = "Informe um telefone com DDD e 11 numeros.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) fields.email = "Informe um e-mail valido.";
  if (lead.store.length < 2) fields.store = "Informe o nome da loja.";
  if (lead.instagram.length < 2) fields.instagram = "Informe o Instagram da loja.";
  if (!Number.isSafeInteger(lead.monthlySales) || lead.monthlySales < 0) {
    fields.monthlySales = "Informe uma quantidade valida.";
  }
  if (!Number.isSafeInteger(lead.salespeople) || lead.salespeople < 1) {
    fields.salespeople = "Informe pelo menos 1 vendedor.";
  }

  return fields;
}

async function isRateLimited(lead: NormalizedLead) {
  if (!sql) throw new Error("Missing SUPABASE_DB_URL");

  const [emailRate] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from site_autopilot.demo_leads
    where email_normalized = ${lead.emailNormalized}
      and created_at >= now() - interval '24 hours'
  `;

  const ipRate = lead.ipHash
    ? await sql<{ count: number }[]>`
        select count(*)::int as count
        from site_autopilot.demo_leads
        where ip_hash = ${lead.ipHash}
          and created_at >= now() - interval '1 hour'
      `
    : [{ count: 0 }];

  return Number(emailRate?.count || 0) >= 3 || Number(ipRate[0]?.count || 0) >= 8;
}

async function insertLead(lead: NormalizedLead) {
  if (!sql) throw new Error("Missing SUPABASE_DB_URL");

  const [row] = await sql<{ id: string }[]>`
    insert into site_autopilot.demo_leads (
      name,
      phone,
      phone_digits,
      email,
      email_normalized,
      store_name,
      instagram,
      monthly_sales,
      salespeople,
      source_path,
      source_url,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      user_agent,
      ip_hash,
      metadata
    ) values (
      ${lead.name},
      ${lead.phone},
      ${lead.phoneDigits},
      ${lead.email},
      ${lead.emailNormalized},
      ${lead.store},
      ${lead.instagram},
      ${lead.monthlySales},
      ${lead.salespeople},
      ${lead.sourcePath || null},
      ${lead.sourceUrl || null},
      ${lead.referrer || null},
      ${lead.utmSource || null},
      ${lead.utmMedium || null},
      ${lead.utmCampaign || null},
      ${lead.utmTerm || null},
      ${lead.utmContent || null},
      ${lead.userAgent || null},
      ${lead.ipHash},
      ${sql.json(lead.metadata)}
    )
    returning id::text as id
  `;

  return row.id;
}

async function recordWebhookDelivery(input: {
  leadId: string;
  status: "sent" | "failed" | "skipped_missing_endpoint";
  endpointHash?: string | null;
  httpStatus?: number | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  responseBodyPreview?: string | null;
}) {
  if (!sql) throw new Error("Missing SUPABASE_DB_URL");

  await sql`
    insert into site_autopilot.demo_lead_webhook_deliveries (
      lead_id,
      status,
      endpoint_hash,
      http_status,
      duration_ms,
      error_message,
      response_body_preview
    ) values (
      ${input.leadId},
      ${input.status},
      ${input.endpointHash || null},
      ${input.httpStatus || null},
      ${input.durationMs || null},
      ${input.errorMessage || null},
      ${input.responseBodyPreview || null}
    )
  `;
}

async function safeRecordWebhookDelivery(input: Parameters<typeof recordWebhookDelivery>[0]) {
  try {
    await recordWebhookDelivery(input);
  } catch (error) {
    console.error("site-demo-lead webhook delivery log error", error);
  }
}

async function dispatchWebhook(leadId: string, lead: NormalizedLead) {
  const webhookUrl = cleanString(Deno.env.get("DEMO_LEAD_WEBHOOK_URL") || DEFAULT_WEBHOOK_URL, 1_000);

  if (!webhookUrl) {
    await safeRecordWebhookDelivery({ leadId, status: "skipped_missing_endpoint" });
    return "skipped_missing_endpoint" as const;
  }

  const endpointHash = await sha256Hex(webhookUrl);
  const body = {
    event: "site.demo_lead.created",
    leadId,
    source: "site_autopilot_v2",
    occurredAt: new Date().toISOString(),
    lead: {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      store: lead.store,
      instagram: lead.instagram,
      monthlySales: lead.monthlySales,
      salespeople: lead.salespeople,
    },
    attribution: {
      sourcePath: lead.sourcePath,
      sourceUrl: lead.sourceUrl,
      referrer: lead.referrer,
      utmSource: lead.utmSource,
      utmMedium: lead.utmMedium,
      utmCampaign: lead.utmCampaign,
      utmTerm: lead.utmTerm,
      utmContent: lead.utmContent,
    },
  };

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("timeout"), 8_000);
  const webhookSecret = cleanString(Deno.env.get("DEMO_LEAD_WEBHOOK_SECRET"), 1_000);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": WEBHOOK_USER_AGENT,
  };
  if (webhookSecret) headers.Authorization = `Bearer ${webhookSecret}`;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const responseText = await response.text().catch(() => "");
    const status = response.ok ? "sent" : "failed";

    await safeRecordWebhookDelivery({
      leadId,
      status,
      endpointHash,
      httpStatus: response.status,
      durationMs: Date.now() - startedAt,
      responseBodyPreview: responseText.slice(0, 500) || null,
    });

    return status;
  } catch (error) {
    await safeRecordWebhookDelivery({
      leadId,
      status: "failed",
      endpointHash,
      durationMs: Date.now() - startedAt,
      errorMessage: error instanceof Error ? error.message.slice(0, 500) : String(error).slice(0, 500),
    });

    return "failed" as const;
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse(req, { ok: false, error: "server_error" }, 405);
  }

  const origin = req.headers.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    return jsonResponse(req, { ok: false, error: "server_error" }, 403);
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

    const payload = JSON.parse(rawBody || "{}") as DemoLeadPayload;
    const honeypot = cleanString(payload.website || payload.companyWebsite || payload._gotcha, 120);
    if (honeypot) {
      return jsonResponse(req, { ok: false, error: "validation_error", fields: {} }, 400);
    }

    const lead = await normalizeLead(payload, req);
    const fields = validateLead(lead);
    if (Object.keys(fields).length > 0) {
      return jsonResponse(req, { ok: false, error: "validation_error", fields }, 400);
    }

    if (await isRateLimited(lead)) {
      return jsonResponse(
        req,
        {
          ok: false,
          error: "validation_error",
          fields: {
            email: "Ja recebemos esta solicitacao. Tente novamente mais tarde.",
          },
        },
        429,
      );
    }

    const leadId = await insertLead(lead);
    const webhookStatus = await dispatchWebhook(leadId, lead);

    return jsonResponse(req, { ok: true, leadId, webhookStatus });
  } catch (error) {
    console.error("site-demo-lead error", error);
    return jsonResponse(req, { ok: false, error: "server_error" }, 500);
  }
});
