---
title: How I Built ACSL Academy
date: 2026-02-15
readTime: 8 min read
excerpt: I expected content to be the hard part. The real challenge was building a practice system that always tells students what to do next.
tags:
  - Next.js
  - Supabase
  - Education
  - Product Design
---

## Problem

Most ACSL prep I saw was fragmented. Students had folders of PDFs and random links, but no consistent sequence. In real sessions, people would over-practice topics they already liked (boolean logic, basic number conversions) and avoid harder ones (string parsing, bitwise edge cases, weird input formats).

The result was predictable: strong quiz scores in isolated drills, weak performance under contest timing.

## Approach

I built ACSL Academy around a fixed loop:

1. Learn concept
2. Solve focused drills on that concept
3. Run a timed contest-style set
4. Review misses and go back to weak topics

I used Next.js for fast iteration, Tailwind for consistent UI speed, and Supabase for auth + progress data. The key product detail was continuity: every lesson points to related drills, and every drill set writes progress so students can resume instantly where they left off.

## Tradeoffs

I skipped social features early (leaderboards, comments, class feeds). They increase engagement, but they also create noise when the main job is deliberate practice.

I also kept the content model intentionally simple. Fancy editorial tooling would have been nice, but it would have slowed down the thing that mattered most at this stage: publishing high-quality lessons and refining difficulty.

## Results

The platform now has 30+ structured lessons, dedicated practice banks, and timed sets with contest pacing. The biggest win was behavior change, not just features: sessions became more consistent because students had a clear next action instead of free-roaming through disconnected resources.

## What I Would Improve Next

- Add adaptive recommendations based on recent misses and time per question.
- Add post-contest review that groups mistakes by concept, not just score.
- Add a coach/parent weekly summary view.
