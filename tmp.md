

# src/electron architecture review

**Session ID:** ses_07d9cf9edffedVr2TCl9ADhJ1O
**Created:** 7/20/2026, 7:55:55 PM
**Updated:** 7/20/2026, 8:00:18 PM

---

## User

review the code in src/electron and suggest best practices / architectural mistakes

---

## Assistant (Plan · Claude Sonnet 4.6 · 223.3s)

_Thinking:_

Let me explore the `src/electron` directory to understand the codebase structure and then analyze it for best practices and architectural issues.

**Tool: task**

**Input:**
```json
{
  "description": "Explore src/electron codebase",
  "prompt": "Explore the src/electron directory thoroughly. I need a comprehensive analysis of the codebase structure, including:\n1. Directory structure and file organization\n2. Key files and their purposes\n3. How IPC communication is handled between main/renderer\n4. State management patterns\n5. Any notable patterns or anti-patterns in the code\n6. How modules are organized\n7. Security practices (contextIsolation, nodeIntegration, etc.)\n8. Error handling patterns\n9. Any use of preload scripts\n\nPlease read all the key files and provide detailed content summaries. Be very thorough - read through main process files, renderer files, preload scripts, and any utility/helper files.",
  "subagent_type": "explore"
}
```

**Output:**
```
<task id="ses_07d9cbe9fffe4nJr8iYL1S7UHY" state="completed">
<task_result>
```
I now have a complete picture of every file. Here is the comprehensive analysis:

---

# Comprehensive Analysis: `src/electron` Codebase

## 1. Directory Structure and File Organization

The `src/electron` directory is flat — no subdirectories. It contains exactly **14 files**, cleanly partitioned by responsibility:

src/electron/
├── main.ts                  # Electron entry point / IPC orchestrator
├── AppState.ts              # Central application state store
├── appState-config.ts       # Config entry declarations / seed data
├── IpcWs.ts                 # Dual-transport IPC abstraction (Electron + WebSocket)
├── ServerManager.ts         # HTTP + WebSocket server lifecycle management
├── express.ts               # Express app factory (routes for media/static)
├── http-server.ts           # Stub / abandoned class (never completed)
├── preload-ui.cts           # Preload script for the UI BrowserWindow
├── preload-display.cts      # Preload script for Display BrowserWindows
├── parser.ts                # Custom .sinai song file parser & serializer
├── pathResolver.ts          # Path helper (preload & config paths, dev/prod)
├── util.ts                  # Single utility: isDev()
├── electron-constants.ts    # IPC channel allow-lists (currently unused)
└── tsconfig.json            # TypeScript config for the electron target
```

The companion `src/shared/` directory contains types and modules shared between the main process and all renderer processes:

```
src/shared/
├── media-classes.ts         # Domain model: Media, MediaSong, MediaImage, Song types
├── config-classes.ts        # Config type system (validators, serialization)
├── IpcWsClient.ts           # Client-side dual-transport IPC (mirrors IpcWs.ts)
├── constants.ts             # Global constant: DISPLAYS = 4
└── isElectron.ts            # Runtime environment detection
```

---

## 2. Key Files and Their Purposes

### `main.ts` (748 lines) — The Monolithic Orchestrator
This is the Electron main-process entry point. It does a great deal of work directly:
- Instantiates `AppState`, `IpcWs`, and `ServerManager` at module scope (before `app.ready`).
- Registers every `ipcMain.on(...)` handler inline (no separation of concerns to sub-modules).
- Creates and manages two kinds of `BrowserWindow`: one UI window and up to N display windows.
- Registers two custom Electron `protocol` handlers: `fetch-media://` and `local-file://` for serving local files to BrowserWindows without a file-system path being exposed to the renderer.
- Contains all setlist/media file I/O logic (reading songs, images, directories, writing setlists).
- Contains all dialog invocation logic (open/save dialogs, confirmation dialogs, error dialogs).
- Handles process-level unhandled rejections.

