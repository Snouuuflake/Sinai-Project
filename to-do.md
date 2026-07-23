# bugs-found
> priority, category, name

## branch: clean-electron

### ai electron suggestions

- [X] 2 *architecture* "`main.ts` is a God File" 
  At 748 lines, `main.ts` owns everything: IPC handlers, file I/O, dialog logic, window management, protocol registration, and app lifecycle. It should be decomposed:


- [X] 3 *architecture* State Instantiated Before `app.ready`
  `AppState`, `IpcWs`, `ServerManager`, and `addConfigEntries` / `readConfigFile` are all invoked at module scope, before `app.on("ready", main)`. Config reading works, but anything that touches `app.getAppPath()`, `dialog`, or other Electron APIs that require the app to be ready can fail silently here.

- [ ] 0 *architecture* `ipcMain.emit` is an Internal Hack
In `IpcWs.ts`, WebSocket messages are bridged into Electron via `ipcMain.emit(channel, {}, ...args)`. This is an undocumented internal API — it's fragile and may break across Electron major versions. Consider instead calling the registered handler functions directly (store them in a `Map` and invoke them, rather than re-emitting through `ipcMain`).

- [X] 1 *architecture* `hasConfirmedUiWindowClose` is a Module-Level Flag
  This `let` boolean in `main.ts` would misbehave if the UI window were ever closed and reopened. It belongs as instance state on a `WindowManager` class.


- [X] 3 *bugs* "`getConfigPath()` Returns a Directory in Production"
  `pathResolver.ts` returns `path.join(process.resourcesPath, "extraResources")` in production — a directory, not a file. All `fs.writeFile(getConfigPath(), ...)` calls will fail at runtime in packaged builds.

- [X] 3 *bugs* "Broken Template Literals in Error Messages"
  Multiple error strings use `{id}` / `{media.name}` instead of `${id}` / `${media.name}`. Users see literal `{id}` in error dialogs rather than the actual value. Search `main.ts` for `"{` to find all occurrences.

- [ ] 0 *bugs* "`ipcRendererOnS` Has No Channel Allow-List" *i don't think there's anything dangerous to listen to*
  `preload-display.cts` validates outgoing channels but not incoming `on` subscriptions. The display renderer can listen on any arbitrary channel name.

- [ ] 9 *security* "Unguarded `local-file` Express Route"
  `express.ts` serves any local file path via `GET /local-file/:path` with no validation:
  ```typescript
  res.sendFile(decodeURIComponent(req.params.path))
  ```
  Any browser client connected over WebSocket can read arbitrary files from the filesystem. Add a path allowlist or restrict to a specific base directory.

- [X] 3 *security* `contextIsolation` / `sandbox` / `nodeIntegration` Are Not Explicitly Set
  These rely on Electron defaults, which have changed across major versions. They should be explicitly declared in every `BrowserWindow` `webPreferences` for clarity and forward-compatibility:

  ```typescript
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    preload: getPreloadPath("ui"),
  }
  ```

- [ ] 3 *code quality* "Dead Code"
  - `http-server.ts` — a stub class with no implementation, never imported. Delete it.
  - `electron-constants.ts` — defines allow-list arrays that are never consumed (the actual allow-lists are hardcoded in `preload-display.cts` and passed directly in `main.ts`). Either use this file as the single source of truth, or delete it.

- [X] 1 *code quality* DRY Violation: Allow-Lists Duplicated in Three Places
  The display IPC channel allow-lists exist in `electron-constants.ts`, hardcoded in `preload-display.cts`, and as inline literals passed to `IpcWs` in `main.ts`. Only one source should exist and the others should import from it.

- [ ] 3 Config Written on Every Keystroke
  `AppState` calls `writeConfigFile()` on every config mutation with no debounce. For text inputs (font size, colors, margins) this triggers a disk write per keystroke. Add a debounce (~300ms).

- [ ] 0 *code quality* "Unbounded `wsQueue` in `IpcWsClient.ts`"
  Messages sent before the WebSocket connection is open are queued with no size limit. If the connection never establishes, this grows without bound. Add a max queue size and a timeout.
