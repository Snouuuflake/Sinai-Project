import * as mc from "./src/shared/media-classes.js";

declare global {
  interface Window {
    electron: {
      onUIStateUpdateSetlist: (callback: (newValue: mc.SerializedMediaIdentifier[]) => void) => () => void;
      onUIStateUpdateOpenMedia: (callback: (newValue: mc.SerializedMediaWithId) => void) => () => void;
      onUIStateUpdateLiveElements: (callback: (newValue: Array<mc.LiveElementIdentifier | null>) => void) => () => void;
      sendUIStateRequest: () => void;
      sendNewDisplayWindow: (displayId: number) => void;
      sendSetOpenMedia: (id: number) => void;
      sendSetLiveElement: (displayIndex: number, liveElementIdentifier: mc.LiveElementIdentifier | null) => void;
      sendAddImages: () => void;
      sendMoveMedia: (id: number, index: number) => void;
      sendDeleteMedia: (id: number) => void;

      onDisplayStateUpdateLiveElement: (callback: (displayId: number, newValue: SerializedLiveElement | null) => void) => () => void;
    };
  }
}
