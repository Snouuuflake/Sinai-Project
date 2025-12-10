import { createContext, useContext, useState, useEffect } from "react";
import { UIState, SerializedMediaWithId } from "../shared/media-classes";

type UIStateContextType = {
  setlist: SerializedMediaWithId[];
}

export const UIStateContext = createContext<UIStateContextType | null>(null);

export const UIStateContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [setlist, setSetlist] = useState<SerializedMediaWithId[]>([]);

  useEffect(() => {
    const remover = window.electron.onUIStateUpdateSetlist(
      (newValue: SerializedMediaWithId[]) => { setSetlist(newValue); }
    );
    window.electron.sendUIStateRequest();
    return remover;
  }, [])

  return <UIStateContext.Provider value={{ setlist }}>
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
