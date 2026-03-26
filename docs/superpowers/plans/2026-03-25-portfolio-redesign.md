# Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the portfolio from stacked scroll sections into a single-page dense layout with a monospace gradient hero, bento project grid, work cards, and compact tech rows.

**Architecture:** Express + EJS server-rendered pages. Vanilla CSS for styling. GSAP + ScrollTrigger for reveal animations. Lenis for smooth scroll. Game of Life canvas behind hero. No build step.

**Tech Stack:** Express, EJS, vanilla CSS, GSAP 3.14, Lenis, SVG feTurbulence grain

**Spec:** `docs/superpowers/specs/2026-03-25-portfolio-redesign.md`

---

### Task 1: Rewrite Hero HTML

**Files:**
- Modify: `views/portfolio/partials/home.ejs`

- [ ] **Step 1: Replace the hero partial with new structure**

Replace the entire contents of `home.ejs` with:

```html
<section class="hero" id="home">
    <canvas id="game-of-life-canvas" class="hero-background" aria-hidden="true"></canvas>
    <div class="hero-content">
        <h1 class="hero-name">ALAN BAGEL</h1>
        <p class="hero-tagline">I write code that runs fast and breaks less.</p>
        <p class="hero-bio">
            East Coast student. I do competitive programming, frontend work, and game dev.
            Most of my time goes toward shaving milliseconds off solutions, squeezing ideas
            into strange esolangs, or watching cellular automata eat themselves. I also play
            chess, play piano, and eat a concerning number of bagels.
        </p>
        <div class="hero-contact-row">
            <a href="mailto:turkeysandwich179@outlook.com" aria-label="Email"><span class="contact-symbol">@</span> turkeysandwich179@outlook.com</a>
            <a href="https://github.com/TheSecondComing123" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><span class="contact-symbol">&gt;</span> github.com/TheSecondComing123</a>
            <a href="https://itch.io/profile/alandabagel" target="_blank" rel="noopener noreferrer" aria-label="Itch.io"><span class="contact-symbol">#</span> itch.io/alandabagel</a>
            <a href="/blog" aria-label="Blog"><span class="contact-symbol">~</span> alanthebagel.com/blog</a>
        </div>
    </div>
</section>
```

- [ ] **Step 2: Verify EJS renders without errors**

Run: `node -e "require('./server.js')" & sleep 2 && curl -s http://localhost:3000 | grep -c 'hero-name' && kill %1`
Expected: `1`

- [ ] **Step 3: Commit**

```
git add views/portfolio/partials/home.ejs
git commit -m "feat: rewrite hero with monospace name and terminal contact row"
```

---

### Task 2: Rewrite Projects HTML

**Files:**
- Modify: `views/portfolio/partials/projects.ejs`

- [ ] **Step 1: Replace the projects partial with bento grid structure**

Replace entire contents with the bento layout. Featured card (Microcosm) uses `.project-card.featured` and `grid-row: span 2`. Secondary cards have `.project-expandable` wrapper around description and highlights (for JS collapse). All 3 cards have `.project-media` image slots.

