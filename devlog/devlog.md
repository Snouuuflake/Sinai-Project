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


TMP: i need to -> make a dev test button to make sure that logo media actually gets set when changing config
               -> kill the unsafe protocol
               -> test logo with the new id implementation
               -> add background id's 
               -> but background id's are dynamic, maybe should implement a separate key:str - media map logo and backgrounds and undo the other thing
                  that would certainly be cleaner to add more fixed media in the future
                  then there would be two protocols