### `AppState.ts` (338 lines) — Centralized State Store
A single class, `AppState`, that holds all runtime state with `#private` fields:
- `#setlist: number[]` — ordered list of media IDs.
- `#media: Map<number, Media>` — the in-memory database of all loaded media.
- `#openMedia: number | null` — which media has its controls open in the UI.
- `#liveElements: (LiveElementIdentifier | null)[]` — what is being projected per display.
- `#logo: boolean[]` — logo visibility per display.
- `#dc` / `#gc` — display config entries and general config entries.
- `#port: number | null` — the current HTTP server port.
- Has validation-throwing setters (e.g., `setLiveElement`, `setOpenMedia`, `deleteMedia`).
- Calls `writeConfigFile()` on every config mutation (synchronous-style, async under the hood).

### `IpcWs.ts` (112 lines) — Dual-Transport IPC Bridge (Main-Side)
The most architecturally significant module. It wraps `ipcMain` and a `WebSocketServer` to create a unified message bus:
- `broadcastToWsClients(channel, ...args)` — mirrors `webContents.send()` for WebSocket clients.
- `handle(channel, handler)` — registers both an `ipcMain.handle` and an internal WS invoke handler simultaneously.
- On WebSocket `message`: validates the channel against allow-lists, then either calls `ipcMain.emit(...)` (for `send`-type) or looks up and calls a registered invoke handler and sends a `invoke-reply` (for `invoke`-type).
- This design makes display windows work identically whether rendered in an Electron `BrowserWindow` or in a real browser (Chrome, Firefox) connecting over HTTP+WS — a notable architectural decision.

### `ServerManager.ts` (93 lines) — HTTP/WS Server Lifecycle
Manages start/stop of the embedded HTTP+WebSocket server cleanly:
- `start()` always calls `stop()` first, so it is safe to call for restarts.
- Binds on port `0` (OS-assigned), so it never conflicts with other services.
- Calls `ipcws.initWss(wss)` to connect the WebSocket server to the IPC bridge.
- Exposes `updatePortCallback` as a public settable callback (instead of accepting it in the constructor), so `main.ts` can wire it up post-construction.

### `express.ts` (29 lines) — HTTP Route Factory
Creates the Express app used by `ServerManager`:
- `GET /fetch-media/:id` — serves image media files from the in-memory `AppState.media` map.
- `GET /local-file/:path` — serves arbitrary local files (path passed via URL).
- `GET /mobile/*` — static serve of `dist-mobile-ui` (a separate mobile web UI build).
- `GET /*` — static serve of `dist-display` (the display window React build, so browser clients can open the display UI without needing Electron).

### `preload-ui.cts` (82 lines) — UI Window Preload Script
Uses `contextBridge.exposeInMainWorld("electron", {...})` to expose a typed, named API. Every function is created via three factory helpers:
- `makeIpcSend(channel)` — wraps `ipcRenderer.send`, adds `console.debug` logging.
- `makeIpcOn(channel)` — wraps `ipcRenderer.on`, adds a logger listener, returns a cleanup function (essential for React `useEffect` teardown).
- `makeIpcInvoke<T>(channel)` — wraps `ipcRenderer.invoke`, adds logging for both the call and the response.

### `preload-display.cts` (33 lines) — Display Window Preload Script
A lower-level, more restricted preload. Instead of named typed methods, it exposes three generic, channel-validated primitives: `ipcRendererSendS`, `ipcRendererOnS`, `ipcRendererInvokeS`. Each validates the channel against a hardcoded allow-list before calling through to Electron IPC. This is the interface the `CustomIPC` client in `shared/IpcWsClient.ts` uses when running inside Electron.

### `parser.ts` (214 lines) — Song File Parser/Serializer
Implements a custom plain-text song format (`.sinai`, `.mss`, `.txt`):
- Commands are prefixed with `!-`: `!-T Title`, `!-A Author`, `!-S SectionName`, `!-R RepeatName`.
- `parseSong(rawText)` — parses raw text into a structured `Song` object (validates no duplicate section names, requires a title, throws descriptive errors).
- `stringifySong(song)` — round-trips a `Song` back to the text format, using a `isWritten` flag to determine whether to emit `!-S` (first occurrence) or `!-R` (repeat).
- `logSong(song)` — pretty-prints a song to the console.

