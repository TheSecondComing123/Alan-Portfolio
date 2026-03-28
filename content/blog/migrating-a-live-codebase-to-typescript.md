---
title: Migrating a Live Codebase to TypeScript
date: 2026-03-28
readTime: 7 min read
excerpt: 'How I converted Sauna from vanilla JS to Svelte components and then to TypeScript without breaking a running product.'
tags:
    - TypeScript
    - Svelte
    - Refactoring
---

## Context

Sauna is a web-based game library client. Users browse, claim, and play PC-native games directly in the browser. It was built fast by a small team and shipped as vanilla JavaScript: imperative DOM manipulation, global state, no type safety, no linting.

It worked. But adding features was getting painful. Every change to the game data model risked breaking something downstream because there was no way to trace how data flowed through the app. The window manager (the code that spawns, drags, resizes, and manages game windows) was a single 300-line file that did everything.

I did the migration in two phases: vanilla JS to Svelte components, then JavaScript to TypeScript. Both while the product was live.

## Phase 1: Svelte migration

The original app rendered everything imperatively. There was a `render.js` that built HTML strings and injected them into the DOM. A `state.js` held global variables. A `library.js` fetched data and called render functions. A `modal.js` managed a single modal. A `views.js` handled tab switching. Six files, all tightly coupled through globals.

I replaced all of it with a Svelte app in one commit. The approach:

1. **Create a centralized store.** `store.svelte.js` using Svelte 5's `$state` rune replaced all the scattered state variables. Library data, current tab, search query, view mode, modal state, all in one reactive object.

2. **Componentize the UI.** Six components replaced six imperative modules:
   - `Sidebar.svelte` (tab navigation)
   - `Header.svelte` (search, view toggle)
   - `GameGrid.svelte` (card layout with filtering)
   - `GameCard.svelte` (individual game tile)
   - `ListRow.svelte` (list view variant)
   - `Modal.svelte` (game detail overlay)

3. **Keep the landing page vanilla.** The landing page (hero animation, steam effects, window manager) stayed as vanilla TypeScript. It communicates with the Svelte app via `postMessage` across an iframe boundary. Migrating the landing page to Svelte would have meant fighting Svelte's DOM ownership in a context where I needed pixel-level control over window positioning.

4. **Delete the old modules.** `game-actions.js`, `library.js`, `modal.js`, `render.js`, `state.js`, `views.js`, all deleted. The `main.js` went from 53 lines of imperative setup to 5 lines mounting the Svelte app.

The result: fewer files, reactive updates instead of manual DOM patching, and components that could be reasoned about in isolation.

## Phase 2: TypeScript migration

A week later, I converted the entire codebase to TypeScript. This was the more interesting migration because the decisions matter more than the mechanics.

### What I typed first

The game data model. This was the highest-value target because `Game` objects flow through every layer: API response, store state, component props, event handlers, window manager, and game launcher.

```typescript
export interface Game {
  id: string | number;
  title: string;
  img: string;
  link?: string;
  _index?: number;
}

interface StoreState {
  library: Game[];
  allGames: Game[];
  currentTab: 'home' | 'discover';
  viewmode: 'list' | 'grid';
  searchQuery: string;
  modalOpen: boolean;
}
```

With this in place, every component that receives a `Game` prop gets autocomplete and type errors if the shape changes. The `currentTab` union type (`'home' | 'discover'`) replaced a string comparison that had a typo bug in the original code.

### What I didn't type

The window manager's internal state. It uses absolute pixel positions, z-index stacks, and animation frame callbacks. Typing all of this would have been a large surface area for minimal benefit, since the window manager is a self-contained module that doesn't share its internal types with anything else.

I typed its public API (the functions other modules call) but left the internals as `any` in a few places. Pragmatic over pure.

### The linting setup

I added ESLint and Prettier in the same commit as the TypeScript migration. This is intentional: if you add linting first, you get a massive diff of formatting changes mixed with your actual migration. If you add it after, you have to re-review everything. Adding both together means one diff that includes types, formatting, and lint fixes, and from that point forward, the codebase has guardrails.

### What broke

Two things:

1. **Svelte component props.** Svelte 5 uses `$props()` for component inputs. The types for these need to match what the parent passes. In several places, the parent was passing `game.id` (which could be `string | number`) to a handler that expected `string`. TypeScript caught all of these. In vanilla JS, they worked by accident because JavaScript's loose equality was papering over the type mismatch.

2. **postMessage payloads.** The landing page sends messages to the Svelte app iframe. These messages had no defined shape. I added a discriminated union for message types:
   ```typescript
   type AppMessage =
     | { type: 'launch'; gameId: string }
     | { type: 'theme'; mode: 'light' | 'dark' }
     | { type: 'playtime'; gameId: string; ms: number }
   ```
   This immediately surfaced a bug where one message sender was using `'start'` as the type but the receiver was checking for `'launch'`.

### The numbers

- 38 files changed
- 1,384 insertions, 1,013 deletions
- Every `.js` file in `src/` renamed to `.ts`
- Every `.svelte` file got typed `$props()` and typed event handlers
- Zero runtime behavior changes

## What I'd do differently

**Migrate tests first.** We had Playwright E2E tests that I added in a later commit. If I'd written them before the migration, I could have run them after each step to verify nothing broke. Instead, I was manually testing in the browser, which is slower and less thorough.

**Type the store more granularly.** The monolithic `StoreState` interface grew to 1,300+ lines as features were added. I should have split it into domain-specific stores (library store, UI store, settings store) during the migration. Doing it later meant another refactoring pass.

**Don't touch formatting in the same commit.** I said adding linting and types together was intentional. I still think it was the right call for this project size, but for anything larger, separate commits would make the review easier.

## The takeaway

TypeScript migrations are not about types. They're about making implicit contracts explicit. The `Game` interface didn't add new information; it documented information that was already there but only existed in the developers' heads. The discriminated union for `postMessage` didn't change the protocol; it made a bug visible that had been hiding for weeks.

The best time to migrate is right after you've shipped and right before you start the next feature sprint. You know the codebase well enough to type it accurately, and the types will pay off immediately as you build new features.
