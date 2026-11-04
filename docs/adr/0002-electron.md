# ADR-0002: Electron, one Chromium on every OS

- Status: accepted
- Date: 2026-01-05

## Context

Gradient is a desktop app from the start. The same UI has to look, focus and read the same on Linux,
macOS and Windows, and it needs files, notifications and global shortcuts. Tauri is much smaller, but
it renders in each OS's webview (WebKitGTK, WebView2, WKWebView), which is where cross-platform
rendering and accessibility drift comes from. It also adds a Rust toolchain for native work.

## Decision

Use Electron with electron-vite. Ship one Chromium runtime, keep the renderer a normal React app, and
put file, tray, menu and notification work in the main process.

## Consequences

- One rendering target, one keyboard model, one accessibility baseline.
- The installer is large (tens of megabytes) and memory use is higher than a native shell.
- Node in main makes atomic file writes and a tray-resident scheduler straightforward.
- The renderer stays sandboxed; Node is not available to it.