### `appState-config.ts` (32 lines) — Config Seed
A pure factory function `addConfigEntries(appState)` that registers all display (`dc`) and general (`gc`) config entries:
- Display config (per-display): `background-color`, `background-image`, `transition-duration`, `logo-path`, `logo-size`, `font-size`, `font`, `bold`, `text-color`, `text-outline-width`, `text-outline-color`, four text margin entries, `text-background-color`.
- General config (app-wide): `dark-theme`.

### `pathResolver.ts` (29 lines) — Dev/Prod Path Resolution
- `getPreloadPath("ui" | "display")` — resolves the correct path to the preload `.cjs` file, handling `isDev()` vs production directory layouts.
- `getConfigPath()` — returns the config file path; in dev mode it's `./config.json` in the app root; in production it points to `process.resourcesPath/extraResources` (note: this appears to be a bug — see §5 below).

### `electron-constants.ts` (14 lines) — IPC Channel Allow-Lists
Defines `ALLOWED_DISPLAY_SEND_CHANNELS` and `ALLOWED_DISPLAY_INVOKE_CHANNELS`. These are identical to the hardcoded arrays in `preload-display.cts`. They are **currently commented out / unused** inside `IpcWs.ts` (a comment in that file explicitly notes "ignore, redundant").

### `util.ts` (3 lines) — Environment Helper
`isDev()` checks `process.env.NODE_ENV === 'development'`.

### `http-server.ts` (10 lines) — Dead Code / Stub
Contains a class `ManagedHttpServer` with a constructor and a commented-out `start(port)` signature but no implementation. This was superseded by `ServerManager.ts` and serves no function.

### `tsconfig.json` — TypeScript Configuration
- `target: "ESNext"`, `module: "NodeNext"` (Node.js ESM with `.js` extension resolution).
- `outDir: "../../dist-electron"`.
- `strict: true`.
- Includes `../../types` as a global type declaration source (the `types.d.ts` at the repo root, which declares the `UIWindow` and `DisplayWindow` global types).

---

## 3. IPC Communication Architecture

This codebase has a **dual-transport IPC system** — the most distinctive architectural feature. The goal is for the display renderer to work identically whether it runs inside Electron or in a regular browser tab.

### Transport 1: Electron IPC (for BrowserWindows)

The standard flow:
```
Renderer (preload-exposed API)
  → ipcRenderer.send / invoke
  → ipcMain.on / handle (in main.ts)
  → webContents.send (back to renderer)
```

- **UI window** uses the fully-typed, named API from `preload-ui.cts`.
- **Display window** uses the generic, channel-validated primitives from `preload-display.cts`.
- All send-from-main functions in `main.ts` call both `webContents.send` AND `ipcws.broadcastToWsClients`, ensuring both transports are always notified.

### Transport 2: WebSocket (for real-browser clients)

```
Browser (IpcWsClient.ts CustomIPC)
  → WebSocket.send({ type: "send"|"invoke", channel, args, id? })
  → IpcWs.ws.on("message") validates channel, calls ipcMain.emit or invokeHandler
  → IpcWs.broadcastToWsClients({ type: "on"|"invoke-reply", channel, args/result, id? })
  → WebSocket.message event in IpcWsClient.ts calls registered listeners or resolves pending promise
```

### Unified Client API (`shared/IpcWsClient.ts`)

`CustomIPC` is a runtime-polymorphic IPC object:
- `CustomIPC.on(channel, cb)` — in Electron: calls `ipcRendererOnS`; in browser: registers a WS listener.
- `CustomIPC.send(channel, ...args)` — in Electron: calls `ipcRendererSendS`; in browser: `ws.send({type:"send",...})`.
- `CustomIPC.invoke(channel, ...args)` — in Electron: calls `ipcRendererInvokeS`; in browser: sends `{type:"invoke", id}` and returns a `Promise` resolved on `invoke-reply`.

The `isElectron()` check (`!!window.electron`) is the runtime switch.

