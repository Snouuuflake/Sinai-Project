import { createContext, useContext, useEffect, useState } from "react";
import { DISPLAYS } from "../shared/constants";
import {
  SerializedMediaIdentifier,
  SerializedMediaWithId,
  LiveElementIdentifier,
} from "../shared/media-classes";

import { CustomIPC } from "./IpcWsOnlyClient";

type UIStateContextType = {
  setlist: SerializedMediaIdentifier[];
  openMedia: SerializedMediaWithId | null;
  liveElements: Array<LiveElementIdentifier | null>;
  logo: boolean[];
}

export const UIStateContext = createContext<UIStateContextType | null>(null);

export const UIStateContextProvider:
  React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [setlist, setSetlist] = useState<SerializedMediaIdentifier[]>([]);
    const [openMedia, setOpenMedia] = useState<SerializedMediaWithId | null>(null);
    const [liveElements, setLiveElements] = useState<
      Array<LiveElementIdentifier | null>
    >(Array.from({ length: DISPLAYS }, (_x) => null));

    const [logo, setLogo] = useState<boolean[]>(Array.from({ length: DISPLAYS }, (_x) => false));

    // useEffect(() => {
    //   const remover = (window as unknown as UIWindow).electron.onUIStateUpdateSetlist(
    //     (newValue: SerializedMediaIdentifier[]) => { setSetlist(newValue); }
    //   );
    //   return remover;
    // }, [])
    //
    // useEffect(() => {
    //   const remover = (window as unknown as UIWindow).electron.onUIStateUpdateOpenMedia(
    //     (newValue: SerializedMediaWithId) => { setOpenMedia(newValue); }
    //   );
    //   return remover;
    // }, [])
    //
    // useEffect(() => {
    //   const remover = (window as unknown as UIWindow).electron.onUIStateUpdateLiveElements(
    //     (newValue: Array<LiveElementIdentifier | null>) => { setLiveElements(newValue) }
    //   );
    //   return remover;
    // }, [])
    //
    // useEffect(() => {
    //   const remover = (window as unknown as UIWindow).electron.onUIStateUpdateLogo(
    //     (newValue: Array<boolean>) => { setLogo(newValue) }
    //   );
    //   return remover;
    // }, [])
    //

    useEffect(() => {
      const remover = CustomIPC.on("ui-state-update-logo", (newValue: Array<boolean>) => {
        console.log(newValue);
        setLogo(newValue);
      });
      return remover;
    })
    useEffect(() => {
      console.log("sending something")
      CustomIPC.send("ui-state-request")      // (window as unknown as UIWindow).electron.sendUIStateRequest();
    }, [])

    return <UIStateContext.Provider
      value={{ setlist, openMedia, liveElements, logo }}>
      {children}
    </UIStateContext.Provider >
  };

export const useUIState = () => {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error("used useUIState outside of UIStateContext");
  }
  return context;
}
