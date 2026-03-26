# Portfolio Redesign: Breaking Grid + Collision Header

## Direction

Single-page dense portfolio. Content flows continuously without full-viewport section breaks or scroll-snapping. Hero header uses a large monospace gradient name (from mockup A). Body uses a bento project grid, work cards, and tech rows (from mockup C) with a ghost watermark behind the hero. Playful and experimental, not corporate.

## Hero

- **Name** (`.hero-name`): `ALAN BAGEL` in JetBrains Mono, single line, `clamp(2.8rem, 7vw, 72px)` on desktop. Green-to-lime gradient fill (`linear-gradient(135deg, #4ade80, #a3e635)`). Largest text on the page.
- **Ghost watermark**: CSS `::before` pseudo-element on the hero container (`.hero`). Same text via `content: 'ALAN BAGEL'`, ~110px, `color: hsl(25 4% 7%)` (barely visible against background). `position: absolute`, scrolls with the hero (not fixed). Uses JetBrains Mono at `font-weight: 800`. Does not participate in the GoL fade.
- **Tagline** (`.hero-tagline`): "I write code that runs fast and breaks less." in JetBrains Mono, `var(--muted)` color.
- **Bio** (`.hero-bio`): 2 sentences, `var(--font-body)`, dimmer than muted. `max-width: 520px`.
- **Contact** (`.hero-contact-row`): Single inline `<div>` with flexbox wrap. Four links with terminal-symbol prefixes: `@ email`, `> github`, `# itch`, `~ blog`. JetBrains Mono, 10px, `var(--muted)` with green symbols. Each item is an `<a>` tag wrapping symbol + text. Accessible labels via `aria-label` on each link (e.g., `aria-label="Email"`). Wraps naturally on small screens.
- **GoL canvas**: Runs behind the hero area. Opacity multiplier increased from `0.18` to `0.28`. Fade-on-scroll behavior preserved.
- **No dockbar navigation**. The bottom dock and all nav JS (scroll observer, setCurrentButton, switchWindow) are removed. Accessibility: add `id` attributes to each section so users can deep-link. No skip-links needed since the page is short.
- **Lucide icon library**: Removed entirely. No more CDN call to unpkg.com/lucide. Contact uses plain text symbols instead.
- **Lenis smooth scroll**: Kept. The page still scrolls on laptops/tablets and the smooth scroll improves the feel.

## Projects

Section label: "Projects" in green mono uppercase, small. No h1 or description paragraph.

Bento grid: `display: grid; grid-template-columns: 1.3fr 1fr; gap: 12px`. Left column: featured card spanning 2 rows (`grid-row: span 2`). Right column: two compact cards, one per row. Rows are auto-height.

**Featured project (Microcosm)**: Always expanded. Shows:
- Number label (`01 / Featured` in green mono)
- Title (20px, white, Sora)
- View link button (mono, border, `View ->`)
- Full description paragraph
- Tags (green-tinted, 3px radius, mono)
- Screenshot slot: `aspect-ratio: 16/7`, placeholder grid pattern preserved until real images are added. Accepts `<img>` if image exists.
- Highlight bullets using `*` as `::before` content in green

**Secondary projects (ACSL Academy, Legend of Rick)**: Compact by default. Show:
- Number label (`02`, `03` in dim mono)
- Title (14px, light gray, Sora)
- View/Soon link
- Tags
- Screenshot slot (smaller, `aspect-ratio: 16/9`)

**Expand/collapse**: JS-applied. On page load, all content is in the DOM (server-rendered, visible without JS). JS adds `.collapsed` class to secondary cards, hiding description and highlights via `max-height: 0; overflow: hidden`. A "Read more" button is injected by JS (not in the HTML, so no-JS users see everything). Clicking toggles:
- `.collapsed` class removed/added
- Button text toggles between "Read more" and "Show less"
- `aria-expanded` attribute toggled on the button
- Animation: CSS transition on `max-height` (0 to scrollHeight) with `ease-out` over 0.3s. No GSAP needed.