### IPC Channel Inventory

**Main → UI Renderer (push):**
| Channel | Payload |
|---|---|
| `ui-state-update-setlist` | `SerializedMediaIdentifier[]` |
| `ui-state-update-open-media` | `SerializedMediaWithId \| null` |
| `ui-state-update-live-elements` | `(LiveElementIdentifier \| null)[]` |
| `ui-state-update-logo` | `boolean[]` |
| `ui-update-display-config` | `SerializedDisplayConfigEntry[]` |
| `ui-update-general-config` | `SerializedGeneralConfigEntry[]` |
| `ui-update-port` | `number \| null` |

**Main → Display Renderer (push):**
| Channel | Payload |
|---|---|
| `display-state-update-live-elements` | `displayIndex, SerializedLiveElement \| null` |
| `display-state-update-logo` | `displayIndex, boolean` |
| `display-update-display-config` | `SerializedDisplayConfigEntry[]` |

**UI Renderer → Main (fire-and-forget `send`):**
`ui-state-request`, `ui-display-config-request`, `ui-general-config-request`, `ui-restart-server-request`, `ui-port-request`, `ui-open-devtools`, `new-display-window`, `set-open-media`, `set-live-element`, `set-logo`, `add-images`, `add-songs`, `read-directory`, `write-setlist`, `move-media`, `delete-media`, `create-song`, `replace-song`, `save-song`, `alert`, `ui-set-display-config-entry`, `ui-reset-display-config-entry`, `ui-display-config-input-path`, `ui-set-general-config-entry`, `ui-reset-general-config-entry`, `ui-general-config-input-path`

**Display Renderer → Main (invoke):**
| Channel | Args | Return |
|---|---|---|
| `invoke-display-get-init-live-state` | `displayIndex` | `SerializedLiveState` |

---

## 4. State Management Patterns

### Single Source of Truth: `AppState`
All mutable runtime state lives exclusively in one `AppState` class instance in the main process. The renderers are always downstream — they receive serialized snapshots, never mutate state directly. State flows in one direction: renderer sends a command → main updates `AppState` → main broadcasts the new snapshot.

### State Serialization
`AppState` has dedicated "getter" methods that produce serializable plain objects for each slice of state:
- `getUIStateSetlist()` → `SerializedMediaIdentifier[]` (IDs + names, no media data).
- `getUIStateOpenMedia()` → `SerializedMediaWithId | null` (full media content).
- `getUIStateLiveElements()` → `(LiveElementIdentifier | null)[]` (just IDs, no data).
- `getDisplayStateLiveElement(displayId)` → `SerializedLiveElement | null` (rendered text or image ID).

### Pull-on-Request Pattern
Every state slice has a corresponding `*-request` IPC channel. On startup the renderer sends a request, and the main process responds with the current state. This avoids the need for any persistent two-way binding.

### Config Persistence
Config state (`dc`, `gc`) is persisted to disk (`config.json`) on every mutation via `writeConfigFile()`. There is no debouncing — every keystroke or toggle triggers an async write. On startup, `readConfigFile()` rehydrates config into the in-memory entries.

### Private Fields Encapsulation
`AppState` uses ES2022 `#private` fields throughout. All mutation goes through validated public methods, making it impossible to corrupt state from outside the class.

---

## 5. Notable Patterns and Anti-Patterns

### Good Patterns

- **Dual-transport IPC abstraction**: The `IpcWs` / `IpcWsClient` / `CustomIPC` system is a well-designed abstraction that makes the display renderer environment-agnostic. This is non-trivial and architecturally sound.
- **Private class fields everywhere**: `AppState`, `IpcWs`, `ServerManager` all use `#private` fields, enforcing encapsulation at the language level.
- **Validated config types**: The `ConfigEntryBase.assertType()` pattern with typed validators ensures only valid values enter the state store.
- **Preload cleanup functions**: `makeIpcOn` returns an unsubscribe function, which is the correct pattern for React `useEffect` cleanup.
- **`Promise.allSettled` for batch file loads**: When loading multiple songs, errors are collected and all results are processed before showing a single combined error dialog.
- **Custom protocol handlers**: Using `protocol.handle('fetch-media', ...)` and `protocol.handle('local-file', ...)` to serve local files avoids exposing `file://` URIs directly to renderers.
- **Graceful server restart**: `ServerManager.stop()` properly closes all WebSocket clients before closing the HTTP server, using `Promise`-based async cleanup.

