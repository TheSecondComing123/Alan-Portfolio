---
title: Terminal Discord in Rust
date: 2026-03-28
readTime: 8 min read
excerpt: 'Architecture of tiscord: a TUI Discord client with real-time gateway, inline image rendering, and encrypted token storage.'
tags:
    - Rust
    - TUI
    - Systems Programming
---

## Why a terminal client

Discord's desktop app is an Electron wrapper. It works fine, but it takes 500MB+ of RAM to show text in a box. I wanted something I could run in a tmux pane alongside my editor without context-switching out of the terminal.

tiscord is a full Discord client that runs in your terminal. Browse servers, channels, and DMs. Send messages, react, search, and see typing indicators. It connects directly to Discord's gateway for real-time updates and renders everything through Ratatui.

## Token storage

Discord tokens are sensitive. A leaked token gives full account access. I built a dual-layer storage system:

**Primary: OS keyring.** On macOS, this means Keychain. On Linux, Secret Service (GNOME Keyring or KDE Wallet). On Windows, Credential Manager. The `keyring` crate abstracts this. If the keyring is available, the token never touches disk.

**Fallback: machine-bound encrypted file.** When the keyring isn't available (headless servers, minimal containers), the token gets encrypted with AES-256-GCM. The encryption key is derived from `hostname:username` via PBKDF2-HMAC-SHA256 with 600,000 iterations. The file format is `salt (32 bytes) || nonce (12 bytes) || ciphertext`. On Unix, the file is chmod'd to 0600.

The machine-binding means copying the encrypted file to a different machine won't decrypt it. Not perfect security (someone with root on the same machine can derive the same key), but it raises the bar significantly above plaintext.

## Gateway architecture

Discord's real-time communication happens over a WebSocket gateway. tiscord uses Twilight's gateway implementation with custom patches for user-account support (Twilight officially only supports bot accounts).

The architecture is event-driven with three async tasks communicating over `tokio::sync::mpsc` channels:

- **Gateway task**: maintains the WebSocket connection, handles heartbeats and reconnection, deserializes events
- **Action handler**: processes user actions (send message, add reaction, switch channel) and translates them into HTTP API calls
- **TUI task**: renders the interface, captures keyboard input, dispatches actions

Shared state (guilds, channels, messages, member lists) lives in an `Arc<RwLock<Store>>` that all three tasks can read. Only the gateway task writes to it.

User accounts send a non-standard READY payload compared to bot accounts. The JSON includes guild folders, friend relationships, and DM channels in formats Twilight's deserializer doesn't expect. I handle this with a fallback manual JSON parser that extracts the fields I need when Twilight's parser fails.

## Rendering images in a terminal

This was the most interesting problem. Terminals are text-based, but Discord is full of images. I support three graphics protocols:

**Kitty graphics protocol** (Kitty, WezTerm, Ghostty): the image is PNG-encoded, base64'd, and sent as escape sequences in 4096-byte chunks. The terminal decodes and renders the image inline. I calculate display size using the heuristic of 1 column = 8 pixels, 1 row = 16 pixels.

**Sixel** (older terminals like xterm with sixel support): the image is quantized down to a 256-color palette using Euclidean distance in RGB space, then encoded as sixel characters. Each character represents a 1x6 pixel column. Color cycling happens per 6-row band.

**No graphics**: if neither protocol is available, images are replaced with a `[image]` placeholder.

Detection is environment-based: I check `KITTY_WINDOW_ID`, `WEZTERM_EXECUTABLE`, and `TERM_PROGRAM` to determine which protocol the terminal supports. No probing sequences needed.

## What I learned

- **Twilight's shard model** is designed for bots managing thousands of guilds. For a single-user client connecting to one shard, most of the complexity is unnecessary, but the abstractions are clean enough that it works without fighting the library.
- **Terminal graphics are surprisingly capable** once you get past the escape sequence encoding. Kitty protocol in particular makes inline images feel native.
- **Async Rust channels** are the right abstraction for event-driven TUI apps. The gateway, action handler, and renderer are completely decoupled. Any of them can block without affecting the others.
- **Token security is a rabbit hole.** There's always a more sophisticated attack vector. Machine-bound encryption with keyring fallback is a pragmatic middle ground for a personal tool.
