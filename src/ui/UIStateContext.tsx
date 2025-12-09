import { createContext, useContext, useState, useEffect } from "react";
import { UIState } from "../shared/media-classes";


export const UIStateContext = createContext<UIState | null>(null);

export const UIStateContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uiState, setUIState] = useState<UIState | null>(null);
  useEffect(() => {
    const remover = window.electron.onUIStateUpdate((state: UIState) => { setUIState(state); });
    window.electron.sendUIStateRequest();
    return remover;
  }, [])
  useEffect(() => (console.log(1, uiState)), [uiState]);

  return <UIStateContext.Provider value={uiState}>
    {children}
  </UIStateContext.Provider >
};

export const useUIState = () => {
  return useContext(UIStateContext);
}
