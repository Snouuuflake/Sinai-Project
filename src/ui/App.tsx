import { ThemeContextProvider } from "./ThemeContext";
import { ContextMenuContextProvider } from "./ContextMenuContext";
import { UIStateContextProvider } from "./UIStateContext";
import { ModalContextProvider } from "./ModalContext";

import "./App.css";

import AppContainer from "./AppContainer";
import { ConfigStateContextProvider } from "./ConfigStateContext";

function App() {
  return (

    <ConfigStateContextProvider>
      <UIStateContextProvider>
        <ModalContextProvider>
          <ContextMenuContextProvider>
            <ThemeContextProvider>
              <AppContainer />
            </ThemeContextProvider>
          </ContextMenuContextProvider>
        </ModalContextProvider>
      </UIStateContextProvider>
    </ConfigStateContextProvider>
  );
}

export default App;
