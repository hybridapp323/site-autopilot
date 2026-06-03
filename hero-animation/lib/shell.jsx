const { useRef: useRefS } = React;

// ── browser window frame ──────────────────────────────────────────────────
function BrowserFrame({ children }) {
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: 18, overflow: 'hidden',
      background: 'hsl(var(--card))', display: 'flex', flexDirection: 'column',
      boxShadow: '0 40px 120px rgba(0,40,120,0.22), 0 10px 32px rgba(0,40,120,0.12), 0 0 0 1px rgba(0,40,120,0.05)' }}>
      {/* chrome */}
      <div style={{ height: 54, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 18,
        padding: '0 20px', background: 'hsl(210 20% 96%)', borderBottom: '1px solid hsl(var(--border))' }}>
        <div style={{ display: 'flex', gap: 9 }}>
          <span style={{ width: 13, height: 13, borderRadius: 999, background: '#ff5f57' }} />
          <span style={{ width: 13, height: 13, borderRadius: 999, background: '#febc2e' }} />
          <span style={{ width: 13, height: 13, borderRadius: 999, background: '#28c840' }} />
        </div>
        <div style={{ flex: 1, maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'center',
          gap: 8, height: 32, background: 'hsl(var(--card))', borderRadius: 999, padding: '0 16px',
          border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))', fontSize: 13.5 }}>
          <Icon.Lock size={13} />
          <span>app.autopilot.com.br/inbox</span>
        </div>
        <div style={{ width: 52 }} />
      </div>
      {/* app */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>{children}</div>
    </div>
  );
}

// ── sidebar icon rail ──────────────────────────────────────────────────────
function RailItem({ icon: I, active }) {
  return (
    <div style={{ width: 48, height: 48, borderRadius: 999, display: 'flex', alignItems: 'center',
      justifyContent: 'center',
      background: active ? 'hsl(var(--primary))' : 'transparent',
      color: active ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
      boxShadow: active ? '0 4px 14px hsl(var(--primary) / 0.4)' : 'none' }}>
      <I size={21} />
    </div>
  );
}

function SidebarRail() {
  return (
    <div style={{ width: 78, flexShrink: 0, background: 'hsl(var(--sidebar-background))',
      borderRight: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '18px 0', gap: 8 }}>
      <img src="assets/logo-autopilot.png" alt="AutoPilot" style={{ width: 40, height: 40,
        objectFit: 'contain', marginBottom: 16 }} />
      <RailItem icon={Icon.MessageSquare} active />
      <RailItem icon={Icon.Layout} />
      <RailItem icon={Icon.Calendar} />
      <RailItem icon={Icon.Phone} />
      <RailItem icon={Icon.Branch} />
      <RailItem icon={Icon.Chart} />
      <div style={{ flex: 1 }} />
      <RailItem icon={Icon.Settings} />
    </div>
  );
}

// ── conversation list ──────────────────────────────────────────────────────
const CONVOS = [
  { initials: 'CA', name: 'Carlos Henrique', last: 'Sábado de manhã fica bom pra mim', time: '23:36', temp: '🔥', dot: 'hsl(145 65% 45%)', active: true },
  { initials: 'JA', name: 'Juliana Alves', last: 'Tem o Onix 2022 prata disponível?', time: '22:14', temp: '🌡️', dot: 'hsl(320 70% 55%)' },
  { initials: 'PS', name: 'Pedro Santos', last: 'Qual o valor da entrada mínima?', time: '21:48', temp: '🔥', dot: 'hsl(145 65% 45%)' },
  { initials: 'MC', name: 'Mariana Costa', last: 'Obrigada, vou pensar e te aviso', time: '20:30', temp: '❄️', dot: 'hsl(210 80% 55%)' },
  { initials: 'RL', name: 'Rafael Lima', last: 'Posso passar amanhã de tarde?', time: '19:05', temp: '🌡️', dot: 'hsl(145 65% 45%)' },
  { initials: 'BC', name: 'Bruno Carvalho', last: 'Aceita financiamento pelo banco?', time: '18:22', temp: '🌡️', dot: 'hsl(145 65% 45%)' },
];

function ConvRow({ c }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '13px 16px', borderRadius: 14,
      background: c.active ? 'hsl(var(--accent))' : 'transparent',
      position: 'relative', cursor: 'default' }}>
      {c.active && <span style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 3,
        borderRadius: 999, background: 'hsl(var(--primary))' }} />}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: 999, background: 'hsl(var(--muted))',
          color: 'hsl(var(--muted-foreground))', fontWeight: 600, fontSize: 14.5,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.initials}</div>
        <span style={{ position: 'absolute', right: -1, bottom: -1, width: 12, height: 12,
          borderRadius: 999, background: c.dot, border: '2px solid hsl(var(--card))' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--foreground))',
            flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
          <span style={{ fontSize: 12.5, color: 'hsl(var(--muted-foreground))', fontVariantNumeric: 'tabular-nums' }}>{c.time}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <span style={{ fontSize: 13.5, color: 'hsl(var(--muted-foreground))', flex: 1, minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last}</span>
          <span style={{ fontSize: 14 }}>{c.temp}</span>
        </div>
      </div>
    </div>
  );
}

