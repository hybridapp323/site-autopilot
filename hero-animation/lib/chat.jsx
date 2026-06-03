const { useRef: useRefC, useLayoutEffect: useLayoutEffectC, useState: useStateC } = React;

// ── entry tween for a freshly-revealed item ──────────────────────────────
function entry(time, at, dur = 0.42) {
  const t = window.clamp((time - at) / dur, 0, 1);
  const e = window.Easing.easeOutCubic(t);
  return { opacity: e, ty: (1 - e) * 14, scale: 0.965 + 0.035 * e };
}
const wrapStyle = (e) => ({
  opacity: e.opacity,
  transform: `translateY(${e.ty}px) scale(${e.scale})`,
  transformOrigin: 'center bottom',
  willChange: 'transform, opacity',
});

// ── small IA author label above an outbound bubble ───────────────────────
function IaTag() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5,
      color: 'hsl(var(--primary))', fontSize: 12.5, fontWeight: 600 }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 18, height: 18, borderRadius: 5, background: 'hsl(var(--primary) / 0.12)' }}>
        <Icon.Bot size={12} />
      </span>
      IA
    </div>
  );
}

function Stamp({ time, check }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3,
      marginTop: 4, fontSize: 12, color: 'hsl(var(--muted-foreground))', fontVariantNumeric: 'tabular-nums' }}>
      {time}
      {check && <Icon.Check size={13} style={{ color: 'hsl(var(--muted-foreground))' }} />}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="hero-typing" style={{ display: 'flex', gap: 5, padding: '4px 2px' }}>
      <span /><span /><span />
    </div>
  );
}

// ── individual rows ───────────────────────────────────────────────────────
function SystemRow({ item, time }) {
  const e = entry(time, item.at, 0.4);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 14px', ...wrapStyle(e) }}>
      <div style={{ fontSize: 13, fontWeight: 500, padding: '5px 14px', borderRadius: 999,
        background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))',
        border: '1px solid hsl(var(--border))' }}>
        {item.text}
      </div>
    </div>
  );
}

function bubbleBase(side) {
  return {
    maxWidth: '66%', display: 'flex', flexDirection: 'column',
    alignItems: side === 'in' ? 'flex-start' : 'stretch',
  };
}

function InRow({ item, time }) {
  const e = entry(time, item.at);
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 14, ...wrapStyle(e) }}>
      <div style={bubbleBase('in')}>
        <div style={{ background: 'hsl(var(--chat-inbound))', color: 'hsl(var(--foreground))',
          borderRadius: 16, padding: '12px 16px', fontSize: 16.5, lineHeight: 1.5 }}>
          {item.text}
          <Stamp time={item.time} />
        </div>
      </div>
    </div>
  );
}

function OutRow({ item, time }) {
  const e = entry(time, item.at);
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14, ...wrapStyle(e) }}>
      <div style={bubbleBase('out')}>
        <div style={{ background: 'hsl(var(--chat-outbound))', color: 'hsl(var(--foreground))',
          borderRadius: 16, padding: '12px 16px' }}>
          {item.ai && <IaTag />}
          <div style={{ fontSize: 16.5, lineHeight: 1.5 }}>{item.text}</div>
          <Stamp time={item.time} check />
        </div>
      </div>
    </div>
  );
}

function PhotoRow({ src, at, time, label }) {
  const tnow = useTime();
  if (tnow < at) return null;
  const e = entry(tnow, at, 0.5);
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14, ...wrapStyle(e) }}>
      <div>
        <div style={{ background: 'hsl(var(--chat-outbound))', borderRadius: 16, padding: 8 }}>
          {label && <div style={{ padding: '2px 4px 8px' }}><IaTag /></div>}
          <div style={{ borderRadius: 11, overflow: 'hidden', border: '1px solid hsl(var(--border))',
            lineHeight: 0, width: 300, height: 225 }}>
            <img src={src} alt="" style={{ width: 300, height: 225, objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ padding: '0 4px' }}><Stamp time={time} check /></div>
        </div>
      </div>
    </div>
  );
}

function ImagesGroup({ item }) {
  return (
    <>
      {item.photos.map((src, i) => (
        <PhotoRow key={i} src={src} at={item.at + i * 0.5} time={item.time} label={i === 0} />
      ))}
    </>
  );
}

