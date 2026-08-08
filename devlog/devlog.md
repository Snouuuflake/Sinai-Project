# Devlog

## Jul 20 2026

I've decided to put more effort into structuring the application better, along with structuring it's development better.

Recording development more formally seems like a good way to make better note of what I learn and reflect better on the app's future.

Planned features / changes:
- [ ] Make this Devlog
- [ ] Clean up (modularize) the main electron file
- [ ] Re-do UI with better UI principles, make better base components
- [ ] Update UX for a faster workflow
- [ ] Re-do mobile UI from scratch

## Jul 20 2026

Cleaning the main Electron file, modularizing, adding dependency injection, is turning out to be kind of a nightmare, given the inter-dependence of things like the app state object, all the servers, and the async-ness of it all, which seems to beckon me to make 50 global variables.

## Jul 20 2026

I've managed to abstract / modularize the servers starting & stopping via the SeverManager class, which manages HTTP, Express, Websockets, and IPCWS, which will come in handy when I finally implement allowing the user to pick a port. (Since the previous implementation never cleanly shut down the servers, restarting the app would likely leave the user-defined port occupied.)

Adding config entries to AppState has also been moved to another file.

## Jul 22 2026

- Fixed the import from `electron-constants.js` in `preload-display.cts` by transpiling/bundling separately with esbuild. (Sandboxed mode didn't allow any imports.)

- Added debounce to AppState's operations that write to the config file using setTimeout

## Jul 23 2026

In order to do away with the horrible API that _fully exposes the filesystem_, I plan to reserve the first hundred media IDs, so that things like the logo, which aren't part of the setlist, can be accessed by the media ID API.
## Jul 25 2026

I am going to implement callbacks on AppState's general config updating methods.

## Jul 27 2026

I did away with the horrible, unsafe (full fs) access protocol in favor of storing all non-setlist media (logos, backgrounds) in a separate Map in AppState, and adding a protocol that let's clients request them only by their ID in that map.

Since the URl for, say, a logo is always the same, the client code detects changes to the background and logo paths in the config and changes a ?x= parameter in the URL, which is ignored by the server / main process, but causes Chromium to cache the response separately.

## Jul 28 2026

Users now must set a port manually.

ServerManager now schedules starts and stops in a promise chain to prevent bad memory usage. A start is called whenever the port field in the config is changed by the user (with 1s debouncing).

## Aug 08 26

There are now 6 HTTP GET endpoints:

- `/next-open-media`
- `/prev-open-media`
- `/next-selected-element`
- `/prev-selected-element`
- `/project-selected-element-to-all`
- `/toggle-logo-to-all`

which basically trigger ipcMain events via ipcMain.emit.

The idea is for this, along with the fixed port, to allow controling the app's basic functionality via Companion.

