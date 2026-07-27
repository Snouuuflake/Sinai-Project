import { Media, MediaImage } from "../shared/media-classes.js";
import { AppState, MainDisplayConfigEntry, MainGeneralConfigEntry } from "./AppState.js";
import path from "path";

function addConfigEntries(appState: AppState) {
  //   general
  appState.addDcEntry(new MainDisplayConfigEntry("background-color", "hexcolor", "#000000"));
  appState.addDcEntry(new MainDisplayConfigEntry("background-image", "path", ""))

  appState.addDcEntry(new MainDisplayConfigEntry("transition-duration", "nnumber", 300));

  appState.addDcEntry(new MainDisplayConfigEntry("logo-path", "path", ""));

  appState.addDcCallback(
    "logo-path",
    (newValue) => {
      (newValue as string[]).forEach(
        (v, i) => {
          console.log(`dcCalback for "logo-path" setting "logo-media-${i}" with ${v}`);
          appState.setExtraMedia(
            `logo-media-${i}`,
            new MediaImage(
              path.basename(v),
              v
            )
          )
        }
      )
    }
  );

  appState.addDcEntry(new MainDisplayConfigEntry("logo-size", "nnumber", 50));

  //   text
  appState.addDcEntry(new MainDisplayConfigEntry("font-size", "nnumber", 30));
  appState.addDcEntry(new MainDisplayConfigEntry("font", "string", ""));
  appState.addDcEntry(new MainDisplayConfigEntry("bold", "boolean", false));
  appState.addDcEntry(new MainDisplayConfigEntry("text-color", "hexcolor", "#FFFFFF"));
  appState.addDcEntry(new MainDisplayConfigEntry("text-outline-width", "nnumber", 0));
  appState.addDcEntry(new MainDisplayConfigEntry("text-outline-color", "hexcolor", "#000000"));

  appState.addDcEntry(new MainDisplayConfigEntry("text-margin-top", "nnumber", 0));
  appState.addDcEntry(new MainDisplayConfigEntry("text-margin-bottom", "nnumber", 0));
  appState.addDcEntry(new MainDisplayConfigEntry("text-margin-left", "nnumber", 0));
  appState.addDcEntry(new MainDisplayConfigEntry("text-margin-right", "nnumber", 0));

  appState.addDcEntry(new MainDisplayConfigEntry("text-background-color", "hexcolor", "#00000000"));

  // gc
  appState.addGcEntry(new MainGeneralConfigEntry("dark-theme", "boolean", false));
}

export { addConfigEntries };
