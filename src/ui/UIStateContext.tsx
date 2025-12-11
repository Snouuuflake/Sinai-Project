import { createContext, useContext, useState, useEffect } from "react";
import {
  SerializedMediaIdentifier,
  SerializedMediaWithId,
  UIStateContextType
} from "../shared/media-classes";


export const UIStateContext = createContext<UIStateContextType | null>(null);

export const UIStateContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [setlist, setSetlist] = useState<SerializedMediaIdentifier[]>([]);
  const [openMedia, setOpenMedia] = useState<SerializedMediaWithId | null>(null);

  useEffect(() => {
    const remover = window.electron.onUIStateUpdateSetlist(
      (newValue: SerializedMediaIdentifier[]) => { setSetlist(newValue); }
    );
    window.electron.sendUIStateRequest();
    return remover;
  }, [])

  useEffect(() => {
    const remover = window.electron.onUIStateUpdateOpenMedia(
      (newValue: SerializedMediaWithId) => { setOpenMedia(newValue); }
    );
    window.electron.sendUIStateRequest();
    return remover;
  }, [])

  return <UIStateContext.Provider
    value={{ setlist, openMedia }}>
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