### Anti-Patterns / Issues

- **`main.ts` is a god file**: At 748 lines, `main.ts` directly handles every IPC channel, all file I/O, all dialog logic, window creation, protocol handling, and app lifecycle. This should be decomposed into handler modules (e.g., `mediaHandlers.ts`, `configHandlers.ts`, `windowManager.ts`).
- **`http-server.ts` is dead code**: The `ManagedHttpServer` stub has no implementation and is never imported. It should be removed.
- **`electron-constants.ts` is also dead code**: The allow-list constants are defined but the comment in `IpcWs.ts` explicitly marks the import as "ignore, redundant." The actual allow-lists are hardcoded inline in `preload-display.cts` and in the `IpcWs` constructor call in `main.ts`. This is DRY violation with no consumers.
- **`getConfigPath()` production bug**: In production, `getConfigPath()` returns `path.join(process.resourcesPath, "extraResources")` — a directory path, not a file path. The code that calls it does `fs.writeFile(getConfigPath(), ...)`, which would try to write a file with the name of a directory.
- **Broken template literals in error messages**: Several error strings in `main.ts` use `{id}`, `{media.name}`, etc. instead of `${id}`, `${media.name}` (e.g., in `replace-song` and `writeSong` error handlers). These will produce literal string `{id}` in dialogs instead of the value.
- **No input sanitization on `local-file` express route**: `expressApp.get("/local-file/:path", ...)` calls `res.sendFile(decodeURIComponent(req.params.path))` with no path validation. Any browser-connected WebSocket client could request any file on the system.
- **`ipcMain.emit` for WS→Electron bridging**: `IpcWs` uses `ipcMain.emit(msg.channel, {}, ...args)` to forward WebSocket messages into the Electron IPC system. This is an undocumented Electron internal API usage and is fragile.
- **Unbounded `wsQueue`**: In `IpcWsClient.ts`, messages sent before the WebSocket is ready are pushed to `wsQueue: string[]` with no size cap, which could grow without bound if the connection is never established.
- **Module-scope side effects before `app.ready`**: `AppState`, `IpcWs`, and `ServerManager` are all instantiated at module scope (before `app.on("ready", main)`). `addConfigEntries` and `appState.readConfigFile()` are also called at module scope. While this works, it runs before Electron is fully initialized and can cause subtle issues with `dialog` or `app.getAppPath()` not being available.
- **`hasConfirmedUiWindowClose` flag**: The close-confirmation flag is a module-level `let` boolean, which would break if the UI window were ever recreated.
- **`FIXME` comment in close handler**: Lines 724–727 have a commented-out block with a `FIXME: looks to do nothing` note, indicating live elements are not cleared on quit.

---

## 6. Module Organization

The codebase uses **ES Modules** (`"type": "module"` in `package.json`) with `NodeNext` module resolution for the Electron side. The preload scripts use the `.cts` extension (CommonJS TypeScript) because Electron preload scripts must be CommonJS-compatible.

**Dependency graph (simplified):**

```
main.ts
  ├── AppState.ts
  │     └── shared/config-classes.ts
  │     └── shared/media-classes.ts
  │     └── shared/constants.ts
  ├── appState-config.ts → AppState.ts
  ├── IpcWs.ts
  ├── ServerManager.ts → IpcWs.ts
  ├── express.ts → AppState.ts
  ├── parser.ts → shared/media-classes.ts
  ├── pathResolver.ts → util.ts
  └── util.ts

preload-ui.cts      (standalone, no imports from the app)
preload-display.cts (standalone, no imports from the app)

shared/IpcWsClient.ts → shared/isElectron.ts
```

