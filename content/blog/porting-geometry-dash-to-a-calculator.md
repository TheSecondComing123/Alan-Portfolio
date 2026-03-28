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

The TI-84 Plus CE has a 320x240 LCD at 8 bits per pixel (256-color indexed palette), an eZ80 processor at 48 MHz, about 150KB of usable RAM, no floating point unit, no GPU, no hardware sprites, and no DMA for blitting.

Geometry Dash is a rhythm platformer with precise physics, scrolling levels, and animated sprites. Fitting it onto this hardware required rethinking almost everything.

## Tile-based rendering

The game world is a grid of 21x21 pixel tiles. At 320 pixels wide, that's about 16 tiles per row with a few pixels of overflow for smooth scrolling. The tile set has 56 entries: blocks, spikes, pads, portals, decorative elements.

All tile graphics are RLE-compressed in Flash and decompressed into a RAM buffer at startup. Two separate buffers sit at fixed memory addresses, one for game tiles and one for menu tiles. Switching contexts means swapping which buffer the renderer reads from, along with swapping the 256-entry color palette.

Rendering is direct. For each visible tile, copy its 21x21 bytes from the tile buffer to the corresponding position in the LCD framebuffer. No abstraction layers. The overhead budget is zero.

## Physics without floats

Jump physics in Geometry Dash follow a curve: the player rises quickly, decelerates, hangs briefly, then accelerates downward. Implementing this with floating point on a calculator would be too slow.

I use a lookup table instead. The jump arc is pre-computed as 40 entries mapping frame index to vertical displacement in pixel rows. The apex (where vertical speed is zero) is entry 17.

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

The player cube is 30x30 pixels with 11 animation frames. The spaceship (fly mode) is 22x22 with 13 frames. Clearing and re-rendering the entire screen each frame would be far too expensive.

Instead I use behind-sprite buffers. Before drawing a sprite, I copy the 30x30 region it's about to cover into a backup buffer. Next frame, I restore from the backup before drawing the sprite at its new position. Only the sprite's footprint gets redrawn.

Two backup buffers exist for primary and secondary sprites. A flag tracks which is active. Transparency is handled by checking against a magic background color (0x7F in the palette), and pixels matching it are skipped during blit.

## Collision detection

No bounding boxes. Collision is pixel-based: read the color value from the framebuffer at the sprite's edge positions. Spikes have a distinct color range. Jump pads sit in the 0x7A-0x7E range. Gravity ramps start at 0xFA.

Crude, but it works because the tile graphics were designed with this in mind. Every hazard uses a reserved color range that nothing decorative touches. Collision data is encoded directly in the palette.

## Level format and editor

Levels are stored as TI variable files (.8xv). The format starts with a signature (`0xFF + "Epharius" + "GD"`), followed by RLE-compressed tile data. Each tile is a byte index into the 56-tile set.

The in-game level editor lets you place and remove tiles, then play-test from any position. Editing happens in a grid cursor mode. The editor stores levels in the same .8xv format, so user-created levels are indistinguishable from built-in ones.

## Practice mode

Practice mode adds checkpoints. Press Alpha to drop a checkpoint at your current position. On death, you respawn at the last checkpoint instead of the level start. The checkpoint saves position, gravity state, spaceship mode, and current sprite frame.

Without this, iterating on late-level sections during development would have meant replaying from the start every time. It shipped as a player-facing feature too, since the same frustration applies.

## Notes on the approach

Any computation you'd normally do with floats can be pre-computed and stored in a table. The jump arc, gravity curves, speed ramps: all tables. Not a single float in the codebase. Positions are 24-bit integers, velocities are table lookups, and the eZ80 handles integer math fine at 48 MHz.

Palette-based collision is fragile. You can never reuse those reserved colors for decoration. But on hardware this constrained, it saved me from maintaining a separate collision map in RAM I didn't have.

Full double buffering would require 76KB (320x240 bytes), which is half the available RAM. The behind-sprite buffer approach costs a fraction of that. It's the right tradeoff when you can guarantee sprites don't overlap much.
