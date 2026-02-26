---
title: Creating a C++ Templating System
date: 2026-02-26
readTime: 5 min read
excerpt: 'How I made a problem-solving templating workflow for competitive programming.'
tags:
    - Competitive Programming
    - C++
    - Python
---

## Problem

Once you get to a certain level in competitive programming, you feel a paradigm shift. The bulk of a problem shifts from algorithmic-focused to standing on the shoulders of masterful algorithms. Except in ad-hoc problems, many are repeating the same challenges over and over. Applying operations to a list, maximizing this cost, finding the shortest path. Don't get me wrong, problems are still quite observation-heavy, but you feel the same core ideas cycling. It's not annoying to reason about, but certainly to code. It can get tedious to have to type out binary search or a lazy-propagated segment tree for the 3000th time.

People have been using templates for ages. Yet it's almost always one of two classes:

- A 1600-line behemoth with detailed helpers for a heap-optimized sqrt-decomposed wavelet tree that supports finding the culmative row gcd over the dijkstra weights of a permutation in O(1)
- Something that gets the job done with simpler macros and helpers

Neither is satisfying. One does too much (at least for 99% of people) and the other is... acceptable.

## Approach

### Version 1

I sought out to fix this problem. I wanted some of the depth of the "ehh it'll get used someday" approach without importing random junk unrelated to the problem. C++ headers were perfect for this. Using `#include<helper.h>` allows me to import say, just prefix sum helpers at a time. For the actual headers, I focused on simple, well-documented, commonly-used features that are annoying to write. 2D prefix sums, graph traversal, modular integers. For the actual `template.cpp`, a simple `solve()` and `main()` shell with common macros, constants, and io helpers. Problem solved!

There's a slight issue with this approach. It cannot be submitted, at least not in its current state. There's a simple solution to this, just copy paste into your solution factor instead of using `.h` headers. Pretty nice.

### Version 2

Version 1 worked for a while. But copy pasting the files in got time-consuming as problems got more complex. And worse still, the solution size was bloated heavily with functions that were in that file but were unused. What I needed was a bundling system.

For the next couple of weeks, I researched templating systems what competitive programming masters did thoroughly. Next, I made tagged my header files. Comments such as `// export begin/end: <xyz>`. I made a bundling script using python, enhanced it with argparse for terminal friendliness, and hooked it up to my powershell profile. This approach works, but is very brittle. Some functions required others to exist; they had dependencies. So, I added a dependency list to the tagging system. For classes, I moved their member functions outside of them for easier tagging. I saw the improvement instantly. A solution went from 100 lines of template with 300 lines of unused template to just the 100 lines that were used. Finally, a templating system that could be easily extended and didn't become monolithic. Now, I could type up a solution via imported headers, and run `cbundle` in the terminal to expand the headers for a submittable form.

## Improvements

- Stripped comments and whitespace from the headers in the bundling process
- Made a recursive descent parser to resolve dependencies
- Made `cbundle` automatically detect the last modified C++ file and bundles after a confirmation

## Tradeoffs

Not every change to a header was absolute. Some were rolled back, core members were modified, parameter philosphies shifted. The result? Breaking backward compatbility: the main issue for this templating system today. Since it's still in rapid prototyping phase, I had many times where a seemingly obvious edit broke an unbundled file. This didn't outright break my old solutions since they were bundled, but it still caused inconsistancy. My solution was to create flags that could be toggled that allowed legacy support. Creating aliases for renamed members was also done.

So how does our approach compare to other methods?

## Results

- Problems that took dozens of lines of boilerplate now took effectively none
- My implementation speed increase drastically, in some cases over 3x faster!
- The flexibility of the approach made extending headers trivial

## What Did We Learn?

- Creating an innovative, actually useful design takes multiple iterations and peer review
- Keep backward compatability in mind
- Simplicity matters; don't over engineer

## What I Would Improve Next

- Make an automated testing unit for all headers to vertify success
- Make a tagging vertifier so that we know exporting and parsing is correct
