# Linnaire Galleno — portfolio site

A single-page personal site built with plain HTML, CSS and JavaScript. No
frameworks, no build step, no dependencies to install.

```
portfolio/
├── index.html                     all the content and page structure
├── styles.css                     all the styling
├── script.js                      all the behaviour (theme, menu, animations)
├── Linnaire Galleno - Resume.pdf  linked from the About and Contact sections
├── .env                           API key — never commit this
└── .gitignore
```

---

## Running it locally

**Option 1 — just open it.** Double-click `index.html`. It works straight from
the file system.

**Option 2 — run a tiny local server** (recommended; a couple of browser
features behave better over `http://` than `file://`):

```bash
# Python 3 — already installed on most machines
python -m http.server 8000

# or, if you have Node
npx serve
```

Then open <http://localhost:8000>.

---

## Editing the content

### Text, jobs, skills, certifications → `index.html`

Everything visible is in `index.html`, in clearly commented sections that match
the order on the page: `HERO`, `ABOUT`, `CAREER JOURNEY`, `EXPERTISE`, `WORK`,
`CONTACT`. Search for the words you want to change and change them.

To add a job, copy one `<li class="timeline-item">` block and edit it. The
first one in the list automatically gets the filled dot and the "Current" badge.

### Adding portfolio projects → `script.js`

Open `script.js` and find the `PROJECTS` array at the very top. Add an object
and the card appears on the site — you never touch the HTML:

```js
const PROJECTS = [
  {
    title: 'Acumatica ↔ ConnectWise integration',
    summary: 'Two-way sync of tickets and billing records, built on the Acumatica Framework.',
    tags: ['Acumatica', 'REST API', 'C#'],
    url: 'https://example.com/case-study',   // optional
    linkText: 'Read the case study'          // optional
  }
];
```

`title` and `summary` are required; the rest are optional. While the array is
empty, the three "In progress" placeholder cards in `index.html` stay on the
page — edit or delete those directly.

### Colours, fonts, spacing → `styles.css`

The top of `styles.css` is a block of CSS variables (`:root` for light mode,
`[data-theme='dark']` for dark mode). Change `--accent` and the whole site
re-tints. You rarely need to scroll further down than that.

---

## Before you publish it

A few things are placeholders on purpose:

1. **Social links** — the Upwork card points at your real profile. To add
   LinkedIn or GitHub, copy an existing `contact-card` block and swap the href.
2. **Phone number** — deliberately left off the site. Your résumé PDF has it,
   and the PDF is downloadable, so anyone who needs it can get it. Add it back
   as another `contact-card` if you'd rather have it visible.
3. **Social preview** — the `og:` meta tags in `<head>` have no URL or image
   yet. Add `og:url` and `og:image` once the site has a real address.
4. **`.env`** — `.gitignore` already excludes it, so it won't reach GitHub.
   The key you pasted into chat should be rotated in OpenRouter regardless.

---

## Notes on how it's built

- **Fonts** load from Google Fonts (Fraunces for headings, Inter for body). If
  you're offline the site falls back to Georgia and your system sans — it looks
  slightly different but nothing breaks.
- **Dark mode** follows your operating system on first visit, and remembers
  your choice after you click the toggle.
- **No-JavaScript fallback**: if scripts are blocked, everything is still
  visible and the navigation still works — it just isn't animated.
- **Accessibility**: skip link, keyboard-navigable menu, `prefers-reduced-motion`
  support, and text colours that meet WCAG AA contrast in both themes.
- **Print**: printing the page gives a clean, ink-friendly layout.

Tested at 360px, 390px, 768px, 1024px and 1440px wide, in light and dark.