```html
<section class="projects" id="projects">
    <p class="section-label">Projects</p>
    <div class="project-bento">
        <article class="project-card featured">
            <p class="project-num featured">01 / Featured</p>
            <div class="project-header">
                <h2 class="project-title">Microcosm</h2>
                <a href="https://alandabagel.itch.io/microcosm" class="project-link" target="_blank" rel="noopener noreferrer">View &nearr;</a>
            </div>
            <p class="project-description">
                A 2D roguelike built with Pygame and OpenGL where each run escalates through
                denser enemy waves, tighter resource windows, and sharper decision-making. I
                designed the combat loop around responsive controls, readable telegraphs, and
                clear hit feedback so difficulty feels demanding but fair.
            </p>
            <div class="project-tags">
                <span class="tag">Python</span>
                <span class="tag">Pygame</span>
                <span class="tag">OpenGL</span>
            </div>
            <div class="project-media" aria-hidden="true"></div>
            <ul class="project-highlights">
                <li>Procedural encounters and adaptive enemy AI with scaling based on progression, run duration, and player performance.</li>
                <li>Frame-precise combat systems including invulnerability windows, telegraphed attacks, and tight collision handling.</li>
                <li>Math-heavy optimization work using vectorized movement, aggressive state pruning, and low-overhead collision filtering.</li>
            </ul>
        </article>

        <article class="project-card compact">
            <p class="project-num">02</p>
            <div class="project-header">
                <h2 class="project-title">ACSL Academy</h2>
                <a href="https://acsl-academy.vercel.app" class="project-link" target="_blank" rel="noopener noreferrer">View &nearr;</a>
            </div>
            <div class="project-tags">
                <span class="tag">Next.js</span>
                <span class="tag">Tailwind</span>
                <span class="tag">Supabase</span>
            </div>
            <div class="project-media" aria-hidden="true"></div>
            <div class="project-expandable">
                <p class="project-description">
                    A full-stack ACSL training platform built with Next.js, Tailwind, and Supabase.
                    The platform supports long-term skill growth with guided lessons, contest-style
                    practice, and immediate feedback loops. Progress tracking and assessment workflows
                    let students measure improvement over time.
                </p>
                <ul class="project-highlights">
                    <li>30+ structured lessons across core ACSL programming and CS topics with progressive difficulty pacing.</li>
                    <li>Dedicated practice problem banks and timed contest-style sets for realistic competition prep.</li>
                    <li>Account-based progress tracking, quiz workflows, and data-backed refinement of training content.</li>
                </ul>
            </div>
        </article>

        <article class="project-card compact">
            <p class="project-num">03</p>
            <div class="project-header">
                <h2 class="project-title">The Legend of Rick</h2>
                <span class="project-link muted">Soon</span>
            </div>
            <div class="project-tags">
                <span class="tag">Godot</span>
                <span class="tag">GDScript</span>
            </div>
            <div class="project-media" aria-hidden="true"></div>
            <div class="project-expandable">
                <p class="project-description">
                    A 2D platformer in Godot and GDScript centered on tight movement, readable
                    challenge design, and satisfying level flow. Tuning jump physics, momentum,
                    and recovery timing so controls stay consistent across both precision
                    platforming and combat sections.
                </p>
                <ul class="project-highlights">
                    <li>Tuned jump arcs, momentum, recovery windows, and collision behavior for consistent control feel.</li>
                    <li>Multiple stage archetypes with checkpoint flow, enemy timing systems, and clearer fail-state feedback.</li>
                    <li>Active expansion toward boss encounters and tighter pacing across gameplay and humor beats.</li>
                </ul>
            </div>
        </article>
    </div>
</section>
```

- [ ] **Step 2: Verify render**

Run: `node -e "require('./server.js')" & sleep 2 && curl -s http://localhost:3000 | grep -c 'project-bento' && kill %1`
Expected: `1`

- [ ] **Step 3: Commit**

```
git add views/portfolio/partials/projects.ejs
git commit -m "feat: rewrite projects as bento grid with featured card"
```

---

### Task 3: Rewrite Work HTML

**Files:**
- Modify: `views/portfolio/partials/work.ejs`

- [ ] **Step 1: Replace work partial with card layout**

```html
<section class="work" id="work">
    <p class="section-label">Work</p>
    <div class="work-grid">
        <article class="work-card">
            <p class="work-status">Current</p>
            <h2 class="work-title">Unbound Labs</h2>
            <p class="work-role">Frontend Lead</p>
            <p class="work-description">
                Leading frontend development across Unbound Browser and its connected platform
                ecosystem, with a focus on speed, clarity, and privacy-first UX.
            </p>
            <p class="work-tech">Electron / EJS / Express.js</p>
            <ul class="work-highlights">
                <li>Built and maintained interface systems for Unbound Browser, a lightweight no-tracking browsing experience.</li>
                <li>Shipped product surfaces around a Scramjet proxy stack, 100+ unblocked games, community chat, and a multi-model AI assistant.</li>
                <li>Owned UI architecture and performance optimization across multiple production-facing surfaces.</li>
            </ul>
        </article>

        <article class="work-card">
            <p class="work-status">Current</p>
            <h2 class="work-title">Spirr Team</h2>
            <p class="work-role">Frontend Developer</p>
            <p class="work-description">
                Frontend developer for Sauna, a browser-based platform for online game
                ports and lightweight desktop-style interaction with a tiny-OS feel.
            </p>
            <p class="work-tech">Svelte / TypeScript / Tailwind / Node.js</p>
            <ul class="work-highlights">
                <li>Developed core UI patterns for the game library and mini-OS style navigation/launch experience.</li>
                <li>Supported web ports of recognizable titles such as Super Mario 64 and FNAF with consistent UX flows.</li>
                <li>Drove frontend implementation and interaction polish while the platform expanded in scope.</li>
            </ul>
        </article>
    </div>
</section>
```

