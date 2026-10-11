import { createContext, useContext, useState, useEffect } from "react";
import { DISPLAYS } from "../shared/constants";
import {
  SerializedMediaIdentifier,
  SerializedMediaWithId,
  LiveElementIdentifier,
} from "../shared/media-classes";
import { CustomIPC } from "./IpcWsClient";

type UIStateContextType = {
  setlist: SerializedMediaIdentifier[];
  openMedia: SerializedMediaWithId | null;
  liveElements: Array<LiveElementIdentifier | null>;
  selectedLiveElementId: number | null;
  logo: boolean[];
}


export const UIStateContext = createContext<UIStateContextType | null>(null);

export const UIStateContextProvider:
  React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [setlist, setSetlist] = useState<SerializedMediaIdentifier[]>([]);
    const [openMedia, setOpenMedia] = useState<SerializedMediaWithId | null>(null);
    const [selectedLiveElementId, setSelectedLiveElementId] = useState<number | null>(null);
    const [liveElements, setLiveElements] = useState<
      Array<LiveElementIdentifier | null>
    >(Array.from({ length: DISPLAYS }, (_x) => null));

    const [logo, setLogo] = useState<boolean[]>(Array.from({ length: DISPLAYS }, (_x) => false));

    useEffect(() => {
      const remover = CustomIPC.on("ui-state-update-setlist",
        (newValue: SerializedMediaIdentifier[]) => { setSetlist(newValue); }
      );
      return remover;
    }, [])

    useEffect(() => {
      const remover = CustomIPC.on("ui-state-update-open-media",
        (newValue: SerializedMediaWithId) => { setOpenMedia(newValue); }
      );
      return remover;
    }, [])

    useEffect(() => {
      const remover = CustomIPC.on("ui-state-update-selected-live-element-id",
        (newValue: number | null) => { setSelectedLiveElementId(newValue); }
      );
      return remover;
    }, [])

    useEffect(() => {
      const remover = CustomIPC.on("ui-state-update-live-elements",
        (newValue: Array<LiveElementIdentifier | null>) => { setLiveElements(newValue) }
      );
      return remover;
    }, [])

    useEffect(() => {
      const remover = CustomIPC.on("ui-state-update-logo",
        (newValue: Array<boolean>) => { setLogo(newValue) }
      );
      return remover;
    }, [])

    useEffect(() => {
      CustomIPC.send("ui-state-request")
    }, [])

    return <UIStateContext.Provider
      value={{ setlist, openMedia, selectedLiveElementId, liveElements, logo }}>
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
