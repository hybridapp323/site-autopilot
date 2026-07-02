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

// 5) Mobile nav: full-screen slide-in sheet
const navToggle = document.getElementById('nav-toggle');
const navScrim = document.getElementById('nav-scrim');
const navMenu = document.getElementById('nav-menu');
function closeMenu() {
  document.body.classList.remove('menu-open');
  if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
}
function openMenu() {
  document.body.classList.add('menu-open');
  if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
}
if (navToggle) {
  navToggle.addEventListener('click', () =>
    document.body.classList.contains('menu-open') ? closeMenu() : openMenu()
  );
  if (navScrim) navScrim.addEventListener('click', closeMenu);
  if (navMenu) navMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth >= 1024) closeMenu(); });
}

// 6) Preload demo videos after page load, then play only when the full mockup is visible
const lazyVideos = document.querySelectorAll('video[data-src]');
const showcaseMobileQuery = window.matchMedia('(max-width: 1023px)');

function isShowcaseDeviceEnabled(showcase) {
  const device = showcase.dataset.showcaseDevice;
  if (device === 'mobile') return showcaseMobileQuery.matches;
  if (device === 'desktop') return !showcaseMobileQuery.matches;
  return true;
}

function ensureVideoPoster(video) {
  if (!video.poster || video.dataset.posterReady === 'true') return null;
  const screen = video.closest('.mock-screen');
  if (!screen) return null;

  const poster = document.createElement('img');
  poster.className = 'video-poster-overlay';
  poster.src = video.poster;
  poster.alt = '';
  poster.decoding = 'async';
  poster.setAttribute('aria-hidden', 'true');
  screen.appendChild(poster);
  video.dataset.posterReady = 'true';
  return poster;
}

function getVideoPoster(video) {
  return video.closest('.mock-screen')?.querySelector('.video-poster-overlay') || null;
}

function prepareDemoVideo(video) {
  if (!isShowcaseDeviceEnabled(video)) return;
  if (video.dataset.preparing === 'true' || video.dataset.prepared === 'true') return;
  video.dataset.preparing = 'true';
  ensureVideoPoster(video);

  video.preload = 'auto';
  video.src = video.dataset.src;
  video.load();

  const markPrepared = () => {
    video.dataset.prepared = 'true';
    video.pause();
    try { video.currentTime = 0; } catch (e) {}
  };

  if (video.readyState >= 2) markPrepared();
  else video.addEventListener('loadeddata', markPrepared, { once: true });
}

function playDemoVideo(video) {
  if (!isShowcaseDeviceEnabled(video)) {
    resetDemoVideo(video);
    return;
  }
  if (video.dataset.visiblePlaying === 'true') return;
  video.dataset.visiblePlaying = 'true';
  video.dataset.activated = 'true';
  prepareDemoVideo(video);

  const playFromBeginning = () => {
    try { video.currentTime = 0; } catch (e) {}
    video.play().then(() => {
      getVideoPoster(video)?.classList.add('is-hidden');
    }).catch(() => {});
  };

  video.removeAttribute('data-src');

  if (video.readyState >= 2) playFromBeginning();
  else video.addEventListener('loadeddata', playFromBeginning, { once: true });
}

function resetDemoVideo(video) {
  if (video.dataset.visiblePlaying !== 'true' && video.currentTime === 0) return;
  video.dataset.visiblePlaying = 'false';
  video.pause();
  try { video.currentTime = 0; } catch (e) {}
}

function isDemoMockReadyToPlay(mock) {
  const rect = mock.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const verticalTolerance = 2;
  const horizontalTolerance = 2;

  const horizontallyVisible =
    rect.left >= -horizontalTolerance &&
    rect.right <= viewportWidth + horizontalTolerance;

  if (!horizontallyVisible) return false;

  if (rect.height <= viewportHeight) {
    return rect.top >= -verticalTolerance && rect.bottom <= viewportHeight + verticalTolerance;
  }

  return rect.top <= verticalTolerance && rect.bottom >= viewportHeight - verticalTolerance;
}