- [ ] **Step 2: Commit**

```
git add views/portfolio/partials/work.ejs
git commit -m "feat: rewrite work section as card layout with roles"
```

---

### Task 4: Update Tech HTML and Page Shell

**Files:**
- Modify: `views/portfolio/partials/technologies.ejs`
- Modify: `views/portfolio/index.ejs`

- [ ] **Step 1: Update tech section label to "Stack" and add id**

In `technologies.ejs`, change the section wrapper and title:

```html
<section class="tech" id="stack">
    <p class="section-label">Stack</p>
    <div class="tech-compact">
        <!-- keep existing tech-row structure, just change label column to 100px in CSS -->
        <div class="tech-row">
            <span class="tech-row-label">Web</span>
            <span class="tech-row-items">HTML, CSS, JavaScript, TypeScript, Tailwind, React, Next.js, Svelte</span>
        </div>
        <div class="tech-row">
            <span class="tech-row-label">Backend</span>
            <span class="tech-row-items">Node.js, Express, PostgreSQL, MongoDB, Supabase, Firebase</span>
        </div>
        <div class="tech-row">
            <span class="tech-row-label">Languages</span>
            <span class="tech-row-items">Python, C++, Bash</span>
        </div>
        <div class="tech-row">
            <span class="tech-row-label">Game</span>
            <span class="tech-row-items">Flutter, Godot, Unreal Engine, Unity, OpenGL, Blender, Android</span>
        </div>
        <div class="tech-row">
            <span class="tech-row-label">Tooling</span>
            <span class="tech-row-items">Docker, Git, GitHub, VS Code, Vercel, npm, Figma</span>
        </div>
    </div>
</section>
```

- [ ] **Step 2: Strip page shell of dockbar and Lucide**

In `index.ejs`:
- Remove the entire `<nav class="dockbar">...</nav>` block
- Remove the devicon noscript link (already removed in prior work, verify)
- Keep the SVG grain filter, footer, and script tags
- The `<main>` wraps the 4 includes as before

- [ ] **Step 3: Verify both render**

Run: `node -e "require('./server.js')" & sleep 2 && curl -s http://localhost:3000 | grep -c 'section-label' && kill %1`
Expected: `3` (Projects, Work, Stack)

- [ ] **Step 4: Commit**

```
git add views/portfolio/partials/technologies.ejs views/portfolio/index.ejs
git commit -m "feat: update tech label to Stack, remove dockbar nav"
```

---

### Task 5: Full CSS Rewrite

**Files:**
- Modify: `css/site.css`

This is the largest task. Rewrite the entire stylesheet to match the new layout. Key sections:

- [ ] **Step 1: Write the new CSS**

The CSS must cover:
- Design tokens (warm palette, keep existing)
- `::selection`, film grain overlay (keep existing)
- `.hero` section: ghost watermark `::before`, gradient name, tagline, bio, contact row
- `.hero-background` canvas (increase opacity to 0.28)
- `.hero::after` warm radial glow (keep existing)
- `.section-label` green mono uppercase
- `.project-bento` grid: `1.3fr 1fr`, featured spans 2 rows
- `.project-card` base, `.featured` variant, `.compact` variant
- `.project-expandable` collapse: `max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out` when `.collapsed`
- `.project-num`, `.project-header`, `.project-title`, `.project-description`, `.project-tags`, `.tag`, `.project-media`, `.project-highlights`
- `.project-link` button, `.muted` variant
- Mouse-follow spotlight `::after` on `.project-card` (keep existing approach)
- `@property --glow` card hover glow (keep existing)
- `.work-grid`, `.work-card`, `.work-status`, `.work-title`, `.work-role`, `.work-description`, `.work-tech`, `.work-highlights`
- `.tech-compact`, `.tech-row` (update column to 100px)
- `.site-footer` (keep existing)
- Responsive: 1100px (bento collapses), 768px (work/tech stacks)
- Reduced motion media query (keep existing)
- Remove all dockbar/nav styles (`.dockbar`, `.nav-button`, `.icon`)
- Remove old `.window`, `.home-grid`, `.home-copy`, `.contact-panel`, `.contact-*`, `.work-list`, `.work-entry`, `.work-entry-side`, `.work-entry-main`

