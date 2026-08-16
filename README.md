# linnaire.github.io

My personal site — [linnaire.github.io](https://linnaire.github.io/)

I'm Linnaire Galleno, an Acumatica Technical Consultant based in Kidapawan City,
Philippines. The site covers what I do, how I got here, and how to reach me.

Built with plain HTML, CSS and JavaScript. No framework, no build step, no
dependencies.

## Structure

```
index.html                              content and page structure
favicon.svg / favicon.ico               "LG" monogram
resources/
├── css/styles.css                      all styling
├── js/script.js                        all behaviour
└── cv/Linnaire Galleno - Resume.pdf    linked from About and Contact
```

## Running it locally

Clone the repo and open `index.html` — it works straight from the file system.
For a closer match to how it behaves when published, serve it over HTTP:

```bash
python -m http.server 8000   # then open http://localhost:8000
```

## Adding a project

Projects render from the `PROJECTS` array at the top of `resources/js/script.js`.
Add an object and a card appears — no HTML to edit:

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

`title` and `summary` are required. While the array is empty, the placeholder
cards in `index.html` stay on the page.

## Changing the look

The top of `resources/css/styles.css` is a block of CSS variables — `:root` for
light mode, `[data-theme='dark']` for dark. Change `--accent` and the whole site
re-tints.

## Notes

- Dark mode follows your OS on first visit and remembers your choice after that.
- Works with JavaScript disabled — content stays visible, navigation still works.
- Accessible: skip link, keyboard-navigable menu, `prefers-reduced-motion`
  support, WCAG AA contrast in both themes.
- Fonts load from Google Fonts, with Georgia and system-sans fallbacks offline.
