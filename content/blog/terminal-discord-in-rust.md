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

tiscord is a full Discord client that runs in your terminal. Browse servers, channels, and DMs. Send messages, react, search, see typing indicators. It connects directly to Discord's gateway for real-time updates and renders everything through Ratatui.

## Token storage

Discord tokens are sensitive. A leaked token gives full account access. So tiscord stores them in two tiers.

The first choice is the OS keyring. On macOS that's Keychain, on Linux it's Secret Service (GNOME Keyring or KDE Wallet), on Windows it's Credential Manager. The `keyring` crate abstracts the differences. When the keyring is available, the token never touches disk.

On headless servers or minimal containers where no keyring exists, tiscord falls back to a machine-bound encrypted file. The token gets encrypted with AES-256-GCM. The encryption key is derived from `hostname:username` via PBKDF2-HMAC-SHA256 with 600,000 iterations. The file layout is `salt (32 bytes) || nonce (12 bytes) || ciphertext`. On Unix, the file is chmod'd to 0600.

Copying the encrypted file to a different machine won't decrypt it because the key derivation inputs change. Someone with root on the same machine could still derive the same key, so it's not airtight. But it's a long way from plaintext.

## Gateway architecture

Discord's real-time communication happens over a WebSocket gateway. tiscord uses Twilight's gateway implementation with custom patches for user-account support (Twilight officially only supports bot accounts).

Three async tasks communicate over `tokio::sync::mpsc` channels:

- The gateway task maintains the WebSocket connection, handles heartbeats and reconnection, and deserializes events.
- The action handler processes user actions (send message, add reaction, switch channel) and translates them into HTTP API calls.
- The TUI task renders the interface, captures keyboard input, and dispatches actions.

Shared state (guilds, channels, messages, member lists) lives in an `Arc<RwLock<Store>>` that all tasks can read. Only the gateway task writes to it.

User accounts send a non-standard READY payload compared to bot accounts. The JSON includes guild folders, friend relationships, and DM channels in formats Twilight's deserializer doesn't expect. I handle this with a fallback manual JSON parser that extracts the fields I need when Twilight's parser fails.

## Rendering images in a terminal

Terminals are text-based. Discord is full of images. Bridging these two facts was the most interesting part of the project.

For terminals that support the Kitty graphics protocol (Kitty, WezTerm, Ghostty), the image is PNG-encoded, base64'd, and sent as escape sequences in 4096-byte chunks. The terminal decodes and renders the image inline. Display size is calculated with a rough heuristic: 1 column = 8 pixels, 1 row = 16 pixels.

For older terminals with Sixel support (like xterm), the image is quantized down to a 256-color palette using Euclidean distance in RGB space, then encoded as sixel characters. Each character represents a 1x6 pixel column. Color cycling happens per 6-row band.

If neither protocol is available, images are replaced with a `[image]` placeholder.

Detection is environment-based. I check `KITTY_WINDOW_ID`, `WEZTERM_EXECUTABLE`, and `TERM_PROGRAM` to pick the right protocol. No probing sequences needed.

## Loose ends and observations

Twilight's shard model is designed for bots managing thousands of guilds. For a single-user client on one shard, most of that complexity goes unused, but the abstractions stayed out of my way.

Terminal graphics are more capable than I expected going in. Kitty protocol in particular makes inline images feel native once you get past the escape sequence encoding.

The `tokio::sync::mpsc` channels turned out to be exactly right for structuring a TUI app like this. The gateway, action handler, and renderer run independently. Any of them can block without stalling the others.

Token security is a rabbit hole you can go arbitrarily deep into. Machine-bound encryption with a keyring as the primary path felt like a reasonable place to stop for a personal tool.