function ConvList() {
  return (
    <div style={{ width: 332, flexShrink: 0, background: 'hsl(var(--card))',
      borderRight: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 18px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.015em' }}>Inbox</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'hsl(var(--primary))',
            background: 'hsl(var(--primary) / 0.1)', borderRadius: 999, padding: '3px 10px' }}>6 ativas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, height: 40, borderRadius: 12,
          background: 'hsl(var(--muted))', padding: '0 14px', color: 'hsl(var(--muted-foreground))', fontSize: 14.5 }}>
          <Icon.Search size={16} /> Buscar conversa...
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 8px' }}>
        {CONVOS.map((c, i) => <ConvRow key={i} c={c} />)}
      </div>
    </div>
  );
}

// ── lead details panel (auto-fills as AI qualifies) ─────────────────────────
function ScoreRing({ score }) {
  const r = 34, c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  return (
    <div style={{ position: 'relative', width: 86, height: 86 }}>
      <svg width="86" height="86" viewBox="0 0 86 86">
        <circle cx="43" cy="43" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
        <circle cx="43" cy="43" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="7"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          transform="rotate(-90 43 43)" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{Math.round(score)}</span>
        <span style={{ fontSize: 10.5, color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>SCORE IA</span>
      </div>
    </div>
  );
}

function LeadField({ f, time }) {
  const shown = time >= f.at;
  const flash = window.clamp(1 - (time - f.at) / 0.9, 0, 1);
  return (
    <div style={{ padding: '11px 14px', borderRadius: 12,
      background: shown ? `hsl(var(--primary) / ${0.1 * flash})` : 'hsl(var(--muted) / 0.5)',
      transition: 'background 0.1s linear' }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em',
        color: 'hsl(var(--muted-foreground))', marginBottom: 5 }}>{f.label}</div>
      {shown ? (
        <div style={{ fontSize: 14.5, fontWeight: 500, lineHeight: 1.35,
          opacity: window.clamp((time - f.at) / 0.4 + 0.2, 0, 1) }}>{f.value}</div>
      ) : (
        <div style={{ height: 11, width: '62%', borderRadius: 999, background: 'hsl(var(--border))' }} />
      )}
    </div>
  );
}

function LeadPanel() {
  const time = useTime();
  const { LEAD_FIELDS, TEMP_STEPS } = window.HERO_DATA;

  const score = window.interpolate(
    [0, 4, 7.2, 12.8, 16.5, 18],
    [8, 38, 55, 76, 86, 93],
    window.Easing.easeOutCubic
  )(time);

  let temp = TEMP_STEPS[0];
  TEMP_STEPS.forEach((s) => { if (time >= s.at) temp = s; });

  const qualified = time >= 18.0;

  return (
    <div style={{ width: 336, flexShrink: 0, background: 'hsl(var(--card))',
      borderLeft: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Detalhes do lead</div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', padding: '20px' }}>
        {/* identity + qualification badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          <ScoreRing score={score} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Carlos Henrique</div>
            <div style={{ fontSize: 13.5, color: 'hsl(var(--muted-foreground))', marginBottom: 8 }}>Lead · WhatsApp</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5,
              fontWeight: 600, borderRadius: 999, padding: '4px 11px',
              color: qualified ? 'hsl(var(--success))' : 'hsl(var(--warning))',
              background: qualified ? 'hsl(var(--success) / 0.13)' : 'hsl(var(--warning) / 0.15)',
              border: `1px solid ${qualified ? 'hsl(var(--success) / 0.35)' : 'hsl(var(--warning) / 0.4)'}`,
              transition: 'all 0.2s' }}>
              {qualified ? <Icon.Check size={13} /> : <Icon.Sparkles size={13} />}
              {qualified ? 'Qualificado' : 'Qualificando...'}
            </div>
          </div>
        </div>

        {/* temperature */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderRadius: 12, background: 'hsl(var(--muted) / 0.5)', marginBottom: 18 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'hsl(var(--muted-foreground))' }}>Temperatura</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 14.5, fontWeight: 600,
            color: temp.color }}>
            <span style={{ fontSize: 17 }}>{temp.emoji}</span>{temp.label}
          </span>
        </div>

        {/* qualification fields */}
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em',
          color: 'hsl(var(--muted-foreground))', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon.Sparkles size={12} style={{ color: 'hsl(var(--primary))' }} /> Qualificação automática
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LEAD_FIELDS.map((f) => <LeadField key={f.id} f={f} time={time} />)}
        </div>
      </div>
    </div>
  );
}

window.BrowserFrame = BrowserFrame;
window.SidebarRail = SidebarRail;
window.ConvList = ConvList;
window.LeadPanel = LeadPanel;
