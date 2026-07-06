create table if not exists site_autopilot.demo_lead_meta_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  lead_id text,
  event_name text not null default 'Lead',
  event_id text not null,
  pixel_id text,
  status text not null default 'received',
  action_source text not null default 'website',
  event_source_url text,
  fbp text,
  fbc text,
  email_hash text,
  phone_hash text,
  client_ip_hash text,
  user_agent text,
  custom_data jsonb not null default '{}'::jsonb,
  meta_request jsonb not null default '{}'::jsonb,
  meta_response jsonb not null default '{}'::jsonb,
  http_status integer,
  duration_ms integer,
  error_message text,
  fbtrace_id text,
  attempts integer not null default 0,
  test_event_code text,
  constraint demo_lead_meta_events_event_name_check
    check (event_name = 'Lead'),
  constraint demo_lead_meta_events_event_id_check
    check (char_length(btrim(event_id)) between 8 and 180),
  constraint demo_lead_meta_events_status_check
    check (status in ('received', 'sent', 'failed', 'skipped_missing_config', 'duplicate_sent')),
  constraint demo_lead_meta_events_http_status_check
    check (http_status is null or (http_status >= 100 and http_status <= 599)),
  constraint demo_lead_meta_events_duration_ms_check
    check (duration_ms is null or duration_ms >= 0),
  constraint demo_lead_meta_events_attempts_check
    check (attempts >= 0)
);

alter table site_autopilot.demo_lead_meta_events enable row level security;

create unique index if not exists demo_lead_meta_events_event_id_idx
  on site_autopilot.demo_lead_meta_events (event_id);

create index if not exists demo_lead_meta_events_created_at_idx
  on site_autopilot.demo_lead_meta_events (created_at desc);

create index if not exists demo_lead_meta_events_status_idx
  on site_autopilot.demo_lead_meta_events (status, created_at desc);

comment on table site_autopilot.demo_lead_meta_events is
  'Meta Conversions API delivery attempts for leads captured by the marketing site. Isolated from CRM tables.';

comment on column site_autopilot.demo_lead_meta_events.meta_request is
  'Sanitized outbound Meta payload metadata. Does not store raw email, phone, or client IP.';