function scheduleDemoVideoPreload() {
  lazyVideos.forEach((video) => {
    if (isShowcaseDeviceEnabled(video)) prepareDemoVideo(video);
  });
}

if ('requestIdleCallback' in window) {
  window.addEventListener('load', () => requestIdleCallback(scheduleDemoVideoPreload, { timeout: 1600 }), { once: true });
} else {
  window.addEventListener('load', () => window.setTimeout(scheduleDemoVideoPreload, 700), { once: true });
}

if ('IntersectionObserver' in window) {
  const videosByMock = new WeakMap();
  const videoIo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = videosByMock.get(entry.target);
      if (!video) return;
      if (!isShowcaseDeviceEnabled(video)) {
        resetDemoVideo(video);
        return;
      }
      if (entry.isIntersecting && isDemoMockReadyToPlay(entry.target)) {
        playDemoVideo(video);
      } else {
        resetDemoVideo(video);
      }
    });
  }, { threshold: [0, 0.25, 0.5, 0.75, 0.99, 1], rootMargin: '0px' });

  lazyVideos.forEach((video) => {
    const mock = video.closest('.mock') || video;
    videosByMock.set(mock, video);
    videoIo.observe(mock);
  });
} else {
  lazyVideos.forEach(playDemoVideo);
}

// 7) Hero iframe showcase follows the same play/reset visibility rules
const iframeShowcases = document.querySelectorAll('.mock-iframe');
const iframeStates = new WeakMap();

function postIframeShowcaseCommand(iframe, command) {
  const target = iframe.contentWindow;
  if (!target) return;

  try {
    if (command === 'autopilot:showcase-play' && typeof target.__reset === 'function' && typeof target.__play === 'function') {
      target.__reset();
      target.__play();
      return;
    }
    if (command === 'autopilot:showcase-reset' && typeof target.__reset === 'function') {
      target.__reset();
      return;
    }
  } catch (e) {}

  target.postMessage(command, '*');
}

function playIframeShowcase(iframe) {
  if (!isShowcaseDeviceEnabled(iframe)) {
    resetIframeShowcase(iframe, true);
    return;
  }
  if (iframeStates.get(iframe) === 'playing') return;
  iframeStates.set(iframe, 'playing');
  postIframeShowcaseCommand(iframe, 'autopilot:showcase-play');
}

function resetIframeShowcase(iframe, force = false) {
  if (!force && iframeStates.get(iframe) === 'reset') return;
  iframeStates.set(iframe, 'reset');
  postIframeShowcaseCommand(iframe, 'autopilot:showcase-reset');
}

function syncIframeShowcase(mock, iframe) {
  if (!isShowcaseDeviceEnabled(iframe)) {
    resetIframeShowcase(iframe, true);
    return;
  }
  if (isDemoMockReadyToPlay(mock)) playIframeShowcase(iframe);
  else resetIframeShowcase(iframe);
}

if ('IntersectionObserver' in window) {
  const iframesByMock = new WeakMap();
  const iframeMocks = new WeakMap();
  const iframeIo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const iframe = iframesByMock.get(entry.target);
      if (!iframe) return;
      if (!isShowcaseDeviceEnabled(iframe)) {
        resetIframeShowcase(iframe, true);
        return;
      }
      if (entry.isIntersecting && isDemoMockReadyToPlay(entry.target)) {
        playIframeShowcase(iframe);
      } else {
        resetIframeShowcase(iframe);
      }
    });
  }, { threshold: [0, 0.25, 0.5, 0.75, 0.99, 1], rootMargin: '0px' });

  iframeShowcases.forEach((iframe) => {
    const mock = iframe.closest('.mock') || iframe;
    iframesByMock.set(mock, iframe);
    iframeMocks.set(iframe, mock);
    iframe.addEventListener('load', () => {
      resetIframeShowcase(iframe, true);
      syncIframeShowcase(mock, iframe);
    });
    iframeIo.observe(mock);
  });

  window.addEventListener('message', (event) => {
    if (event.data !== 'autopilot:showcase-ready') return;
    const iframe = Array.from(iframeShowcases).find((frame) => frame.contentWindow === event.source);
    if (!iframe) return;
    const mock = iframeMocks.get(iframe) || iframe.closest('.mock') || iframe;
    resetIframeShowcase(iframe, true);
    syncIframeShowcase(mock, iframe);
  });
} else {
  iframeShowcases.forEach(playIframeShowcase);
}

