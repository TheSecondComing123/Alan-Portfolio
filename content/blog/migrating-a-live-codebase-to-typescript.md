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

It worked. But adding features was getting painful. Every change to the game data model risked breaking something downstream because there was no way to trace how data flowed through the app. The window manager (spawning, dragging, resizing, managing game windows) was a single 300-line file that did everything.

I did the migration in two phases: vanilla JS to Svelte components, then JavaScript to TypeScript. Both while the product was live.

## Phase 1: Svelte migration

The original app rendered everything imperatively. `render.js` built HTML strings and injected them into the DOM. `state.js` held global variables. `library.js` fetched data and called render functions. `modal.js` managed a single modal. `views.js` handled tab switching. Six files, all tightly coupled through globals.

I replaced all of it with a Svelte app in one commit.

First, I created a centralized store. `store.svelte.js` using Svelte 5's `$state` rune replaced all the scattered state variables: library data, current tab, search query, view mode, modal state, all in one reactive object.

Then I componentized the UI. Six components replaced six imperative modules:

- `Sidebar.svelte` (tab navigation)
- `Header.svelte` (search, view toggle)
- `GameGrid.svelte` (card layout with filtering)
- `GameCard.svelte` (individual game tile)
- `ListRow.svelte` (list view variant)
- `Modal.svelte` (game detail overlay)

The landing page (hero animation, steam effects, window manager) stayed as vanilla TypeScript. It communicates with the Svelte app via `postMessage` across an iframe boundary. Migrating it to Svelte would have meant fighting Svelte's DOM ownership in a context where I needed pixel-level control over window positioning.

Then I deleted the old modules. `game-actions.js`, `library.js`, `modal.js`, `render.js`, `state.js`, `views.js`, all gone. `main.js` went from 53 lines of imperative setup to 5 lines mounting the Svelte app.

Fewer files, reactive updates instead of manual DOM patching, components that could be reasoned about in isolation.

## Phase 2: TypeScript migration

A week later, I converted the entire codebase to TypeScript. This was the more interesting migration because the decisions matter more than the mechanics.

### What I typed first

The game data model. `Game` objects flow through every layer: API response, store state, component props, event handlers, window manager, game launcher. Typing this one interface had the highest return.

```typescript
export interface Game {
    id: string | number
    title: string
    img: string
    link?: string
    _index?: number
}

interface StoreState {
    library: Game[]
    allGames: Game[]
    currentTab: 'home' | 'discover'
    viewmode: 'list' | 'grid'
    searchQuery: string
    modalOpen: boolean
}
```

With this in place, every component that receives a `Game` prop gets autocomplete and type errors if the shape changes. The `currentTab` union type (`'home' | 'discover'`) replaced a string comparison that had a typo bug in the original code.

### What I didn't type

The window manager's internal state. It uses absolute pixel positions, z-index stacks, and animation frame callbacks. Typing all of this would have been a lot of surface area for minimal benefit. The window manager is self-contained; it doesn't share its internal types with anything else.

I typed its public API (the functions other modules call) but left the internals as `any` in a few places. Pragmatic over pure.

### The linting setup

I added ESLint and Prettier in the same commit as the TypeScript migration. This is intentional. Add linting first and you get a massive diff of formatting changes mixed with your actual migration. Add it after and you have to re-review everything. Adding both together means one diff that includes types, formatting, and lint fixes. From that point forward, the codebase has guardrails.

### What broke

Svelte component props were the first issue. Svelte 5 uses `$props()` for component inputs, and the types need to match what the parent passes. In several places, the parent was passing `game.id` (which could be `string | number`) to a handler that expected `string`. TypeScript caught all of these. In vanilla JS, they worked by accident because JavaScript's loose equality was papering over the type mismatch.

The second issue was `postMessage` payloads. The landing page sends messages to the Svelte app iframe. These messages had no defined shape. I added a discriminated union for message types:

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

I should have migrated tests first. We had Playwright E2E tests that I added in a later commit. If I'd written them before the migration, I could have run them after each step to verify nothing broke. Instead, I was manually testing in the browser, which is slower and less thorough.

I should have typed the store more granularly. The monolithic `StoreState` interface grew to 1,300+ lines as features were added. Splitting it into domain-specific stores (library, UI, settings) during the migration would have saved a later refactoring pass.

And despite what I said above about adding linting and types in the same commit, for anything larger than this project, separate commits would make the review easier.

## Why it matters

TypeScript migrations are not about types. They're about making implicit contracts explicit. The `Game` interface didn't add new information. It documented information that was already there but only existed in the developers' heads. The discriminated union for `postMessage` didn't change the protocol. It made a bug visible that had been hiding for weeks.

The best time to migrate is right after you've shipped and right before you start the next feature sprint. You know the codebase well enough to type it accurately, and the types will pay off immediately as you build new features on top of them.
