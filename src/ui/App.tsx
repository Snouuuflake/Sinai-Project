import { ThemeContextProvider } from "./ThemeContext";
import { ContextMenuContextProvider } from "./ContextMenuContext";
import { UIStateContextProvider } from "./UIStateContext";
import { ModalContextProvider } from "./ModalContext";

import "./App.css";

import AppContainer from "./AppContainer";

function App() {
  return (
    <UIStateContextProvider>
      <ModalContextProvider>
        <ContextMenuContextProvider>
          <ThemeContextProvider>
            <AppContainer />
          </ThemeContextProvider>
        </ContextMenuContextProvider>
      </ModalContextProvider>
    </UIStateContextProvider>
  );
}

export default App;