- [ ] **Step 2: Verify page loads with new styles**

Run: `node -e "require('./server.js')" & sleep 2 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 && kill %1`
Expected: `200`

- [ ] **Step 3: Commit**

```
git add css/site.css
git commit -m "feat: full CSS rewrite for bento layout and dense single-page design"
```

---

### Task 6: Rewrite JS - Remove Nav, Add Expand/Collapse, Update Animations

**Files:**
- Modify: `js/index.js`

- [ ] **Step 1: Remove nav-related code**

Delete these functions entirely:
- `initializeNavigationIcons()`
- `initializeNavigationHandlers()`
- `switchWindow()`
- `initializeScrollObserver()`
- `setCurrentButton()`

Remove from `init()`:
- `initializeNavigationIcons()` call
- `initializeNavigationHandlers()` call
- `setCurrentButton('home')` call

Remove from `scheduleNonCriticalInitialization()`:
- `initializeScrollObserver()` call

Remove the `SECTION_IDS` constant.

Gut `scheduleDeferredAssets()`: remove Lucide loading (`loadLucideScript`, `lucide.createIcons`, `scheduleDeviconStylesheetWhenNeeded`, `loadDeviconStylesheet`). Keep `scheduleDeferredAssets` as an empty function or remove it and its call.

- [ ] **Step 2: Add expand/collapse for project cards**

Add `initializeProjectExpand()` function. Called from `init()` after `revealPortfolioShell()`.

```javascript
function initializeProjectExpand() {
    const compactCards = document.querySelectorAll('.project-card.compact')
    for (const card of compactCards) {
        const expandable = card.querySelector('.project-expandable')
        if (!expandable) continue

        expandable.classList.add('collapsed')

        const btn = document.createElement('button')
        btn.className = 'project-expand-btn'
        btn.textContent = 'Read more'
        btn.setAttribute('aria-expanded', 'false')

        btn.addEventListener('click', () => {
            const isCollapsed = expandable.classList.contains('collapsed')
            if (isCollapsed) {
                expandable.style.maxHeight = expandable.scrollHeight + 'px'
                expandable.classList.remove('collapsed')
                btn.textContent = 'Show less'
                btn.setAttribute('aria-expanded', 'true')
            } else {
                expandable.style.maxHeight = '0px'
                expandable.classList.add('collapsed')
                btn.textContent = 'Read more'
                btn.setAttribute('aria-expanded', 'false')
            }
        })

        card.appendChild(btn)
    }
}
```

- [ ] **Step 3: Update reveal animation selectors**

In `initializeRevealAnimations()`, update the `revealPlan` array:

- Group 1 selector: `'.hero-name, .hero-tagline, .hero-bio, .hero-contact-row'`
- Group 2 selector: `'.project-card, .work-card'`
- Group 3 selector: `'.tech-row'`
- Group 4 selector: `'.project-highlights li, .work-highlights li'`

- [ ] **Step 4: Update card spotlight selector**

In `initializeCardSpotlight()`, the selector is already `.project-card` which still works.

- [ ] **Step 5: Verify JS loads without errors**

Run: `node -e "require('./server.js')" & sleep 2 && curl -s http://localhost:3000 | grep -c 'project-expand' && kill %1`
Expected: `0` (expand buttons are injected by JS, not in HTML)

- [ ] **Step 6: Commit**

```
git add js/index.js
git commit -m "feat: remove nav, add project expand/collapse, update animation selectors"
```

---

### Task 7: Verify and Fix

- [ ] **Step 1: Start server and check both pages**

```
node -e "require('./server.js')" & sleep 2
curl -s -o /dev/null -w "portfolio: %{http_code}\n" http://localhost:3000
curl -s -o /dev/null -w "blog: %{http_code}\n" http://localhost:3000/blog
kill %1
```

Expected: Both `200`

- [ ] **Step 2: Verify no broken references**

Grep for old class names that should no longer appear in HTML/CSS/JS:
- `dockbar`, `nav-button`, `contact-panel`, `contact-item`, `contact-list`, `contact-title`, `home-grid`, `home-copy`, `window-container`, `work-entry`, `work-list`, `hero-kicker`

Any hits in `site.css`, `index.js`, or `views/portfolio/` templates indicate incomplete cleanup.

- [ ] **Step 3: Fix any issues found**

- [ ] **Step 4: Final commit**

```
git add -A
git commit -m "fix: clean up stale references from redesign"
```