**Mobile (<1100px)**: Grid becomes single column. Featured card loses `grid-row: span 2`. All 3 projects are equal cards, all collapsed by default with "Read more".

## Work

Section label: "Work" in green mono uppercase, small.

`.work-card` elements in `display: grid; grid-template-columns: 1fr 1fr; gap: 12px`.

Each card shows:
- Status label (`Current`, uppercase, mono, dim)
- Company name (16px, white, Sora)
- Role title (green, mono, e.g., "Frontend Lead")
- Description paragraph (muted)
- Tech stack (mono, dim, e.g., "Electron / EJS / Express.js")
- Highlight bullets using `-` as `::before` content in green

Cards: `background: var(--surface-2)`, `border: 1px solid var(--outline-variant)`, `border-radius: 6px`. Hover: `border-color: var(--outline)`.

**Mobile (<768px)**: Stack to single column.

## Tech

Section label: "Stack" in green mono uppercase, small.

5 rows, each: `grid-template-columns: 100px 1fr; gap: 16px`. Green labels in mono (Web, Backend, Languages, Game, Tooling). Items in Manrope, `var(--muted)`. Rows separated by `1px solid var(--outline-variant)`. Hover: `background: hsl(127 10% 12% / 0.25)`.

**Mobile (<768px)**: Rows stack to single column (label above items).

## GSAP Animations

The existing `initializeRevealAnimations()` system is **rewritten** to match the new DOM structure. The approach stays the same (ScrollTrigger-based, staggered, respects reduced motion, skips elements already in view) but selectors update:

- Group 1 (text): `.hero-name, .hero-tagline, .hero-bio, .hero-contact-row`
- Group 2 (cards): `.project-card, .work-card`
- Group 3 (tech rows): `.tech-row`
- Group 4 (highlights): `.project-highlights li, .work-highlights li`

The reveal plan structure (prepare + to) and ScrollTrigger configuration stay the same. The hero background transition (GoL fade on scroll) stays the same.

## Visual Layer

All existing effects carry over unchanged:
- Warm color palette (`hsl(25 X% Y%)` neutrals, cream-white text)
- Film grain SVG overlay (3.5% opacity, soft-light)
- `::selection` green styling
- Mouse-follow spotlight on project cards (CSS custom properties + JS mousemove)
- `@property --glow` animated box-shadow on project card hover
- Hero warm radial glow
- Font features (ligatures, tabular nums)

## Footer

`// (c) 2026 alan bagel. keep calm and eat bagels.` in JetBrains Mono, dim, centered.

## Blog

No changes. Separate page with existing breadcrumb nav, footer, warm palette, and grain.

## Typography

- Display/headings: Sora
- Body: Manrope
- Mono (labels, code, contact, tags, footer): JetBrains Mono
- Hero name + ghost watermark: JetBrains Mono at display size

## Responsive

- **Desktop (1100px+)**: Bento grid (1.3fr + 1fr), 2-column work, hero name at ~72px
- **Tablet (768-1100px)**: Projects collapse to single column (all equal, all collapsed). Work stays 2-column. Tech rows stay 2-column.
- **Mobile (<768px)**: Single column everything. Hero name scales via clamp. Contact row wraps naturally. Work stacks. Tech rows stack (label above items).

## Files Changed

- `css/site.css` - Full rewrite: remove dockbar/nav styles, add bento grid, work cards, ghost watermark, updated hero, responsive
- `views/portfolio/index.ejs` - Remove dockbar nav element, remove Lucide/devicon noscript, remove nav JS references
- `views/portfolio/partials/home.ejs` - Monospace gradient name, inline contact with terminal symbols, remove contact panel
- `views/portfolio/partials/projects.ejs` - Bento grid with featured/compact cards, image slots on all 3, expandable content areas
- `views/portfolio/partials/work.ejs` - Card layout with status, role, description, tech, highlights
- `views/portfolio/partials/technologies.ejs` - Change section label to "Stack", column width from 120px to 100px
- `js/index.js` - Remove dockbar/nav/Lucide logic, add expand/collapse for project cards, rewrite reveal animation selectors, keep spotlight/GoL/Lenis/grain
