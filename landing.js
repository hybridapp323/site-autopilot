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

// 10) Calendly popup / badge widget
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
