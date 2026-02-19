---
title: Optimizing Microcosm for Smooth Combat Under Load
date: 2026-02-15
readTime: 7 min read
excerpt: 'How I optimized Microcosm so late-run combat stays smooth, responsive, and fair under heavy load.'
tags:
    - Python
    - Pygame
    - Performance
    - Game Dev
---

## Problem

Early encounters in Microcosm felt sharp. Late-run encounters didn’t.

As enemy count, projectiles, and effects stacked up, the game started dropping consistency in frame pacing. Raw FPS dips were visible, but the real damage was input feel. Dodges and invulnerability timing got less trustworthy at exactly the moment combat demanded precision.

That creates the worst kind of difficulty: not hard, just noisy.

## Approach

I started with profiling and targeted the hottest paths in the update loop:

- Collision checks
- AI state updates
- Frequent per-frame allocations

Then I applied focused changes with measurable impact:

- Tightened broad-phase filtering so entities only test nearby candidates
- Replaced repeated sqrt distance checks with squared-distance comparisons
- Pruned low-impact updates for inactive/off-screen entities
- Reduced object churn in hot loops

I also tightened combat readability by standardizing telegraph and hit feedback timing, so crowded fights still communicate clearly.

Design target: chaos on screen, clarity in control.

## Tradeoffs

Not every optimization is aesthetically pleasing.

Some hot paths became more explicit and lower-level than the rest of the codebase. That is a tradeoff I accepted because these paths run every frame and directly affect feel.

At the same time, I kept combat-critical behavior deterministic:

- Attack cadence
- Invulnerability windows
- Hit-stun timing

Performance work should improve responsiveness, not alter game fairness.

## Results

Late-run fights now hold steady much closer to early-run responsiveness.

The biggest win is trust: when players lose, it reads as a decision error, not timing jitter.

If a player gets hit now, it’s because the enemy won the exchange.

## What I Would Improve Next

- Add automated frame-time benchmarks before content updates.
- Add quality presets for weaker hardware.
- Add a runtime diagnostics mode to log spike-heavy encounters.
