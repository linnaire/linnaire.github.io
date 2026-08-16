/* ==========================================================================
   Linnaire Galleno — portfolio behaviour

   Plain JavaScript, no libraries, no build step. Everything is wrapped in
   small named functions so you can read them one at a time.

   Contents:
     A. PROJECTS  — the only data you need to edit to add portfolio work
     B. Helpers
     1. Theme toggle (light / dark, remembered between visits)
     2. Mobile menu
     3. Sticky header + scroll progress bar
     4. Active nav link while scrolling
     5. Scroll reveal animations
     6. Counting stat numbers
     7. Work cards rendered from PROJECTS
     8. Copy-email button
     9. Current year in the footer
   ========================================================================== */


/* ==========================================================================
   A. PROJECTS
   --------------------------------------------------------------------------
   This is your portfolio. Add an object to the array and a card appears on
   the site automatically — you never need to touch index.html.

   Each project supports:
     title    (required)  Name of the project
     summary  (required)  One or two sentences on what it does / what you did
     tags     (optional)  Array of short strings shown as pills
     url      (optional)  Link out. Omit it and the card renders without a link
     linkText (optional)  Label for the link. Defaults to "View project"

   Example:

     {
       title: 'Acumatica ↔ ConnectWise integration',
       summary: 'Two-way sync of tickets and billing records between ConnectWise
                 Manage and Acumatica, built on the Acumatica Framework.',
       tags: ['Acumatica', 'REST API', 'C#'],
       url: 'https://example.com/case-study',
       linkText: 'Read the case study'
     }

   Leave the array empty and the site shows three tasteful "in progress"
   placeholder cards instead.
   ========================================================================== */

const PROJECTS = [
  // Add your projects here when you're ready.
];

/* While PROJECTS is empty the three placeholder cards written directly in
   index.html stay on the page. Edit their wording there. */


/* ==========================================================================
   B. HELPERS
   ========================================================================== */

const $  = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/** Reads a value from localStorage without throwing in private-browsing mode. */
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* ignore */ } }
};

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ==========================================================================
   1. THEME TOGGLE
   The initial theme is applied by the small inline script in index.html so the
   page never flashes. This just handles clicks afterwards.
   ========================================================================== */

function initTheme() {
  const toggle = $('#themeToggle');
  if (!toggle) return;

  const sync = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  };

  toggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    storage.set('theme', next);
    sync();
  });

  sync();

  // Follow the operating system if the visitor has never chosen manually.
  // Older Safari only has the deprecated addListener(), so check for both.
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = (event) => {
    if (!storage.get('theme')) {
      document.documentElement.setAttribute('data-theme', event.matches ? 'dark' : 'light');
      sync();
    }
  };
  if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
  else if (mq.addListener) mq.addListener(onSystemChange);
}


/* ==========================================================================
   2. MOBILE MENU
   ========================================================================== */

function initMenu() {
  const button = $('#menuToggle');
  const nav = $('#nav');
  if (!button || !nav) return;

  const header = $('#siteHeader');

  const setOpen = (isOpen) => {
    // Move focus with the drawer, otherwise keyboard users tab straight past
    // the links on open and land nowhere on close.
    const focusWasInside = nav.contains(document.activeElement);

    nav.classList.toggle('is-open', isOpen);
    if (header) header.classList.toggle('menu-open', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');

    if (isOpen) {
      // Wait one frame: the drawer is still `visibility: hidden` at this point
      // in the same tick, and a hidden element cannot take focus.
      const first = nav.querySelector('a');
      if (first) requestAnimationFrame(() => first.focus({ preventScroll: true }));
    } else if (focusWasInside) {
      button.focus();
    }
  };

  const close = () => setOpen(false);

  button.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));

  // Close after tapping a link, and on Escape.
  $$('a', nav).forEach((link) => link.addEventListener('click', close));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 820) close(); });

  // Tapping anywhere outside the open drawer dismisses it.
  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('is-open')) return;
    if (nav.contains(event.target) || button.contains(event.target)) return;
    close();
  });
}


/* ==========================================================================
   3. STICKY HEADER + SCROLL PROGRESS
   ========================================================================== */

function initScrollChrome() {
  const header = $('#siteHeader');
  const progress = $('#scrollProgress');
  let ticking = false;

  const update = () => {
    const scrolled = window.scrollY;

    if (header) header.classList.toggle('is-stuck', scrolled > 24);

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (scrolled / max) * 100 : 0;
      progress.style.width = pct + '%';
    }
    ticking = false;
  };

  // requestAnimationFrame keeps this cheap even on fast scroll.
  window.addEventListener('scroll', () => {
    if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
  }, { passive: true });

  update();
}


