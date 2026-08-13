import { AppState } from "../AppState.js";
import { WindowManager } from "../WindowManager.js";

export class DisplayUpdaters {
  #windowManager: WindowManager;
  #appState: AppState;

  constructor(appState: AppState, windowManager: WindowManager) {
    this.#appState = appState;
    this.#windowManager = windowManager;
  }

  updateDisplayLiveElement(displayId: number) {
    this.#windowManager.sendToDisplayWindows(
      "display-state-update-live-elements",
      displayId,
      this.#appState.getDisplayStateLiveElement(displayId)
    );
  }

  updateDisplayLogo(displayId: number) {
    this.#windowManager.sendToDisplayWindows(
      "display-state-update-logo",
      displayId,
      this.#appState.getLogoEntry(displayId)
    )
  }
}