function NoteRow({ item, time }) {
  const e = entry(time, item.at, 0.5);
  const L = ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14, ...wrapStyle(e) }}>
      <div style={{ maxWidth: '74%' }}>
        <div style={{ background: 'hsl(var(--chat-system))', color: 'hsl(var(--foreground))',
          borderRadius: 16, padding: '14px 18px',
          border: '1px solid hsl(var(--warning) / 0.45)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
            color: 'hsl(38 80% 38%)', fontSize: 12.5, fontWeight: 600 }}>
            <Icon.Note size={13} /> Nota interna
          </div>
          <IaTag />
          <div style={{ fontSize: 15.5, lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>📋 Resumo da transferência — Marcos</div>
            <div><L>Lead:</L> Carlos Henrique — São Paulo/SP</div>
            <div><L>Telefone:</L> +55 11 95566-7788</div>
            <div style={{ marginBottom: 10 }}><L>Origem:</L> WhatsApp (anúncio Jeep Compass)</div>
            <div><L>Interesse:</L> Jeep Compass Longitude 1.3 T270 23/23 — R$ 125.000</div>
            <div style={{ marginBottom: 10, color: 'hsl(var(--muted-foreground))' }}>(viu as 4 fotos enviadas e curtiu)</div>
            <div><L>Pagamento:</L> Entrada de R$ 80.000 + financiamento do saldo</div>
            <div><L>Troca:</L> Não tem veículo na troca</div>
            <div style={{ marginBottom: 10 }}><L>Temperatura:</L> 🔥 Quente — pediu fotos, confirmou pagamento e topou agendar</div>
            <div style={{ marginBottom: 10 }}><L>Próximo passo:</L> Confirmar visita <strong>sábado de manhã</strong> na loja e levar simulação de financiamento (entrada R$ 80k, prazo a definir).</div>
            <div><L>Observação:</L> Lead direto, decisão rápida, não fez objeção de preço. Boa chance de fechar na visita.</div>
          </div>
          <Stamp time={item.time} check />
        </div>
      </div>
    </div>
  );
}

function AgentRow({ item, time }) {
  const e = entry(time, item.at);
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14, ...wrapStyle(e) }}>
      <div style={bubbleBase('out')}>
        <div style={{ background: 'hsl(var(--chat-outbound))', color: 'hsl(var(--foreground))',
          borderRadius: 16, padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{ width: 18, height: 18, borderRadius: 999, background: 'hsl(160 60% 42%)',
              color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center',
              justifyContent: 'center' }}>M</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'hsl(160 50% 32%)' }}>{item.agent}</span>
          </div>
          <div style={{ fontSize: 16.5, lineHeight: 1.5 }}>{item.text}</div>
          <Stamp time={item.time} check />
        </div>
      </div>
    </div>
  );
}

function TypingRow({ item }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
      <div style={{ maxWidth: '66%' }}>
        <div style={{ background: 'hsl(var(--chat-outbound))', borderRadius: 16, padding: '10px 14px' }}>
          <IaTag />
          <TypingDots />
        </div>
      </div>
    </div>
  );
}

// ── header ────────────────────────────────────────────────────────────────
function HeaderBtn({ icon: I, label, color, pill }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14.5, fontWeight: 500,
      color: color || 'hsl(var(--foreground))', padding: pill ? '6px 12px' : '6px 4px',
      borderRadius: 999, border: pill ? '1px solid hsl(var(--border))' : 'none',
      background: pill ? 'hsl(var(--muted))' : 'transparent', whiteSpace: 'nowrap' }}>
      <I size={16} /> {label}
    </div>
  );
}

function ChatHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px',
      borderBottom: '1px solid hsl(var(--border))', flexShrink: 0 }}>
      <div style={{ width: 42, height: 42, borderRadius: 999, background: 'hsl(var(--muted))',
        color: 'hsl(var(--muted-foreground))', fontWeight: 600, fontSize: 15,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>CA</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 600 }}>Carlos Henrique</span>
          <span style={{ fontSize: 11.5, fontWeight: 500, color: 'hsl(var(--muted-foreground))',
            background: 'hsl(var(--muted))', borderRadius: 999, padding: '2px 9px' }}>whatsapp</span>
        </div>
        <div style={{ fontSize: 13.5, color: 'hsl(var(--muted-foreground))', fontVariantNumeric: 'tabular-nums' }}>5511955667788</div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <HeaderBtn icon={Icon.Sparkles} label="Iniciar IA" color="hsl(var(--primary))" />
        <HeaderBtn icon={Icon.Transfer} label="Transferir" />
        <HeaderBtn icon={Icon.EyeOff} label="Não lida" />
        <HeaderBtn icon={Icon.XCircle} label="Encerrar" color="hsl(var(--destructive))" />
        <HeaderBtn icon={Icon.User} label="Manual" pill />
        <div style={{ color: 'hsl(var(--muted-foreground))' }}><Icon.Info size={18} /></div>
      </div>
    </div>
  );
}

// ── composer ────────────────────────────────────────────────────────────────
function Composer() {
  return (
    <div style={{ borderTop: '1px solid hsl(var(--border))', padding: '14px 18px', flexShrink: 0,
      background: 'hsl(var(--card))' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600,
          color: 'hsl(var(--primary-foreground))', background: 'hsl(var(--primary))',
          borderRadius: 999, padding: '7px 14px' }}>
          <Icon.MessageSquare size={14} /> Mensagem
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 500,
          color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))',
          borderRadius: 999, padding: '7px 14px' }}>
          <Icon.Note size={14} /> Nota interna
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid hsl(var(--border))',
        borderRadius: 14, padding: '12px 16px', background: 'hsl(var(--card))' }}>
        <Icon.Plus size={20} style={{ color: 'hsl(var(--muted-foreground))' }} />
        <Icon.Smile size={19} style={{ color: 'hsl(var(--muted-foreground))' }} />
        <span style={{ flex: 1, fontSize: 15.5, color: 'hsl(var(--muted-foreground))' }}>
          Digite uma mensagem... (use "/" para templates)
        </span>
        <Icon.Mic size={19} style={{ color: 'hsl(var(--muted-foreground))' }} />
      </div>
    </div>
  );
}

// ── the panel ────────────────────────────────────────────────────────────────
function ChatPanel() {
  const time = useTime();
  const outerRef = useRefC(null);
  const innerRef = useRefC(null);
  const targetRef = useRefC(0);
  const [scrollY, setScrollY] = useStateC(0);
  const { TIMELINE } = window.HERO_DATA;

  useLayoutEffectC(() => {
    const outer = outerRef.current, inner = innerRef.current;
    if (!outer || !inner) return;
    const target = Math.max(0, inner.offsetHeight - outer.clientHeight);
    setScrollY((prev) => {
      const diff = target - prev;
      if (Math.abs(diff) < 0.5) return prev;
      if (Math.abs(diff) > 900) return target;   // snap big jumps (seek)
      return prev + diff * 0.22;                  // ease message reveals
    });
  });

  const rows = [];
  TIMELINE.forEach((item) => {
    // typing indicator window for AI/agent messages
    if (item.typeFrom != null && time >= item.typeFrom && time < item.at) {
      rows.push(<TypingRow key={item.id + '-t'} item={item} />);
      return;
    }
    if (time < item.at) return;
    switch (item.kind) {
      case 'system': rows.push(<SystemRow key={item.id} item={item} time={time} />); break;
      case 'in':     rows.push(<InRow key={item.id} item={item} time={time} />); break;
      case 'out':    rows.push(<OutRow key={item.id} item={item} time={time} />); break;
      case 'images': rows.push(<ImagesGroup key={item.id} item={item} />); break;
      case 'note':   rows.push(<NoteRow key={item.id} item={item} time={time} />); break;
      case 'agent':  rows.push(<AgentRow key={item.id} item={item} time={time} />); break;
      default: break;
    }
  });

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
      background: 'hsl(var(--background))' }}>
      <ChatHeader />
      <div ref={outerRef} id="chatlog" style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div ref={innerRef} style={{ padding: '20px 26px',
          transform: `translateY(${-scrollY}px)` }}>
          {rows}
        </div>
      </div>
      <Composer />
    </div>
  );
}

window.ChatPanel = ChatPanel;
