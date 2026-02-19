---
title: How I Built ACSL Academy
date: 2026-02-15
readTime: 8 min read
excerpt: 'I built ACSL Academy to remove guesswork from prep with a clear loop: learn, practice, compete, review.'
tags:
    - Next.js
    - Supabase
    - Education
    - Product Design
---

## Problem

ACSL prep had a structure problem, not a motivation problem.

Students were putting in effort, but their workflow looked like this: random PDF, random drill, random YouTube explanation, then a timed set with no context. Predictably, they got good at familiar topics and stalled on harder ones. Under contest pressure, that inconsistency showed up fast.

The core issue was missing progression. Students didn’t need more material. They needed a system that always answered: what should I do next?

## Approach

I designed ACSL Academy around one repeatable training loop:

1. Learn concept
2. Solve focused drills on that concept
3. Run a timed contest-style set
4. Review misses and go back to weak topics

Then I built the product to enforce continuity between those steps.

Next.js gave me fast iteration on both lesson pages and practice flows. Tailwind kept the UI consistent so I could spend time on training logic instead of fighting styles. Supabase handled auth and progress tracking cleanly, which made persistence straightforward.

The important product choice was link density with intent:

- Every lesson routes directly into relevant drills.
- Every drill set writes progress and recent performance.
- Every timed set feeds review, not just a score.

No dead ends. No "pick anything" screens. The platform keeps momentum by design.

## Tradeoffs

I intentionally cut features that look exciting but distract from deliberate practice.

- No leaderboards, comments, or social feed in v1.
- No heavy CMS/editorial system in v1.

Those are valid features later. Early on, they were the wrong priority. The product had to prove one thing first: students improve faster with structured reps and feedback loops.

I also kept the content model simple. That let me ship lessons quickly, test difficulty pacing, and revise weak material without a giant tooling layer in the way.

## Results

The platform now includes 30+ structured lessons, targeted practice banks, and timed contest-style sets.

But the real result is behavioral: sessions are more consistent, review is more focused, and students spend less time deciding what to do and more time getting better.

When students stop asking what comes next, the system is working.

## What I Would Improve Next

- Add adaptive recommendations based on recent misses and time per question.
- Add post-contest review that groups mistakes by concept, not just score.
- Add a coach/parent weekly summary view.
