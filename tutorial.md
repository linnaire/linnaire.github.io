# Building linnaire.github.io — a walkthrough

A guide to everything in this repository, written for someone who is
experienced in software but new to frontend work.

You have twelve years of .NET behind you, so this doesn't explain what a
function or a variable is. What it does explain is the part that's genuinely
different: how a browser turns three text files into a page, why CSS behaves so
unlike any language you've used, and where the traps are. Where it helps, I'll
compare to things you already know from C# and SQL Server.

**Contents**

1. [The technology, in one page](#1-the-technology-in-one-page)
2. [A tour of the files](#2-a-tour-of-the-files)
3. [The HTML](#3-the-html)
4. [The CSS](#4-the-css)
5. [The JavaScript](#5-the-javascript)
6. [Seven bugs, and what each one teaches](#6-seven-bugs-and-what-each-one-teaches)
7. [Git and deployment](#7-git-and-deployment)
8. [The Digital Twin, and the one lesson worth keeping](#8-the-digital-twin-and-the-one-lesson-worth-keeping)
9. [Five things I would improve](#9-five-things-i-would-improve)
10. [Glossary](#10-glossary)

---

## 1. The technology, in one page

### The three languages

A web page is built from three separate languages, each with one job. Keeping
them separate is the whole discipline of frontend work.

| Language | Job | Rough .NET analogy |
|---|---|---|
| **HTML** | Structure and content — what things *are* | Your view model, or a Razor view's markup |
| **CSS** | Presentation — what things *look like* | Nothing in .NET really. It's a rules engine. |
| **JavaScript** | Behaviour — what happens when someone *does* something | Your event handlers and business logic |

The rule of thumb: if you can express something in HTML, don't use CSS. If you
can express it in CSS, don't use JavaScript. Each step up costs you
robustness — HTML always works, CSS almost always works, JavaScript works only
if it loads, parses, and doesn't throw.

### How a browser actually loads this page

Worth understanding, because several decisions in this codebase only make sense
once you do:

1. The browser requests `index.html` and starts reading it **top to bottom**.
2. It hits `<link rel="stylesheet" href="resources/css/styles.css">` and blocks
   — nothing renders until the CSS arrives. This is why CSS goes in the `<head>`.
3. It builds the **DOM** (Document Object Model): an in-memory tree of objects,
   one per HTML element. Think of it as an object graph your code can query and
   mutate.
4. It applies the CSS rules to that tree and paints the result.
5. It hits `<script src="resources/js/script.js"></script>` at the *bottom* of
   `<body>` and runs it. By then the DOM exists, so the script can find elements.

That last point matters: put a script at the top and it runs before the elements
it wants to manipulate exist. There is exactly one script in the `<head>` of
this site, and there's a specific reason for it — see §3.

### Why no framework

React, Next.js, Vue and Angular all solve a real problem: keeping a complex UI
in sync with changing data. If you're building a dashboard with a thousand rows
that update live, hand-writing DOM updates is miserable and a framework earns
its keep immediately.

This site is a single page of mostly-static content. There is no data to keep in
sync. A framework would add:

- a `node_modules` folder with hundreds of packages
- a build step between "edit file" and "see change"
- a toolchain that needs upgrading, and breaks when you don't

...in exchange for solving a problem this site doesn't have.

So: three files, no build step, no dependencies. You edit `index.html`, save,
press refresh. That immediacy is worth a lot when you're learning. The tradeoff
is real though — see the improvement suggestions in §9, where hand-written HTML
starts to hurt.

---

## 2. A tour of the files

```
linnaire.github.io/
├── index.html                          all the content and page structure
├── favicon.svg                         the "LG" browser-tab icon (modern)
├── favicon.ico                         same icon, for older browsers
├── README.md                           how to run and edit the site
├── tutorial.md                         this document
├── .gitignore                          what git should never commit
└── resources/
    ├── css/styles.css                  every visual rule
    ├── js/script.js                    every interactive behaviour
    └── cv/Linnaire Galleno - Resume.pdf
```

Roughly 2,000 lines total, of which about half is CSS. That ratio is normal —
in frontend work, CSS is usually the biggest and most under-estimated part of
the job.

The `resources/` layout wasn't my invention; it's the convention your previous
site already used, so I kept it.

---

## 3. The HTML

### The document skeleton

```html
<!DOCTYPE html>
<html lang="en" data-theme="light" class="no-js">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Linnaire Galleno — Acumatica Technical Consultant</title>
  ...
</head>
<body>
  ...
</body>
</html>
```

Three things on that `<html>` tag are doing real work:

- **`lang="en"`** — tells screen readers which language to pronounce, and
  browsers which dictionary to use. One attribute, meaningful accessibility win.
- **`data-theme="light"`** — a *data attribute*, a place to store custom state
  directly on an element. CSS can read it. This one line is the entire
  light/dark mechanism, explained in §4.
- **`class="no-js"`** — assumes JavaScript is unavailable until proven
  otherwise. JavaScript's very first action is to remove this class. If the
  script never runs, the class stays, and CSS uses it to keep everything
  visible. This is called **progressive enhancement**: build something that
  works, then layer improvements on top that degrade gracefully.

The `viewport` meta tag is non-negotiable for mobile. Without it, phones render
the page at desktop width and zoom out, and your careful responsive layout is
never seen.

### The one script in the head

```html
<script>
  (function () {
    try {
      var saved = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));
    } catch (e) { /* private browsing: just keep the default */ }
  })();
</script>
```

I said scripts belong at the bottom. This is the exception, and it's a good
lesson in why rules have exceptions.

If you set the theme at the bottom of the page, the browser has *already
painted* the light theme by then. A dark-mode user sees a white flash, then
darkness. It's a jarring 100ms that makes a site feel cheap.

Running this in the `<head>`, before any painting, means the correct theme is
set from the very first frame. The cost is a blocking script — but it's four
lines, so the cost is nothing.

`localStorage` is a small key/value store in the browser, scoped to your
domain, that survives page reloads and browser restarts. Think of it as a tiny
per-visitor settings table. The `try/catch` is there because some privacy modes
make `localStorage` *throw* on access rather than return null.

### Semantic HTML

Compare two ways of writing a navigation bar:

```html
<!-- Works, but means nothing -->
<div class="nav">
  <div class="nav-item">About</div>
</div>

<!-- What this site does -->
<nav class="nav" aria-label="Primary">
  <a href="#about">About</a>
</nav>
```

Both can be made to *look* identical. But the second one tells the browser, a
screen reader, and Google's crawler that this is navigation and those are
links. A screen reader user can jump straight to it. Keyboard users can Tab to
the links, because `<a>` is focusable and `<div>` is not.

This site uses `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`,
`<footer>` and — for the career timeline — an ordered list, because the jobs
genuinely are a sequence:

```html
<ol class="timeline">
  <li class="timeline-item reveal">
    <div class="timeline-when">
      <span class="timeline-range">Jan 2022 — Present</span>
      <span class="badge badge-live">Current</span>
    </div>
    <div class="timeline-body">
      <h3>Acumatica Technical Consultant</h3>
      <p class="timeline-org">Clients First Business Solutions</p>
      <ul>
        <li>Build new modules and extend existing applications...</li>
      </ul>
    </div>
  </li>
</ol>
```

To add a job, copy one `<li class="timeline-item">` block and edit it. The first
one in the list automatically gets the filled dot and the "Current" badge —
CSS handles that with `:first-child`, so you never mark it manually.

### Headings are a structure, not a font size

`<h1>` through `<h6>` are an outline, and screen readers let users navigate by
them. There should be exactly one `<h1>` per page (the hero headline here), and
levels must not skip — an `<h3>` directly inside an `<h1>` section is a bug even
though it looks fine.

Never pick a heading level because you like its size. Pick the right level, then
set the size in CSS.

### Accessibility attributes you'll see in the file

| Attribute | What it does |
|---|---|
| `aria-label="Switch colour theme"` | Gives an icon-only button a name a screen reader can announce |
| `aria-hidden="true"` | Hides purely decorative things (the SVG icons) from screen readers |
| `aria-expanded="false"` | Tells assistive tech whether the mobile menu is open |
| `role="status"` + `aria-live="polite"` | A region that announces changes — used for "Copied to clipboard" |
| `tabindex="-1"` on `<main>` | Makes it focusable *programmatically* so the skip link can jump there |

That last one pairs with the very first element in the body:

```html
<a class="skip-link" href="#main">Skip to content</a>
```

It's invisible until focused. A keyboard user pressing Tab on arrival gets
"Skip to content" as the first stop, so they don't have to tab through the whole
navigation on every page. Small, and standard practice.

---

## 4. The CSS

This is where most of the work is, and where the mental model differs most from
what you're used to.

### CSS is a rules engine, not a program

You don't tell CSS "make this element blue." You write rules that *match*
elements, and the browser resolves conflicts. It's closer to a `WHERE` clause
than to an assignment statement.

```css
.twin-bubble { color: red; }           /* matches every element with class twin-bubble */
.card .title { color: blue; }          /* matches .title anywhere inside .card */
.card > .title { color: green; }       /* matches .title that is a DIRECT child of .card */
a:hover { color: purple; }             /* matches links under the cursor */
```

When two rules set the same property on the same element, the winner is decided
by **specificity**: an ID beats a class, a class beats an element name; ties go
to whichever came last in the file. Getting into specificity fights is the
classic way CSS becomes unmaintainable, and it's why you'll see this file stick
almost entirely to single class names.

### Design tokens: the most important idea here

The top of `styles.css` defines **custom properties** (CSS variables). This is
the single highest-leverage thing in the file:

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-serif: 'Fraunces', 'Iowan Old Style', Georgia, serif;

  --fs-display: clamp(2.6rem, 1.4rem + 4.6vw, 5.1rem);
  --space-section: clamp(5rem, 3rem + 8vw, 9rem);
  --container: 1140px;
  --radius: 14px;

  --bg:        #f7f6f2;   /* warm paper */
  --bg-alt:    #efede7;   /* alternating band */
  --surface:   #fffefb;
  --text:      #14171a;
  --text-mid:  #4a5157;
  --text-soft: #62696f;   /* 4.76:1 on the darkest background — passes WCAG AA */
  --accent:    #16473c;   /* deep evergreen */
}
```

`:root` is the `<html>` element. Defining variables there makes them available
everywhere, because CSS variables **inherit** down the tree.

Everything else in the file then refers to these names instead of literal
values:

```css
.btn-primary {
  background: var(--accent);
  color: var(--on-accent);
}
```

The payoff: change `--accent` in one place and every button, link, badge,
timeline dot and focus ring re-tints. If those hex codes were scattered across
1,000 lines, a rebrand would be a find-and-replace with no way to know you'd
caught them all.

This is the same instinct as extracting a constant, except CSS variables are
*live* — they're resolved by the browser at render time, not substituted at
build time. Which leads directly to the next trick.

### Light and dark mode, in nine lines

```css
[data-theme='dark'] {
  --bg:        #0e100f;
  --bg-alt:    #141715;
  --surface:   #171a19;
  --text:      #eceeec;
  --text-mid:  #b1b8b4;
  --accent:    #7fd6b8;
  --on-accent: #0e100f;
}
```

That's the entire dark theme. Not a single component rule is duplicated.

Because variables are live, changing `data-theme` on `<html>` causes the browser
to re-resolve every `var()` in the document. The theme toggle in JavaScript is
literally one line of consequence:

```js
document.documentElement.setAttribute('data-theme', next);
```

If you take one idea from this document into your own work, make it this one.

### Fluid sizing with `clamp()`

```css
--fs-display: clamp(2.6rem, 1.4rem + 4.6vw, 5.1rem);
```

`clamp(MIN, PREFERRED, MAX)` reads as: never smaller than `2.6rem`, never larger
than `5.1rem`, and in between scale with `1.4rem + 4.6vw`.

`vw` means "1% of viewport width", so the preferred value grows with the window.
The result is text that scales *smoothly* across every screen size, instead of
jumping at breakpoints. The old approach needed three or four media queries per
text size; this needs none.

Units worth knowing:

| Unit | Meaning |
|---|---|
| `px` | Absolute pixels. Fine for borders; avoid for text. |
| `rem` | Relative to the root font size (usually 16px). `1rem` = 16px, and it **respects the user's browser font-size setting** — which is why body text should use it. |
| `em` | Relative to the *current element's* font size. Handy for spacing that should scale with its own text. |
| `%` | Relative to the parent. |
| `vw` / `vh` | 1% of viewport width / height. |
| `ch` | The width of one "0" character. `max-width: 68ch` is a readable line length. |

### Layout: Flexbox and Grid

Two layout systems, with a clean division of labour.

**Flexbox** — one dimension, content-driven. Use it for a row of buttons, a
navbar, anything where items sit in a line:

```css
.header-inner {
  display: flex;
  align-items: center;          /* vertical centring, the thing CSS was mocked for */
  justify-content: space-between;
  gap: 1.5rem;                  /* space between items, no margin hacks */
}
```

**Grid** — two dimensions, layout-driven. Use it when you're defining a
structure that content flows into:

```css
.about-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
  gap: clamp(2.5rem, 1rem + 5vw, 5rem);
}
```

`fr` is a "fraction of the free space" unit, unique to Grid. `1.55fr 1fr` means
the left column gets 1.55 parts and the right gets 1 — so roughly 61%/39%,
recalculated automatically at any width.

A pattern used repeatedly here:

```css
.skills-grid {
  grid-template-columns: repeat(auto-fit, minmax(258px, 1fr));
}
```

"Fit as many columns as you can, each at least 258px wide, sharing space
equally." That's a fully responsive card grid with no media queries at all. It
reflows from four columns to two to one entirely on its own.

### Responsive design and media queries

`clamp()` and `auto-fit` handle most of it, but some changes are structural —
a horizontal nav has to *become* a dropdown, not just shrink:

```css
@media (max-width: 820px) {
  .menu-btn { display: flex; }        /* show the hamburger */
  .nav {
    position: fixed;
    top: var(--header-h); left: 0; right: 0;
    flex-direction: column;
    opacity: 0;
    visibility: hidden;
  }
  .nav.is-open { opacity: 1; visibility: visible; }
}
```

The convention this file follows is **mobile-last**: write the desktop layout as
the default, then override at `max-width` breakpoints. (Many teams do the
reverse — "mobile-first" with `min-width` — and that's arguably the better
default. Either is fine; consistency is what matters.)

### Two more things worth noticing

**The `.container` class** appears in every section:

```css
.container {
  width: 100%;
  max-width: var(--container);   /* 1140px */
  margin-left: auto;
  margin-right: auto;            /* auto margins = horizontal centring */
  padding-left: var(--gutter);
  padding-right: var(--gutter);
}
```

One class, applied consistently, is what makes every section line up down the
page. Inconsistent alignment is the fastest way to make a site look amateur.

**Respecting user preferences:**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    transition-duration: .001ms !important;
  }
  .reveal { opacity: 1; transform: none; }
}
```

Some people get motion sickness from animation, and set an OS-level preference
to say so. Honouring it is three lines. Ignoring it can make your site literally
unusable for them.

---

## 5. The JavaScript

415 lines, no libraries. Organised as small named functions, each doing one
thing, all started from a single boot block at the bottom.

### Finding and changing elements

```js
const $  = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
```

Two shorthands. `querySelector` takes the same selector syntax as CSS and
returns the first match; `querySelectorAll` returns all of them. The `$` names
are a convention inherited from jQuery, the library that made this pattern
ubiquitous.

Once you have an element you manipulate it through the DOM API:

```js
element.classList.add('is-visible');
element.classList.toggle('is-open', shouldBeOpen);
element.setAttribute('aria-expanded', 'true');
element.textContent = 'Copied to clipboard';
```

Note `classList.toggle(name, force)` — passing a boolean second argument sets
the class to match that boolean. It replaces a lot of if/else.

**One safety rule.** `textContent` sets *text*; `innerHTML` parses its argument
as HTML. If you ever put text you didn't write into `innerHTML` — a URL
parameter, an API response, user input — you have created a cross-site scripting
hole. Use `textContent` unless you have a specific reason not to, and if you do,
escape first.

### Events

```js
button.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  storage.set('theme', next);
});
```

`addEventListener(type, handler)` is the whole event model — the same idea as
subscribing to a C# event, with the same "who unsubscribes?" caveat if you're
adding and removing elements dynamically.

The starter-question chips use a technique worth learning, **event delegation**:

```js
el.starters.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-question]');
  if (button) send(button.dataset.question);
});
```

Rather than attaching a listener to each of five buttons, attach *one* to their
container. Events bubble up the DOM tree, so the container sees clicks on its
children; `closest()` walks back up from whatever was actually clicked to find
the button. This keeps working when buttons are added or removed later.

### IntersectionObserver: the scroll reveal

The fade-in-on-scroll effect. The naive implementation listens to the `scroll`
event and calls `getBoundingClientRect()` on every element on every scroll tick,
which is a well-known way to make a page stutter.

`IntersectionObserver` is the browser telling *you* when something enters the
viewport, asynchronously and off the main thread:

```js
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
```

Three details worth copying:

- **The feature check.** `'IntersectionObserver' in window` — if the browser
  doesn't have it, show everything immediately rather than showing nothing.
- **`obs.unobserve(entry.target)`** — once an element has appeared, stop
  watching it. Without this the observer keeps firing forever.
- **The reduced-motion branch** comes *first*, so nobody who asked for less
  motion has to wait for a fade.

The CSS half is two rules:

```css
.reveal {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity .7s cubic-bezier(.2,.7,.3,1), transform .7s cubic-bezier(.2,.7,.3,1);
}
.reveal.is-visible { opacity: 1; transform: none; }
```

JavaScript's entire job is adding one class. CSS does the animation. That split —
**JS changes state, CSS renders state** — is the cleanest pattern in frontend
work, and it's used everywhere in this codebase.

`opacity` and `transform` are chosen deliberately: they're the two properties a
browser can animate on the GPU without recalculating layout. Animating `width`,
`height`, `top` or `margin` forces a re-layout on every frame and is how
animations end up janky.

### The boot block

```js
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
```

Every feature is isolated. If `initCounters` throws on some browser, the theme
toggle and the menu still work. The first version of this file called the
functions in sequence, and a single unsupported API in the *first* function took
down all eight — which is exactly the bug described in §6.

---

## 6. Seven bugs, and what each one teaches

This is the most useful section. Every one of these was found by testing the
real thing in a real browser, not by reading the code — which is the actual
lesson.

### 1. The invisible button

**Symptom.** In dark mode, "Copy address" was white text on a near-white pill.

**Cause.** The other pill buttons on the page are `<a>` links. This one is a
real `<button>`. My `.btn-ghost` rule set a border and a text colour but never
a background — so the button kept the browser's built-in `buttonface` grey,
`#efefef`. In light mode that looked like a slightly grey pill and nobody
noticed. In dark mode it was white-on-white.

**Fix**, applied globally rather than to that one button:

```css
button {
  font: inherit;
  color: inherit;
  background: transparent;
  -webkit-appearance: none;
  appearance: none;
}
```

**Lesson.** Browsers apply their own default stylesheet before yours. `<button>`,
`<input>`, `<select>` and `<textarea>` carry the most defaults and are the
usual suspects. When something looks wrong for no reason, open DevTools,
inspect the element, and read the *Computed* styles panel — it shows the final
resolved value and which rule won.

### 2. Horizontal overflow on phones

**Symptom.** At 390px wide, the hero text ran off the right edge and the whole
page scrolled sideways.

**Cause.** Subtle, and a genuine CSS gotcha. The stats block had
`white-space: nowrap` on its labels, making its *minimum content width* wider
than the phone screen. The hero was a Grid with `grid-template-columns: 1fr`,
and — this is the non-obvious part — **`1fr` really means `minmax(auto, 1fr)`**.
That `auto` minimum means a grid column refuses to shrink below its content's
minimum width. So the column grew to fit the stats, and dragged the headline out
with it.

**Fix:**

```css
@media (max-width: 960px) {
  /* minmax(0, 1fr) — not plain 1fr — so a wide child can never stretch the
     column past the viewport and cause horizontal overflow. */
  .hero-inner { grid-template-columns: minmax(0, 1fr); align-items: start; }
}
```

**Lesson.** `minmax(0, 1fr)` instead of `1fr` is one of the highest-value habits
in CSS Grid. Also worth adding to your toolkit — paste this in the console to
find what's overflowing:

```js
document.querySelectorAll('*').forEach(el => {
  if (el.getBoundingClientRect().right > window.innerWidth + 1) console.log(el);
});
```

### 3. One old browser blanked the entire page

**Symptom.** On Safari 13 and older iOS, the page rendered essentially empty.

**Cause.** This line:

```js
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handler);
```

Safari 13 only has the older `addListener()`. So `addEventListener` was
`undefined`, calling it threw, and because all the init functions ran in
sequence, everything after it never ran — including the scroll reveal. But
`no-js` had already been removed, disarming the CSS safety net. Result: every
`.reveal` element stuck at `opacity: 0`. A blank page.

**Fix**, in two parts:

```js
const mq = window.matchMedia('(prefers-color-scheme: dark)');
if (mq.addEventListener) mq.addEventListener('change', onSystemChange);
else if (mq.addListener) mq.addListener(onSystemChange);
```

...plus wrapping every init in its own `try/catch`, so no single failure can
cascade.

**Lesson.** Two, actually. **Feature-detect** (`if (thing)`) rather than assume.
And when your design hides content by default and reveals it with JavaScript,
a JS failure means *nothing is visible*. That's a fragile default — see §9.

### 4. Text that fails contrast

**Symptom.** None visible. It looked fine to me.

**Cause.** `--text-soft` was `#767d84`. Against the darkest background that's a
contrast ratio of **3.86:1**. The WCAG AA standard for normal text is **4.5:1**.
It was used for all the small uppercase labels — exactly the text that's hardest
to read already.

**Fix.** Darkened to `#62696f`, measured at 4.76:1.

**Lesson.** Accessibility problems are usually invisible to the person who built
the thing. You cannot eyeball contrast; you have to compute it. Chrome DevTools
shows the ratio in its colour picker, and the maths is short enough to script.

### 5. A menu you couldn't read through

**Symptom.** The mobile menu was semi-transparent, and the hero headline showed
through the links.

**Cause.** I styled the drop-down panel with the same translucent
`backdrop-filter: blur()` treatment as the sticky header bar. That works for a
68px-tall bar; over a full panel of text it's illegible. Worse, `backdrop-filter`
silently doesn't apply in some contexts, leaving plain transparency.

**Fix.** Made the open drawer fully opaque.

**Lesson.** Effects that work at one scale often fail at another. And any effect
with patchy support needs to look acceptable when it doesn't apply.

### 6. Focus that went nowhere

**Symptom.** Opening the mobile menu with the keyboard left focus on the
hamburger button. Tab jumped past all five links into the page behind.

**Cause.** Two layers. The links come *before* the button in the DOM, so
"next" skipped them. And the fix — focusing the first link on open — silently
failed, because the panel's `visibility` was still `hidden` at that instant and
hidden elements cannot receive focus. The transition included `visibility .28s`,
which delayed the change.

**Fix:**

```css
.nav {
  visibility: hidden;
  transition: opacity .28s ease, transform .28s ease, visibility 0s linear .28s;
}
.nav.is-open {
  visibility: visible;
  transition: opacity .28s ease, transform .28s ease, visibility 0s linear 0s;
}
```

Visibility now flips instantly on open, and is delayed only on close so the
fade-out is still visible. Then:

```js
if (first) requestAnimationFrame(() => first.focus({ preventScroll: true }));
```

**Lesson.** Test with the keyboard. Tab through your own site — if you can't
reach something, or you lose track of where you are, that's a bug for a
meaningful number of users. `requestAnimationFrame` schedules work for just
before the next repaint, which is the tool for "do this after the browser has
caught up with my DOM changes".

### 7. The bug that never shipped

While building the Digital Twin, the request to OpenRouter failed with:

> `Cannot convert argument to a ByteString because the character at index 17 has a value of 8212`

Character 8212 is an em dash. It was in an HTTP header I'd written as
`'Linnaire Galleno — Digital Twin'`. **HTTP header values must be Latin-1**, and
`fetch` throws rather than sending. Changed to a plain hyphen and it worked.

**Lesson.** I would never have found this by reading the code — it looks
completely fine. It only surfaced by *running* it. Everything in this list is an
argument for the same thing: build it, then actually exercise it in a browser.

---

## 7. Git and deployment

### The commits

The work is split into commits that each do one coherent thing:

```
Add .gitignore
Rebuild the site with a new design and folder structure
Update résumé to the current version
Rewrite README for the new site
```

The guiding rule: **every commit should leave the repository in a working
state**. It's tempting to commit "delete old site" and then "add new site"
separately, but that leaves a point in history where the site is broken. So the
site swap is one atomic commit, while genuinely independent changes (the
`.gitignore`, the résumé) are their own.

Commit messages here use a short imperative subject line, a blank line, then a
body explaining *why*. The diff already shows what changed; the message should
explain what the diff can't.

### `.gitignore`

```
.env
node_modules/
.DS_Store
*.log
```

`.env` matters most. Once a secret is committed, it's in the history forever —
removing it in a later commit does not remove it from previous ones. Anyone who
clones the repo gets the key.

### GitHub Pages

`linnaire.github.io` is a **user site**: GitHub serves the repository's `master`
branch as a static website at that domain. Push, wait a minute, it's live. No
server, no deployment pipeline, no cost.

The critical constraint: **it serves files, it cannot run code**. No .NET, no
Node, no PHP, no database. Which leads directly to the next section.

---

## 8. The Digital Twin, and the one lesson worth keeping

We built an AI chat assistant that answered questions about your career, then
reverted it. The code is parked on a local branch called `digital-twin` — `git
checkout digital-twin` brings it back.

It's worth understanding *why* it couldn't be simple, because the constraint is
fundamental and you'll meet it again.

**The obvious approach:**

```js
// NEVER DO THIS
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: { 'Authorization': 'Bearer sk-or-v1-abc123...' }
});
```

This works perfectly on your machine, and leaks your API key to the entire
internet the moment you deploy. Every visitor downloads `chat.js`. Anyone can
press F12 and read it. Bots scan public repositories for exactly this pattern.

**There is no way around it.** Not obfuscation, not base64, not splitting the
key into pieces. If the browser can reconstruct the key, so can anyone reading
the code. Any secret that reaches a browser is public.

The real solution is a **backend proxy**: a small server that holds the key, and
that the browser talks to instead.

```
Browser  ──POST /api/chat──▶  Your server  ──with the key──▶  OpenRouter
   ▲                          (key lives here,                    │
   └──────── reply ───────────  never sent to the browser) ◀───────┘
```

Since GitHub Pages can't run a server, that proxy has to live elsewhere — the
implementation on the branch uses a Cloudflare Worker, a small function that
runs on request and stores the key as an encrypted secret.

This is also the answer to a question you asked: **moving to Next.js or React
would not change any of this.** A static export can't run API routes either.
The constraint isn't the framework, it's the hosting.

Other things worth borrowing from that branch if you revisit it:

- **Trust nothing from the browser.** The system prompt was added server-side,
  and `system`-role messages from the client were rejected — otherwise a visitor
  could rewrite the assistant's instructions in DevTools.
- **Rate limiting.** Without it, one script can drain your API quota overnight.
- **Escape all model output** before rendering. An AI can be induced to emit
  `<img src=x onerror="...">`, and `innerHTML` would happily execute it.

---

## 9. Five things I would improve

An honest self-review of what I'd change, given more time.

### 1. Content is welded into the markup

To add a job you edit `index.html`. To add a skill you edit `index.html`. The
work cards already do it better — they render from a data array in `script.js`:

```js
const PROJECTS = [
  { title: '...', summary: '...', tags: ['...'] }
];
```

That pattern should extend to everything. A single `content.js` holding the
timeline, skills, certifications and links would mean editing structured data
instead of hunting through 443 lines of HTML for the right `<li>`. It would also
make a future move to any framework nearly mechanical, because the content would
already be separated from the presentation.

**Why I didn't:** rendering everything from JS means a visitor with JavaScript
disabled sees an empty page, and search engines index less reliably. Doing it
properly needs a build step that pre-renders the HTML — which reintroduces the
toolchain the project deliberately avoids. It's a real trade-off, not an
oversight, but at the current size the balance has shifted toward data.

### 2. The tests aren't in the repository

I tested this heavily — 38 browser assertions, contrast calculations, overflow
checks at five widths, keyboard navigation, a no-JavaScript pass. All of it ran
in my sandbox and **none of it was committed**. So the next change you make has
no safety net, and the overflow bug from §6 could silently come back.

The fix is a `tests/` folder with a Playwright script and a GitHub Actions
workflow to run it on every push. Perhaps 150 lines, and it would have caught
four of the seven bugs above automatically.

This is the gap I'd close first.

### 3. Content is invisible by default

```css
.reveal { opacity: 0; }
```

Fourteen elements start invisible and depend on JavaScript to appear. The
`no-js` class and the per-function `try/catch` guard against the obvious
failures, but the underlying design is still "hide first, hope JS works."

A sturdier approach is CSS-only scroll animation, where the browser handles it
and no script is involved:

```css
@supports (animation-timeline: view()) {
  .reveal {
    animation: fade-in linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 30%;
  }
}
```

The catch: scroll-driven animations are **Limited availability** — Chrome and
Edge since 115, Safari since 26, but Firefox hasn't shipped it. So it'd have to
be layered as a progressive enhancement behind `@supports`, with the current JS
as the fallback. More code, but it fails safe.

### 4. Fonts come from a third party

```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces..." rel="stylesheet" />
```

Three costs to this: it's a render-blocking request to a server you don't
control, every visitor's IP address is disclosed to Google (which has caused
GDPR problems for European sites), and the site's typography changes when
offline.

Self-hosting two `.woff2` files in `resources/fonts/` removes all three and is
usually *faster*, since it saves a DNS lookup and TLS handshake to another
origin. I couldn't do it here — this sandbox blocks both Google Fonts and the
npm registry, so I had no way to obtain the font files.

### 5. The stylesheet has no cascade strategy

1,077 lines in one file, with class names that are loosely BEM-ish
(`.timeline-item`, `.twin-msg-user`) but not consistently so. It works today
because I wrote it in one pass and kept specificity deliberately flat. It won't
survive six months of edits by different people.

Two things would help. Adopt a naming convention properly — BEM
(`.block__element--modifier`) is unfashionable but unambiguous. And use CSS
layers to make the cascade explicit rather than positional:

```css
@layer reset, tokens, layout, components, utilities;
```

Rules in a later layer beat earlier ones *regardless of specificity*, which
eliminates the specificity arms race that turns stylesheets into
`!important` graveyards. Splitting into several files imported by a small
`styles.css` would also make things findable.

---

## 10. Glossary

| Term | Meaning |
|---|---|
| **DOM** | Document Object Model — the browser's in-memory object tree representing the page. What JavaScript manipulates. |
| **Element / node** | One item in that tree; usually corresponds to one HTML tag. |
| **Selector** | A pattern that matches elements, e.g. `.card > h3`. Shared by CSS and `querySelector`. |
| **Specificity** | How CSS decides which rule wins when several apply. ID > class > element. |
| **Cascade** | The full set of rules for resolving conflicts: origin, layer, specificity, then source order. |
| **Custom property** | A CSS variable, `--name: value`, read with `var(--name)`. Inherits, and is live at render time. |
| **Viewport** | The visible area of the page in the browser window. |
| **Breakpoint** | A width at which the layout changes, via `@media`. |
| **Flexbox** | One-dimensional layout system. Rows or columns. |
| **Grid** | Two-dimensional layout system. Rows and columns together. |
| **Progressive enhancement** | Build a version that works everywhere, then layer improvements that degrade gracefully. |
| **Semantic HTML** | Using tags for their meaning (`<nav>`, `<article>`) rather than generic `<div>`s. |
| **WCAG** | Web Content Accessibility Guidelines. AA is the level most organisations target. |
| **Contrast ratio** | Numeric measure of text legibility against its background. 4.5:1 minimum for normal text at AA. |
| **ARIA** | Attributes that describe UI semantics to assistive technology when HTML alone can't. |
| **XSS** | Cross-site scripting — injecting executable code into a page, usually via unescaped content in `innerHTML`. |
| **Static site** | A site of pre-built files with no server-side code. What GitHub Pages serves. |
| **Transpile / build step** | Converting source (JSX, TypeScript, SCSS) into what browsers understand. This project has none. |

---

## Where to go next

Three suggestions, in order:

1. **Change something small and watch what happens.** Open `styles.css`, change
   `--accent` to a different colour, save, refresh. Seeing one variable re-tint
   the whole site is the fastest way to internalise design tokens.
2. **Live in DevTools.** F12, Elements panel. Click an element, edit its CSS in
   the right-hand pane, watch it change instantly. Nothing you read teaches CSS
   as fast as breaking it interactively.
3. **Read [MDN](https://developer.mozilla.org/), not tutorials.** Mozilla's
   documentation is the reference the browser vendors themselves use, and it's
   the rare case where the official docs are also the best explanation.

The single most transferable idea in this codebase: **JavaScript changes state,
CSS renders state**. A theme toggle that sets one attribute. A scroll reveal
that adds one class. Keep that split and frontend code stays comprehensible.
