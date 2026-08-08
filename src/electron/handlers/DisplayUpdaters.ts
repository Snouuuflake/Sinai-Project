import { AppState } from "../AppState.js";
import { WindowManager } from "../WindowManager.js";

export class DisplayUpdaters {
  #windowManager: WindowManager;
  #appState: AppState;

  constructor(appState: AppState, windowManager: WindowManager) {
    this.#appState = appState;
    this.#windowManager = windowManager;
  }

  updateDisplayLiveElement(displayIndex: number) {
    this.#windowManager.sendToDisplayWindows(
      "display-state-update-live-elements",
      displayIndex,
      this.#appState.getDisplayStateLiveElement(displayIndex)
    );
  }

  updateDisplayLogo(displayIndex: number) {
    this.#windowManager.sendToDisplayWindows(
      "display-state-update-logo",
      displayIndex,
      this.#appState.getLogoEntry(displayIndex)
    )
  }
}