function syncResponsiveShowcases() {
  lazyVideos.forEach((video) => {
    resetDemoVideo(video);
    if (isShowcaseDeviceEnabled(video)) prepareDemoVideo(video);
  });
  iframeShowcases.forEach((iframe) => {
    const mock = iframe.closest('.mock') || iframe;
    resetIframeShowcase(iframe, true);
    syncIframeShowcase(mock, iframe);
  });
}

showcaseMobileQuery.addEventListener?.('change', syncResponsiveShowcases);

// 8) Mobile feature explorer — tabbed, big screenshot one at a time
(function buildMobileFeatures() {
  const mount = document.getElementById('features-mobile');
  if (!mount) return;
  const rows = [...document.querySelectorAll('#recursos .feature-row')];
  if (!rows.length) return;

  const data = rows.map((row) => {
    const ftag = row.querySelector('.ftag');
    const planBadge = row.querySelector('.plan-badge');
    const mock = row.querySelector('.feature-mock .mock');
    const fnote = row.querySelector('.fnote');
    return {
      fiHTML: ftag ? ftag.querySelector('.fi').innerHTML : '',
      label: ftag ? ftag.textContent.trim() : '',
      planBadgeHTML: planBadge ? planBadge.outerHTML : '',
      title: row.querySelector('.feature-copy h3').textContent,
      para: row.querySelector('.feature-copy p').textContent,
      fnote: fnote ? fnote.textContent : '',
      mockHTML: mock ? mock.outerHTML : '',
    };
  });

  const tabs = document.createElement('div');
  tabs.className = 'fm-tabs';
  tabs.setAttribute('role', 'tablist');
  const stage = document.createElement('div');
  stage.className = 'fm-stage';
  const dots = document.createElement('div');
  dots.className = 'fm-dots';

  let active = 0;

  function centerTab() {
    const at = tabs.children[active];
    if (!at) return;
    tabs.scrollTo({ left: at.offsetLeft - (tabs.clientWidth - at.offsetWidth) / 2, behavior: 'smooth' });
  }
  function render() {
    const d = data[active];
    stage.innerHTML =
      '<div class="fm-panel">' +
      d.planBadgeHTML +
      '<div class="fm-sub"><span class="fi">' + d.fiHTML + '</span>' + d.label + '</div>' +
      '<h3>' + d.title + '</h3>' +
      '<div class="fm-shot">' + d.mockHTML + '</div>' +
      '<p>' + d.para + '</p>' +
      (d.fnote ? '<div class="fnote">' + d.fnote + '</div>' : '') +
      '</div>';
    tabs.querySelectorAll('.fm-tab').forEach((t, i) => t.classList.toggle('active', i === active));
    dots.querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === active));
  }
  function go(i) {
    active = Math.max(0, Math.min(data.length - 1, i));
    render();
    centerTab();
  }

  data.forEach((d, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'fm-tab' + (i === 0 ? ' active' : '');
    tab.innerHTML = '<span class="fm-tab-ic">' + d.fiHTML + '</span>' + d.label;
    tab.addEventListener('click', () => go(i));
    tabs.appendChild(tab);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = i === 0 ? 'active' : '';
    dot.setAttribute('aria-label', 'Recurso ' + (i + 1));
    dot.addEventListener('click', () => go(i));
    dots.appendChild(dot);
  });

  // swipe support
  let sx = null;
  stage.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) < 45) return;
    go(active + (dx < 0 ? 1 : -1));
  });

  mount.append(tabs, stage, dots);
  render();
})();

