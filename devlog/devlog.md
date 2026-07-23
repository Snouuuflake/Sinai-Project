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