/* ==========================================================================
   4. ACTIVE NAV LINK
   Highlights the nav item for whichever section is currently in view.
   ========================================================================== */

function initActiveNav() {
  const links = $$('.nav a');
  const sections = links
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  if (!sections.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
      });
    });
  }, {
    // Trigger when a section crosses the upper third of the viewport.
    rootMargin: '-30% 0px -60% 0px',
    threshold: 0
  });

  sections.forEach((section) => observer.observe(section));
}


/* ==========================================================================
   5. SCROLL REVEAL
   ========================================================================== */

function initReveal() {
  const items = $$('.reveal');
  if (!items.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry, index) => {
      if (!entry.isIntersecting) return;
      // Small stagger so groups of cards cascade rather than pop together.
      setTimeout(() => entry.target.classList.add('is-visible'), index * 70);
      obs.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  items.forEach((item) => observer.observe(item));
}


/* ==========================================================================
   6. COUNTING STATS
   Animates 0 → the number in data-count when the block scrolls into view.
   ========================================================================== */

function initCounters() {
  const numbers = $$('[data-count]');
  if (!numbers.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

  const countUp = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1100;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic — fast at first, settles gently.
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    el.textContent = '0';
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countUp(entry.target);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.6 });

  numbers.forEach((el) => observer.observe(el));
}


/* ==========================================================================
   7. WORK CARDS
   ========================================================================== */

function renderWork() {
  const grid = $('#workGrid');
  // Nothing to do until there are real projects — the static placeholder cards
  // already in index.html stay exactly as they are.
  if (!grid || PROJECTS.length === 0) return;

  // Escape any text that goes into HTML, so a stray < in a summary can't break the page.
  const esc = (value) => String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const pad = (n) => String(n + 1).padStart(2, '0');

  grid.innerHTML = PROJECTS.map((project, i) => {
    const tags = (project.tags || [])
      .map((tag) => `<li>${esc(tag)}</li>`).join('');

    const link = project.url
      ? `<a class="work-link" href="${esc(project.url)}" target="_blank" rel="noopener">
           ${esc(project.linkText || 'View project')} <span class="arrow" aria-hidden="true">↗</span>
         </a>`
      : '';

    return `
      <article class="work-card reveal">
        <span class="work-index">${pad(i)}</span>
        <h3>${esc(project.title)}</h3>
        <p>${esc(project.summary)}</p>
        ${tags ? `<ul class="work-tags">${tags}</ul>` : ''}
        ${link}
      </article>
    `;
  }).join('');
}


/* ==========================================================================
   8. COPY EMAIL
   ========================================================================== */

function initCopyEmail() {
  const button = $('#copyEmail');
  const label = $('#copyEmailLabel');
  if (!button || !label) return;

  const original = label.textContent;
  const live = $('#copyStatus');
  let resetTimer;

  /** Last-resort copy for browsers that block the async clipboard API on file:// */
  const legacyCopy = (text) => {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.top = '-9999px';
    document.body.appendChild(field);
    field.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(field);
    return ok;
  };

  button.addEventListener('click', async () => {
    const email = button.dataset.email;
    let ok = false;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { await navigator.clipboard.writeText(email); ok = true; } catch (e) { ok = false; }
    }
    if (!ok) ok = legacyCopy(email);

    // Tell the truth: some browsers refuse clipboard access on local files.
    const message = ok ? 'Copied to clipboard' : 'Copy blocked — select the address above';
    label.textContent = message;
    if (live) live.textContent = message;
    button.classList.toggle('is-copied', ok);

    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      label.textContent = original;
      if (live) live.textContent = '';
      button.classList.remove('is-copied');
    }, 2600);
  });
}


/* ==========================================================================
   9. FOOTER YEAR
   ========================================================================== */

function initYear() {
  const el = $('#year');
  if (el) el.textContent = String(new Date().getFullYear());
}


/* ==========================================================================
   BOOT

   Each step runs inside its own try/catch so that one unsupported browser API
   can never take the whole page down with it. If the file fails to parse at
   all, `no-js` is never removed and the CSS safety net in styles.css keeps the
   content visible and the navigation usable.
   ========================================================================== */

document.documentElement.classList.remove('no-js');

[
  renderWork,   // first, so the reveal observer can see the generated cards
  initTheme,
  initMenu,
  initScrollChrome,
  initActiveNav,
  initReveal,
  initCounters,
  initCopyEmail,
  initYear
].forEach((step) => {
  try { step(); } catch (error) { console.error(step.name + ' failed:', error); }
});
