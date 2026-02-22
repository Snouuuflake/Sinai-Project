import * as mc from "./src/shared/media-classes.js";
import * as cc from "./src/shared/config-classes.js";

declare global {
  interface Window {
    electron: {
      onUIStateUpdateSetlist: (callback: (newValue: mc.SerializedMediaIdentifier[]) => void) => () => void;
      onUIStateUpdateOpenMedia: (callback: (newValue: mc.SerializedMediaWithId) => void) => () => void;
      onUIStateUpdateLiveElements: (callback: (newValue: Array<mc.LiveElementIdentifier | null>) => void) => () => void;
      onUIStateUpdateLogo: (callback: (newValue: Array<boolean>) => void) => () => void;
      sendUIStateRequest: () => void;

      onUIUpdateDisplayConfig: (callback: (newValue: cc.SerializedDisplayConfigEntry[]) => void) => () => void;
      sendUIDisplayConfigRequest: () => void;
      sendUISetDisplayConfigEntry: (id: string, displayId: number, value: any) => void;
      sendUIResetDisplayConfigEntry: (id: string, displayId: number) => void;
      sendDisplayConfigInputPath: (id: string, displayId: number) => void;

      onUIUpdateGeneralConfig: (callback: (newValue: cc.SerializedGeneralConfigEntry[]) => void) => () => void;
      sendUIGeneralConfigRequest: () => void;
      sendUISetGeneralConfigEntry: (id: string, value: any) => void;
      sendUIResetGeneralConfigEntry: (id: string) => void;
      sendGeneralConfigInputPath: (id: string) => void;

      sendUIOpenDevTools: () => void;

      sendNewDisplayWindow: (displayId: number) => void;
      sendSetOpenMedia: (id: number) => void;
      sendSetLiveElement: (displayId: number, liveElementIdentifier: mc.LiveElementIdentifier | null) => void;
      sendSetLogo: (displayId: number, logo: boolean) => void;
      sendAddImages: () => void;
      sendAddSongs: () => void;
      sendMoveMedia: (id: number, displayId: number) => void;
      sendDeleteMedia: (id: number) => void;
      sendCreateSong: (title: string, author: string) => void;
      sendReplaceSong: (id: number, song: Song) => void;
      sendSaveSong: (id: number) => void;

      onDisplayStateUpdateLiveElement: (callback: (displayId: number, newValue: SerializedLiveElement | null) => void) => () => void;
      onDisplayUpdateDisplayConfig: (callback: (newValue: cc.SerializedDisplayConfigEntry[]) => void) => () => void;
      onDisplayStateUpdateLogo: (callback: (displayId: number, newValue: boolean) => void) => () => void;

      invokeDisplayGetInitLiveState: (displayId: number) => Promise<SerializedLiveState>;


      sendAlert: (message: string) => void;
    };
  }
}
