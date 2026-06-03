// Minimal Lucide-style inline icons (stroke = currentColor, 2px).
const ic = (paths, { fill = false, size = 16, vb = 24 } = {}) =>
  function IconCmp({ size: s = size, style }) {
    return (
      <svg width={s} height={s} viewBox={`0 0 ${vb} ${vb}`} fill={fill ? 'currentColor' : 'none'}
        stroke={fill ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round"
        strokeLinejoin="round" style={{ display: 'block', flexShrink: 0, ...style }}>
        {paths}
      </svg>
    );
  };

const Icon = {
  Sparkles: ic(<><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/></>),
  Bot: ic(<><rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M12 8V4"/><circle cx="12" cy="3" r="1"/><path d="M9 13h.01M15 13h.01"/><path d="M2 13v2M22 13v2"/></>),
  Transfer: ic(<><path d="M8 3 4 7l4 4"/><path d="M4 7h12"/><path d="M16 21l4-4-4-4"/><path d="M20 17H8"/></>),
  EyeOff: ic(<><path d="M9.9 4.2A10.3 10.3 0 0 1 12 4c5 0 9 4.5 10 8a13 13 0 0 1-2.2 3.3"/><path d="M6.1 6.2A12.8 12.8 0 0 0 2 12c1 3.5 5 8 10 8a10 10 0 0 0 4.3-1"/><path d="m3 3 18 18"/></>),
  XCircle: ic(<><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/></>),
  User: ic(<><circle cx="12" cy="8" r="4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></>),
  Info: ic(<><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>),
  Plus: ic(<><path d="M12 5v14M5 12h14"/></>),
  Smile: ic(<><circle cx="12" cy="12" r="9"/><path d="M8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/></>),
  Mic: ic(<><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v3"/></>),
  Note: ic(<><path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4"/><path d="M8 9h8M8 13h5"/></>),
  Lock: ic(<><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>, { vb: 24 }),
  Check: ic(<><path d="M5 12l4.5 4.5L19 7"/></>),
  MessageSquare: ic(<><path d="M4 5h16v11H8l-4 4z"/></>),
  Layout: ic(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>),
  Calendar: ic(<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>),
  Phone: ic(<><path d="M6 3h3l2 5-2 1a11 11 0 0 0 5 5l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z"/></>),
  Branch: ic(<><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M6 8.5v7M6 15a6 6 0 0 1 6-6h3.5"/></>),
  Chart: ic(<><path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="12" width="3" height="5"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="5" width="3" height="12"/></>),
  Settings: ic(<><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></>),
  Search: ic(<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>),
  Send: ic(<><path d="M4 12l16-7-7 16-2.5-6.5L4 12z"/></>),
};

window.Icon = Icon;
