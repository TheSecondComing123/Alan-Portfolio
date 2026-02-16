---
title: Optimizing Microcosm for Smooth Combat Under Load
date: 2026-02-15
readTime: 7 min read
excerpt: Microcosm felt great in early encounters but degraded in dense late-run fights. This is the optimization work that fixed that.
tags:
  - Python
  - Pygame
  - Performance
  - Game Dev
---

## Problem

As runs got deeper, entity count, projectile count, and visual effects all spiked together. FPS was not the only issue. The bigger problem was inconsistent frame pacing during heavy encounters, which made dodges and iframes feel less reliable exactly when precision mattered most.

## Approach

I profiled the update loop first and focused on the hottest paths:

- Collision checks
- AI state updates
- Frequent per-frame allocations

Then I applied targeted changes:

- Tightened broad-phase filtering so entities only test nearby candidates
- Replaced repeated sqrt distance checks with squared-distance comparisons
- Pruned low-impact updates for inactive/off-screen entities
- Reduced object churn in hot loops

I also standardized telegraph and hit feedback timing so readability stayed clear when the screen was busy.

## Tradeoffs

Some optimizations made code less pretty. A few hot paths got more manual than I would normally like, but they removed avoidable overhead.

I kept combat-critical logic deterministic (attack cadence, invulnerability windows, hit-stun behavior) so performance changes did not silently change game fairness.

## Results

Late-run encounters became noticeably smoother, and input response stayed much closer to early-run feel. The real improvement was player trust: losses felt tied to decisions, not timing jitter.

## What I Would Improve Next

- Add automated frame-time benchmarks before content updates.
- Add quality presets for weaker hardware.
- Add a runtime diagnostics mode to log spike-heavy encounters.