The `src/shared/` modules are consumed by both the Electron main process and the renderer/web processes (via Vite bundling for the renderer side, and TypeScript compilation for the main side).

---

## 7. Security Practices

### `contextIsolation`
**Not explicitly set** in either `BrowserWindow` creation. In Electron 12+, `contextIsolation` defaults to `true`, so the app is running with context isolation on by default — which is the secure configuration.

### `nodeIntegration`
**Not explicitly set**. Defaults to `false` in modern Electron — correct. Renderer processes have no direct Node.js API access.

### `contextBridge.exposeInMainWorld`
Both preload scripts use `contextBridge.exposeInMainWorld("electron", {...})` — the correct and secure way to expose APIs to the renderer. The bridge is the only surface area between renderer and main.

### Channel Allow-Lists in `preload-display.cts`
The display preload explicitly validates channels before forwarding to Electron IPC:
```typescript
if (!ALLOWED_DISPLAY_SEND_CHANNELS.includes(channel))
  throw new Error(`...disallowed channel ${channel}`);
```
This limits what the display renderer can send to main. The UI preload does **not** do this — it exposes fully named, specific methods (implicit allow-listing by API design).

### `IpcWs` Channel Validation
The `IpcWs` class also validates incoming WebSocket messages against the `allowedOnChannels` and `allowedInvokeChannels` passed at construction time, preventing arbitrary channel invocation by WebSocket clients.

### Custom Protocol Handlers
`protocol.handle('fetch-media', ...)` and `protocol.handle('local-file', ...)` are used instead of `file://` URIs, providing a controlled indirection. However, the `local-file` express HTTP route (for browser clients) has no such guard — it serves any path.

### `webSecurity` / `sandbox`
Not configured; defaults apply. Electron's `sandbox` defaults changed over versions — should be explicitly set for a production app.

---

## 8. Error Handling Patterns

The error handling is **consistent but coarse-grained** — nearly all errors surface to the user as a `dialog.showErrorBox("Error", err.message)`.

**Layers:**
1. **Global catch-all**: `process.on('unhandledRejection', ...)` at the top of `main.ts` shows a dialog for any unhandled Promise rejection.
2. **IPC handler try/catch**: Most `ipcMain.on(...)` handlers wrap their logic in `try/catch` and show an error dialog on `instanceof Error` errors (silently ignoring non-Error throws).
3. **`AppState` validation throws**: Methods like `setLiveElement`, `setOpenMedia`, `deleteMedia` throw `Error` with descriptive messages — these bubble up to the IPC handler catch blocks.
4. **File I/O errors**: `readSong` and `readImage` use Promise-based wrapping; `readSong` rejects with a descriptive error that includes the file basename. `readFile` errors are logged with the full path.
5. **`Promise.allSettled`**: Used for batch operations to collect all errors before showing one combined dialog.
6. **Silent `reject` ignores**: In `imageDialog()` and in the dialog cancel paths, rejection is swallowed with an empty `(reason) => {}` callback — intentional (user cancelled).
7. **IpcWs error handling**: `broadcastToWsClients` wraps `ws.send` in try/catch and logs errors via `console.error`. The `invoke-reply` send path does the same.
8. **`ServerManager`**: `httpServer.listen` callback catches port resolution errors; `stop()` logs but does not rethrow server close errors.

**Gap**: There is no error recovery or retry logic anywhere. All errors are terminal — show a dialog, user must act manually.

---

## 9. Preload Scripts

### `preload-ui.cts` — For the UI `BrowserWindow`

- **Extension**: `.cts` — TypeScript CommonJS module (required for preload scripts).
- **Pattern**: Factory functions (`makeIpcSend`, `makeIpcOn`, `makeIpcInvoke`) generate typed wrappers for each channel.
- **Logging**: Every call and every received message is `console.debug`-logged, with both the channel and args. The log listener is added as a _second_ listener via `ipcRenderer.on`, so it doesn't interfere with the actual callback.
- **Cleanup**: `makeIpcOn` returns `() => { ipcRenderer.removeListener(...) }` — proper teardown support for React's `useEffect`.
- **Type safety**: The global type declaration in `types.d.ts` (`UIElectron` interface) fully mirrors the exposed API with TypeScript types, giving type safety to the renderer code without bundling the preload's types directly.

