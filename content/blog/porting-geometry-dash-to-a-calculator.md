---
title: Porting Geometry Dash to a Calculator
date: 2026-03-28
readTime: 7 min read
excerpt: 'Fitting a rhythm platformer onto a TI-84 Plus CE: 320x240 pixels, 256 colors, and no floating point.'
tags:
    - C
    - Embedded
    - Game Development
---

## The constraints

The TI-84 Plus CE has:

- A 320x240 LCD at 8 bits per pixel (256-color indexed palette)
- An eZ80 processor at 48 MHz
- About 150KB of usable RAM
- No floating point unit
- No GPU, no hardware sprites, no DMA for blitting

Geometry Dash is a rhythm platformer with precise physics, scrolling levels, and animated sprites. Fitting it onto this hardware required rethinking almost everything.

## Tile-based rendering

The game world is a grid of 21x21 pixel tiles. At 320 pixels wide, that's about 16 tiles per row with a few pixels of overflow for smooth scrolling. The tile set has 56 entries covering blocks, spikes, pads, portals, and decorative elements.

All tile graphics are RLE-compressed in Flash and decompressed into a RAM buffer at startup. Two separate buffers exist at fixed memory addresses: one for game tiles, one for menu tiles. Switching between game and menu means swapping which buffer the renderer reads from, along with swapping the 256-entry color palette.

Rendering is direct: for each visible tile, copy its 21x21 bytes from the tile buffer to the corresponding position in the LCD framebuffer. No abstraction layers, no scene graphs. The overhead budget is zero.

## Physics without floats

Jump physics in Geometry Dash are defined by a curve: the player rises quickly, decelerates, hangs briefly, then accelerates downward. Implementing this with floating point on a calculator would be too slow.

Instead, I use a lookup table. The jump arc is pre-computed as 40 entries mapping frame index to vertical displacement in pixel rows. The "rest" index (where vertical speed is zero, the apex of the jump) is entry 17.

```c
static const int16_t jump_lut[] = {
    -10, -9, -8, -7, -6,    /* strong upward */
    -5, -5, -4, -4, -3,     /* decelerating */
    -3, -2, -2, -1, -1,     /* approaching apex */
    -1, 0, 0,               /* hang time */
    1, 1, 1, 2, 2,          /* start falling */
    3, 3, 4, 4, 5,          /* accelerating */
    5, 6, 7, 8, 9,          /* fast fall */
    10, 10, 10, 10, 10      /* terminal velocity */
};
```

When the player jumps, a speed index starts at 0 and increments each frame. The displacement for that frame is `jump_lut[speed_index]`. Gravity is just "keep incrementing the index." Landing resets it. The result feels smooth despite being entirely integer math.

## Sprite rendering

The player cube is 30x30 pixels with 11 animation frames. The spaceship (fly mode) is 22x22 with 13 frames. These are too large to redraw by clearing and re-rendering the entire screen each frame.

Instead, I use behind-sprite buffers. Before drawing a sprite, I copy the 30x30 region it's about to cover into a backup buffer. Next frame, I restore from the backup before drawing the sprite at its new position. This means only the sprite's footprint gets redrawn, not the whole screen.

Two backup buffers exist (for primary and secondary sprites), and a flag tracks which is active. Transparency is handled by checking against a magic background color (0x7F in the palette). Pixels matching this color are skipped during sprite blit.

## Collision detection

No bounding boxes. Collision is pixel-based: read the color value from the framebuffer at the sprite's edge positions. Spikes have a distinct color range. Jump pads are in the 0x7A-0x7E range. Gravity ramps start at 0xFA.

This is crude but works because the tile graphics are designed with collision detection in mind. Every hazard uses a reserved color range that nothing else uses. It's essentially encoding collision data in the palette.

## Level format and editor

Levels are stored as TI variable files (.8xv). The format starts with a signature (`0xFF + "Epharius" + "GD"`), followed by RLE-compressed tile data. Each tile is a byte index into the 56-tile set.

The in-game level editor lets you place and remove tiles, then play-test from any position. Editing is done in a grid cursor mode. The editor stores levels in the same .8xv format, so user-created levels are indistinguishable from built-in ones.

## Practice mode

Practice mode adds checkpoints. Press Alpha to drop a checkpoint at your current position. On death, you respawn at the last checkpoint instead of the level start. The checkpoint saves position, gravity state, spaceship mode, and current sprite frame.

This was critical for testing levels during development. Without practice mode, iterating on late-level sections would mean replaying from the start every time.

## What I took away

- **Lookup tables replace math.** Any computation you'd do with floats can be pre-computed and stored. The jump arc, gravity curves, and speed ramps are all tables.
- **Palette-based collision is a hack that works.** Encoding collision semantics in color values is fragile (you can never reuse those colors for decoration), but on hardware this constrained, it's the right tradeoff.
- **Behind-sprite buffers are the poor man's double buffer.** Full double buffering would require 76KB (320x240 bytes), which is half the available RAM. Partial restoration is much cheaper.
- **Fixed-point everything.** Not a single float in the codebase. Positions are 24-bit integers. Velocities are table lookups. The eZ80 handles integer math fine at 48 MHz.
