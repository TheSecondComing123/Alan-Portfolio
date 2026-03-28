---
title: Designing AI That Feels Fair
date: 2026-03-28
readTime: 7 min read
excerpt: "Territory War's AI progression: from random moves to anticipatory strategy, without ever feeling cheap."
tags:
    - Game Design
    - AI
    - TypeScript
---

## The fairness problem

Most strategy game AI cheats. It sees the whole map, processes faster than a human, or gets resource bonuses to compensate for dumb decision-making. Players can tell. Even if they can't articulate it, the game feels wrong.

Territory War is a 1v1 turn-based territory control game. Two players move simultaneously on a shared grid, leaving permanent body trails. When you enclose an area, you claim it. Most claimed cells wins. The AI has to feel like a real opponent, not a difficulty slider with extra resources.

The constraint I set: the AI sees exactly what the player sees. No fog of war advantages, no hidden state, no extra moves. If the AI wins, it's because it played better.

## Six strategies, not one smart AI

Instead of building one monolithic AI that plays "optimally," I built six distinct strategies that each embody a different playstyle:

- Greedy Expand runs BFS from each possible move to count reachable empty cells and picks the direction that maximizes open space. Sprawling, territorial.
- Wall moves in straight lines toward the nearest grid edge, creating linear barriers.
- Encircle computes angular position relative to your head and orbits clockwise, tightening the loop. Suffocating.
- Deny runs BFS from your head to find your largest open corridor, then races to block it.
- Efficient Fill builds compact spirals to maximize territory-per-cell ratio. Defensive.
- Corner Trap identifies your nearest corner and races to box you in with diagonal aggression.

Each strategy is simple enough that a player can read it. After a few encounters you start recognizing "oh, it's doing Wall" and can adapt. That's the whole trick: the AI's behavior is predictable once you learn the patterns, and beating it requires counter-strategy rather than raw speed.

## Progressive difficulty

The AI doesn't just get "harder" in a linear sense. It gets smarter about how it picks and times its strategies.

At levels 1 through 10, it switches between strategies randomly. Ignores what you're doing. You're learning the game mechanics, and the AI is just an obstacle to practice against.

Levels 11 through 25, it starts counter-picking. After observing your strategy for 3 ticks, it identifies what you're doing and switches to a counter. Playing Greedy Expand? It switches to Deny.

Levels 26 through 40, it anticipates your switches. It tracks your strategy cooldowns and predicts when you'll switch, pre-positioning with a counter before you've even committed.

Level 41 and beyond, it optimizes against your known pool. It knows which strategies you've unlocked and runs minimax-style evaluation against your possible loadouts.

The jump from reactive to anticipatory is where most players hit the wall. You can't just find one good strategy and spam it. You have to vary your play and manage cooldowns deliberately.

## The loadout guarantee

Players pick 2 strategies before each level (3 after level 15). The AI also has a fixed loadout per level. I enforce a hard constraint: every level must be beatable with at least 3 different player loadout combinations.

This prevents the degenerate case where there's only one "correct" answer. If a level is only beatable with Deny + Encircle, it's a puzzle, not a strategy game. Multiple viable loadouts mean the player can express their preferred style.

I validate this during level design by simulating all possible loadout combinations against the AI's fixed behavior. If fewer than 3 win consistently, I adjust the AI's loadout or the grid dimensions until the constraint is satisfied.

## Per-strategy cooldowns

After switching away from a strategy, it goes on cooldown. Cooldowns are per-strategy, not global. Your current strategy and both cooldown timers are always visible to both players.

You can't just alternate between two strategies every tick. You have to plan sequences: use Strategy A for 5 ticks, switch to B, and by the time B's cooldown starts, A is available again. The AI reads these rhythms at higher levels. Predictable patterns get punished.

## Why it works

The AI's current strategy is always visible. You can see what it's doing and reason about why. No hidden state.

Each strategy has a distinctive movement signature. Encircle curves. Wall goes straight. Corner Trap moves diagonally. You learn to recognize them fast.

And every strategy has at least two effective counters, so there's no dominant option. Rock-paper-scissors dynamics emerge naturally from the six strategy interactions. The AI never needs to cheat because the strategy system gives it enough real tools to be genuinely difficult. When you lose, you can replay and see exactly what happened, because nothing was hidden.