### `preload-display.cts` — For Display `BrowserWindow`s

- **Pattern**: Exposes raw, channel-validated primitives rather than named methods.
- **Allow-list enforcement**: `ipcRendererSendS` and `ipcRendererInvokeS` each check against hardcoded string arrays and throw if the channel is not in the list.
- **Purpose of raw exposure**: Because the display window uses `CustomIPC` (the `IpcWsClient` abstraction), which needs generic `send`/`on`/`invoke` primitives rather than named methods.
- **`ipcRendererOnS`**: Notably does NOT validate the channel against an allow-list — any channel can be listened on. Only outgoing messages are restricted.
- **Uses `import` syntax**: Unlike `preload-ui.cts` which uses `require()`, `preload-display.cts` uses ES `import` at the top — while this works because TypeScript compiles it to CJS output anyway, it's slightly inconsistent.

---

## Summary Table

| Aspect | Implementation |
|---|---|
| Electron version | `^39.2.6` |
| contextIsolation | Default `true` (not explicitly set) |
| nodeIntegration | Default `false` (not explicitly set) |
| Preload scripts | 2 scripts: `preload-ui.cts` (named API), `preload-display.cts` (validated raw primitives) |
| IPC pattern | Renderer pull-on-request + main push on mutation |
| Transports | Electron IPC + WebSocket (unified via `IpcWs`/`IpcWsClient`) |
| State management | Single `AppState` class in main process; renderers receive serialized snapshots |
| Config persistence | JSON file, written on every mutation |
| Error handling | try/catch + `dialog.showErrorBox` everywhere; global unhandledRejection handler |
| Song file format | Custom text format (`.sinai`), parsed/serialized entirely in `parser.ts` |
| Build | TSC for electron (CJS/ESM NodeNext), Vite for renderers (UI, Display, Mobile UI) |
| Dead code | `http-server.ts`, `electron-constants.ts` |
| Known bugs | `getConfigPath()` production path, broken template literals in error messages, unguarded `local-file` express route |
</task_result>
</task>
```

---

## Assistant (Plan · Claude Sonnet 4.6 · 39.4s)

_Thinking:_

This is a very thorough analysis. Let me now organize this into a clear, well-structured review for the user. I'll categorize issues by severity and provide specific file references.

Here's a thorough review of `src/electron`. Issues are grouped by severity.

---
```

## Architecture

### `main.ts` is a God File
At 748 lines, `main.ts` owns everything: IPC handlers, file I/O, dialog logic, window management, protocol registration, and app lifecycle. It should be decomposed:

src/electron/
  handlers/
    mediaHandlers.ts    # add-images, add-songs, read-directory, etc.
    configHandlers.ts   # set/reset display/general config entries
    setlistHandlers.ts  # write/move/delete setlist operations
    songHandlers.ts     # create-song, replace-song, save-song
  WindowManager.ts      # BrowserWindow creation, devtools, display windows

### State Instantiated Before `app.ready`
`AppState`, `IpcWs`, `ServerManager`, and `addConfigEntries` / `readConfigFile` are all invoked at module scope, before `app.on("ready", main)`. Config reading works, but anything that touches `app.getAppPath()`, `dialog`, or other Electron APIs that require the app to be ready can fail silently here.

### `ipcMain.emit` is an Internal Hack
In `IpcWs.ts`, WebSocket messages are bridged into Electron via `ipcMain.emit(channel, {}, ...args)`. This is an undocumented internal API — it's fragile and may break across Electron major versions. Consider instead calling the registered handler functions directly (store them in a `Map` and invoke them, rather than re-emitting through `ipcMain`).

### `hasConfirmedUiWindowClose` is a Module-Level Flag
This `let` boolean in `main.ts` would misbehave if the UI window were ever closed and reopened. It belongs as instance state on a `WindowManager` class.

---

## Bugs

