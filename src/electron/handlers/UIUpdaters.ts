import { AppState } from "../AppState.js";
import { WindowManager } from "../WindowManager.js";

export class UIUpdaters {
  #windowManager: WindowManager;
  #appState: AppState;

  constructor(appState: AppState, windowManager: WindowManager) {
    this.#appState = appState;
    this.#windowManager = windowManager;
  }

  updateUISetlist() {
    this.#windowManager.sendToUIWindow("ui-state-update-setlist", this.#appState.getUIStateSetlist());
  }

  updateUIOpenMedia() {
    this.#windowManager.sendToUIWindow("ui-state-update-open-media", this.#appState.getUIStateOpenMedia());
  }

  updateUILiveElements() {
    this.#windowManager.sendToUIWindow("ui-state-update-live-elements", this.#appState.getUIStateLiveElements());
  }

  updateUILogo() {
    this.#windowManager.sendToUIWindow("ui-state-update-logo", this.#appState.getLogo());
  }

  updateAllUI() {
    this.updateUISetlist();
    this.updateUIOpenMedia();
    this.updateUILiveElements();
    this.updateUILogo();
  }
}