// 9) Sticky bottom CTA bar
const mcta = document.getElementById('mobile-cta');
const heroEl = document.querySelector('.hero');
const ctaFinal = document.getElementById('cta');
function updateCta() {
  if (!mcta) return;
  if (window.innerWidth >= 1024) { mcta.classList.remove('show'); return; }
  const pastHero = window.scrollY > (heroEl ? heroEl.offsetHeight * 0.55 : 480);
  const nearFinal = ctaFinal ? ctaFinal.getBoundingClientRect().top < window.innerHeight * 0.9 : false;
  mcta.classList.toggle('show', pastHero && !nearFinal && !document.body.classList.contains('menu-open'));
}
window.addEventListener('scroll', updateCta, { passive: true });
window.addEventListener('resize', updateCta);
updateCta();

// 10) Demo lead form + Calendly popup / badge widget
const CALENDLY_URL = 'https://calendly.com/visionadsltda/nova-reuniao';
const DEMO_LEAD_ENDPOINT = 'https://kadbnljueppynlurwtir.supabase.co/functions/v1/site-demo-lead';
const calendlyOpeners = document.querySelectorAll('[data-calendly-open]');
const demoModal = document.getElementById('demo-lead-modal');
const demoForm = document.getElementById('demo-lead-form');
const demoStepLabel = demoModal?.querySelector('[data-demo-step-label]');
const demoStepCopy = demoModal?.querySelector('[data-demo-step-copy]');
const demoNext = demoModal?.querySelector('[data-demo-next]');
const demoBack = demoModal?.querySelector('[data-demo-back]');
const demoSubmitStatus = demoModal?.querySelector('[data-demo-submit-status]');
let demoStep = 1;
let lastCalendlyTrigger = null;
let lastFocusedBeforeDemo = null;

function trackMetaLead(trigger, leadData = {}) {
  if (!trigger?.hasAttribute('data-meta-lead')) return;
  if (typeof window.fbq !== 'function') return;

  try {
    window.fbq('track', 'Lead', {
      content_name: trigger.textContent.trim().replace(/\s+/g, ' '),
      page_variant: 'v2',
      store_name: leadData.store || '',
      monthly_sales: leadData.monthlySales || '',
      salespeople: leadData.salespeople || '',
    });
  } catch (e) {}
}

function buildCalendlyUrl(leadData = {}) {
  const url = new URL(CALENDLY_URL);
  if (leadData.name) url.searchParams.set('name', leadData.name);
  if (leadData.email) url.searchParams.set('email', leadData.email);
  return url.toString();
}