### `getConfigPath()` Returns a Directory in Production
`pathResolver.ts` returns `path.join(process.resourcesPath, "extraResources")` in production — a directory, not a file. All `fs.writeFile(getConfigPath(), ...)` calls will fail at runtime in packaged builds.

### Broken Template Literals in Error Messages
Multiple error strings use `{id}` / `{media.name}` instead of `${id}` / `${media.name}`. Users see literal `{id}` in error dialogs rather than the actual value. Search `main.ts` for `"{` to find all occurrences.

### `ipcRendererOnS` Has No Channel Allow-List
`preload-display.cts` validates outgoing channels but not incoming `on` subscriptions. The display renderer can listen on any arbitrary channel name.

---

## Security

### Unguarded `local-file` Express Route
`express.ts` serves any local file path via `GET /local-file/:path` with no validation:

```typescript
res.sendFile(decodeURIComponent(req.params.path))
```

Any browser client connected over WebSocket can read arbitrary files from the filesystem. Add a path allowlist or restrict to a specific base directory.

### `contextIsolation` / `sandbox` / `nodeIntegration` Are Not Explicitly Set
These rely on Electron defaults, which have changed across major versions. They should be explicitly declared in every `BrowserWindow` `webPreferences` for clarity and forward-compatibility:

```typescript
webPreferences: {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  preload: getPreloadPath("ui"),
}
```

---

## Code Quality

### Dead Code
- `http-server.ts` — a stub class with no implementation, never imported. Delete it.
- `electron-constants.ts` — defines allow-list arrays that are never consumed (the actual allow-lists are hardcoded in `preload-display.cts` and passed directly in `main.ts`). Either use this file as the single source of truth, or delete it.

### DRY Violation: Allow-Lists Duplicated in Three Places
The display IPC channel allow-lists exist in `electron-constants.ts`, hardcoded in `preload-display.cts`, and as inline literals passed to `IpcWs` in `main.ts`. Only one source should exist and the others should import from it.

### Config Written on Every Keystroke
`AppState` calls `writeConfigFile()` on every config mutation with no debounce. For text inputs (font size, colors, margins) this triggers a disk write per keystroke. Add a debounce (~300ms).

### Unbounded `wsQueue` in `IpcWsClient.ts`
Messages sent before the WebSocket connection is open are queued with no size limit. If the connection never establishes, this grows without bound. Add a max queue size and a timeout.

### `FIXME` Comment on Window Close
`main.ts:724–727` has a commented-out block with a `FIXME: looks to do nothing` note — live elements are not cleared on quit. This is either a bug or cleanup that was abandoned mid-implementation.

---

## Minor Issues

| Location | Issue |
|---|---|
| `preload-display.cts` | Uses ES `import` syntax while `preload-ui.cts` uses `require()` — inconsistent within the same preload context |
| `IpcWs.ts` | `broadcastToWsClients` silently catches send errors with `console.error` but has no backpressure or retry |
| `AppState.ts` | No debouncing on `writeConfigFile` — synchronous-feeling API wrapping async I/O with no error propagation back to callers |
| `main.ts` | `Promise.allSettled` is used correctly for batch song loading, but error messages are concatenated with `\n` and shown in a single dialog — consider a scrollable list dialog for many errors |

---

## Summary

| Priority | Issue |
|---|---|
| Bug | `getConfigPath()` returns directory path in production |
| Bug | Broken template literals (`{id}` vs `${id}`) in error dialogs |
| Security | `local-file` Express route serves arbitrary filesystem paths |
| Security | `webPreferences` not explicitly hardened per window |
| Architecture | `main.ts` is a 748-line god file — needs decomposition |
| Architecture | Module-scope instantiation before `app.ready` |
| Architecture | `ipcMain.emit` is an undocumented internal API |
| Correctness | `ipcRendererOnS` missing incoming channel validation |
| Maintenance | Dead files: `http-server.ts`, `electron-constants.ts` |
| Performance | Config written to disk on every mutation without debounce |

Would you like me to plan out fixes for any specific subset of these — or all of them?

---

