import { createContext, useContext, useState, useEffect } from "react";
import { DISPLAYS } from "../shared/constants";
import {
  SerializedMediaIdentifier,
  SerializedMediaWithId,
  LiveElementIdentifier,
  SerializedConfigEntry,
} from "../shared/media-classes";

type UIStateContextType = {
  setlist: SerializedMediaIdentifier[];
  openMedia: SerializedMediaWithId | null;
  liveElements: Array<LiveElementIdentifier | null>;
  config: SerializedConfigEntry[];
}


export const UIStateContext = createContext<UIStateContextType | null>(null);

export const UIStateContextProvider:
  React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [setlist, setSetlist] = useState<SerializedMediaIdentifier[]>([]);
    const [openMedia, setOpenMedia] = useState<SerializedMediaWithId | null>(null);
    const [liveElements, setLiveElements] = useState<
      Array<LiveElementIdentifier | null>
    >(Array.from({ length: DISPLAYS }, (_x) => null));
    const [config, setConfig] = useState<SerializedConfigEntry[]>([]);


    useEffect(() => {
      const remover = window.electron.onUIStateUpdateSetlist(
        (newValue: SerializedMediaIdentifier[]) => { setSetlist(newValue); }
      );
      return remover;
    }, [])

    useEffect(() => {
      const remover = window.electron.onUIStateUpdateOpenMedia(
        (newValue: SerializedMediaWithId) => { setOpenMedia(newValue); }
      );
      return remover;
    }, [])

    useEffect(() => {
      const remover = window.electron.onUIStateUpdateLiveElements(
        (newValue: Array<LiveElementIdentifier | null>) => { setLiveElements(newValue) }
      );
      return remover;
    }, [])

    useEffect(() => {
      const remover = window.electron.onUIStateUpdateConfig(
        (newValue: SerializedConfigEntry[]) => { setConfig(newValue) }
      );
      return remover;
    }, [])

    useEffect(() => {
      window.electron.sendUIStateRequest();
    }, [])

    return <UIStateContext.Provider
      value={{ setlist, openMedia, liveElements, config }}>
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