function launchCalendly(url = CALENDLY_URL) {
  if (window.location.protocol === 'file:') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  if (window.Calendly?.initPopupWidget) {
    window.Calendly.initPopupWidget({ url });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

function openCalendlyDirect(event) {
  if (event) event.preventDefault();
  trackMetaLead(event?.currentTarget);
  launchCalendly(CALENDLY_URL);
}

function setDemoStatus(message = '', tone = 'neutral') {
  if (!demoSubmitStatus) return;
  demoSubmitStatus.textContent = message;
  demoSubmitStatus.classList.toggle('is-visible', Boolean(message));
  demoSubmitStatus.classList.toggle('is-error', tone === 'error');
}

function clearDemoErrors(options = {}) {
  demoForm?.querySelectorAll('.field.is-invalid').forEach((field) => field.classList.remove('is-invalid'));
  demoForm?.querySelectorAll('.field-error').forEach((error) => { error.textContent = ''; });
  if (!options.keepStatus) setDemoStatus('');
}

function setDemoStep(step) {
  const previousStep = demoStep;
  demoStep = step;
  demoModal?.querySelectorAll('[data-demo-step]').forEach((panel) => {
    const isActive = panel.dataset.demoStep === String(step);
    panel.classList.toggle('is-active', isActive);
    panel.classList.toggle('is-reversing', isActive && step < previousStep);
  });
  demoModal?.querySelectorAll('[data-demo-progress]').forEach((bar) => {
    const barStep = Number(bar.dataset.demoProgress);
    bar.classList.toggle('is-active', barStep === step);
    bar.classList.toggle('is-complete', barStep < step);
  });
  if (demoStepLabel) demoStepLabel.textContent = `Etapa ${step} de 2`;
  if (demoStepCopy) {
    demoStepCopy.textContent = step === 1
      ? 'Antes de abrir a agenda, queremos entender quem vai ver o AutoPilot em a\u00e7\u00e3o.'
      : 'Agora, conte um pouco sobre a opera\u00e7\u00e3o para prepararmos uma demo mais precisa.';
  }
  if (demoNext) demoNext.textContent = step === 1 ? 'Continuar' : 'Agendar demo';
  if (demoBack) demoBack.classList.toggle('is-visible', step === 2);
  clearDemoErrors();
}

function getDemoFieldsForStep(step) {
  return Array.from(demoForm?.querySelectorAll(`[data-demo-step="${step}"] input`) || []);
}

function setFieldError(input, message) {
  const field = input.closest('.field');
  const error = demoForm?.querySelector(`[data-error-for="${input.name}"]`);
  field?.classList.toggle('is-invalid', Boolean(message));
  if (error) error.textContent = message || '';
}

function validateDemoStep(step) {
  let firstInvalid = null;

  getDemoFieldsForStep(step).forEach((input) => {
    const value = input.value.trim();
    let message = '';

    if (!value) {
      message = 'Preencha este campo.';
    } else if (input.type === 'email' && !isValidEmail(value)) {
      message = 'Informe um e-mail v\u00e1lido.';
    } else if (input.name === 'phone' && value.replace(/\D/g, '').length !== 11) {
      message = 'Informe um telefone com DDD e 11 n\u00fameros.';
    } else if (input.type === 'number') {
      const numericValue = Number(value);
      const min = input.min === '' ? null : Number(input.min);
      if (!Number.isFinite(numericValue) || (min !== null && numericValue < min)) {
        message = input.name === 'salespeople' ? 'Informe pelo menos 1 vendedor.' : 'Informe uma quantidade v\u00e1lida.';
      }
    }

    setFieldError(input, message);
    if (message && !firstInvalid) firstInvalid = input;
  });

  if (firstInvalid) {
    firstInvalid.focus();
    return false;
  }
  return true;
}

function isValidEmail(value) {
  const email = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function collectDemoLead() {
  const data = new FormData(demoForm);
  const instagram = String(data.get('instagram') || '').trim();
  const params = new URLSearchParams(window.location.search);

  return {
    name: String(data.get('name') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    email: String(data.get('email') || '').trim(),
    store: String(data.get('store') || '').trim(),
    instagram: instagram && !instagram.startsWith('@') ? '@' + instagram : instagram,
    monthlySales: String(data.get('monthlySales') || '').trim(),
    salespeople: String(data.get('salespeople') || '').trim(),
    website: String(data.get('website') || '').trim(),
    capturedAt: new Date().toISOString(),
    sourcePath: window.location.pathname,
    sourceUrl: window.location.href,
    referrer: document.referrer || '',
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
    utmTerm: params.get('utm_term') || '',
    utmContent: params.get('utm_content') || '',
  };
}

function persistDemoLead(leadData) {
  window.__apDemoLead = leadData;
  try {
    localStorage.setItem('ap-demo-lead', JSON.stringify(leadData));
  } catch (e) {}
  try {
    window.dispatchEvent(new CustomEvent('autopilot:demoLeadReady', { detail: leadData }));
  } catch (e) {}
}

function closeDemoForm(options = {}) {
  if (!demoModal) return;
  if (demoForm?.classList.contains('is-submitting') && !options.force) return;
  demoModal.classList.remove('is-open');
  demoModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('demo-modal-open');
  if (options.restoreFocus !== false) lastFocusedBeforeDemo?.focus?.();
}

function openDemoForm(event) {
  if (!demoModal || !demoForm) {
    openCalendlyDirect(event);
    return;
  }

  if (event) event.preventDefault();
  lastCalendlyTrigger = event?.currentTarget || null;
  lastFocusedBeforeDemo = document.activeElement;
  closeMenu();
  setDemoStep(1);
  demoModal.classList.add('is-open');
  demoModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('demo-modal-open');
  window.setTimeout(() => getDemoFieldsForStep(1)[0]?.focus(), 80);
}

function formatPhoneInput(input) {
  const digits = input.value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) {
    input.value = digits;
  } else if (digits.length <= 6) {
    input.value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else if (digits.length <= 10) {
    input.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else {
    input.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
}

function normalizeEmailInput(input) {
  input.value = input.value.trim().toLowerCase();
}

function setDemoSubmitting(isSubmitting) {
  if (!demoForm) return;
  demoForm.classList.toggle('is-submitting', isSubmitting);
  demoForm.querySelectorAll('input, button').forEach((control) => {
    control.disabled = isSubmitting;
  });
  if (demoNext) demoNext.textContent = isSubmitting ? 'Enviando...' : (demoStep === 1 ? 'Continuar' : 'Agendar demo');
}

async function submitDemoLead(leadData) {
  const response = await fetch(DEMO_LEAD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leadData),
  });
  let result = null;

  try {
    result = await response.json();
  } catch (e) {}

  if (!response.ok || !result?.ok) {
    const error = new Error(result?.error || 'server_error');
    error.status = response.status;
    error.fields = result?.fields || {};
    throw error;
  }

  return result;
}

function applyServerFieldErrors(fields = {}) {
  let firstInvalid = null;

  Object.entries(fields).forEach(([name, message]) => {
    const input = demoForm?.querySelector(`[name="${name}"]`);
    if (!input) return;
    setFieldError(input, message || 'Revise este campo.');
    if (!firstInvalid) firstInvalid = input;
  });

  firstInvalid?.focus();
}

let calendlyBadgeInitialized = false;
function initCalendlyBadge(attempt = 0) {
  if (calendlyBadgeInitialized) return;
  if (demoModal) return;
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

if (demoModal && demoForm) {
  demoModal.querySelectorAll('[data-demo-close]').forEach((trigger) => trigger.addEventListener('click', () => closeDemoForm()));
  demoBack?.addEventListener('click', () => setDemoStep(1));
  demoForm.querySelector('[name="phone"]')?.addEventListener('input', (event) => formatPhoneInput(event.currentTarget));
  demoForm.querySelector('[name="email"]')?.addEventListener('blur', (event) => normalizeEmailInput(event.currentTarget));
  demoForm.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', () => setFieldError(input, ''));
  });
  demoForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateDemoStep(demoStep)) return;
    if (demoStep === 1) {
      setDemoStep(2);
      window.setTimeout(() => getDemoFieldsForStep(2)[0]?.focus(), 50);
      return;
    }

    const leadData = collectDemoLead();
    setDemoSubmitting(true);
    setDemoStatus('Salvando seus dados...');

    try {
      const result = await submitDemoLead(leadData);
      persistDemoLead({ ...leadData, leadId: result.leadId, webhookStatus: result.webhookStatus });
      trackMetaLead(lastCalendlyTrigger, leadData);
      closeDemoForm({ restoreFocus: false, force: true });
      demoForm.reset();
      setDemoStep(1);
      launchCalendly(buildCalendlyUrl(leadData));
    } catch (error) {
      applyServerFieldErrors(error.fields);
      const message = error.status === 429
        ? 'Ja recebemos esta solicitacao. Tente novamente mais tarde.'
        : 'Nao foi possivel salvar seus dados agora. Revise os campos e tente novamente.';
      setDemoStatus(message, 'error');
    } finally {
      setDemoSubmitting(false);
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && demoModal.classList.contains('is-open')) closeDemoForm();
  });
}

calendlyOpeners.forEach((trigger) => trigger.addEventListener('click', openDemoForm));
if (document.readyState === 'complete') initCalendlyBadge();
else window.addEventListener('load', () => initCalendlyBadge());
