// AutoPilot CRM — Landing interactions

// 1) Nav: solid/glass on scroll
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// 2) Pricing: monthly / annual toggle
const PRICES = {
  standard: {
    mensal:  { amt: 'R$ 597,90', note: '', noia: 'R$ 297,00' },
    anual:   { amt: 'R$ 418,53', note: 'R$ 5.022/ano · economize 30%', noia: 'R$ 207,90' },
  },
  max: {
    mensal:  { amt: 'R$ 797,00', note: '', noia: 'R$ 497,00' },
    anual:   { amt: 'R$ 557,90', note: 'R$ 6.694/ano · economize 30%', noia: 'R$ 347,90' },
  },
};

let cycle = 'anual';
function renderPrices() {
  document.querySelectorAll('.plan').forEach((plan) => {
    const key = plan.dataset.plan;
    if (!PRICES[key]) return;
    const p = PRICES[key][cycle];
    const amount = plan.querySelector('[data-amt]');
    const note = plan.querySelector('[data-note]');
    if (amount) amount.textContent = p.amt;
    if (note) note.textContent = p.note;
    const noia = plan.querySelector('[data-noia]');
    if (noia) noia.textContent = p.noia + '/mês';
  });
  document.querySelectorAll('.price-toggle button').forEach((b) =>
    b.classList.toggle('active', b.dataset.cycle === cycle)
  );
}
document.querySelectorAll('.price-toggle button').forEach((b) => {
  b.addEventListener('click', () => { cycle = b.dataset.cycle; renderPrices(); });
});
renderPrices();

// 3) Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// 4) Theme toggle (light / dark) with persistence
const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      try { localStorage.setItem('ap-theme', 'dark'); } catch (e) {}
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      try { localStorage.setItem('ap-theme', 'light'); } catch (e) {}
    }
  });
}

// 5) Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if (toggle && links) {
  const setMenuOpen = (open) => {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.addEventListener('click', () => {
    setMenuOpen(!links.classList.contains('open'));
  });

  links.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => setMenuOpen(false))
  );

  document.addEventListener('click', (event) => {
    if (!links.classList.contains('open')) return;
    if (links.contains(event.target) || toggle.contains(event.target)) return;
    setMenuOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuOpen(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) setMenuOpen(false);
  });
}

// 6) Lazy-load heavy demo videos only when they are close to view
const lazyVideos = document.querySelectorAll('video[data-src]');
if ('IntersectionObserver' in window) {
  const videoIo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const video = entry.target;
      video.src = video.dataset.src;
      video.removeAttribute('data-src');
      video.load();
      video.play().catch(() => {});
      videoIo.unobserve(video);
    });
  }, { rootMargin: '600px 0px' });
  lazyVideos.forEach((video) => videoIo.observe(video));
} else {
  lazyVideos.forEach((video) => {
    video.src = video.dataset.src;
    video.removeAttribute('data-src');
  });
}

// 7) Calendly popup / badge widget
const CALENDLY_URL = 'https://calendly.com/visionadsltda/nova-reuniao';
const calendlyOpeners = document.querySelectorAll('[data-calendly-open]');

function openCalendly(event) {
  if (event) event.preventDefault();
  if (window.location.protocol === 'file:') {
    window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer');
    return;
  }
  if (window.Calendly?.initPopupWidget) {
    window.Calendly.initPopupWidget({ url: CALENDLY_URL });
  } else {
    window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer');
  }
}

let calendlyBadgeInitialized = false;
function initCalendlyBadge(attempt = 0) {
  if (calendlyBadgeInitialized) return;
  if (window.location.protocol === 'file:') return;
  if (!window.Calendly?.initBadgeWidget) {
    if (attempt < 40) window.setTimeout(() => initCalendlyBadge(attempt + 1), 250);
    return;
  }
  calendlyBadgeInitialized = true;
  window.Calendly.initBadgeWidget({
    url: CALENDLY_URL,
    text: 'Agende um horário comigo',
    color: '#0069ff',
    textColor: '#ffffff',
    branding: true,
  });
}

calendlyOpeners.forEach((trigger) => trigger.addEventListener('click', openCalendly));
if (document.readyState === 'complete') initCalendlyBadge();
else window.addEventListener('load', () => initCalendlyBadge());
