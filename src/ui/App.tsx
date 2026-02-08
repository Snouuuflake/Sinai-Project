import { ThemeContextProvider } from "./ThemeContext";
import { ContextMenuContextProvider } from "./ContextMenuContext";
import { UIStateContextProvider } from "./UIStateContext";
import { ModalContextProvider } from "./ModalContext";

import "./App.css";

import AppContainer from "./AppContainer";
import { UIDisplayConfigStateContextProvider } from "./UIDisplayConfigStateContext";

function App() {
  return (

    <UIDisplayConfigStateContextProvider>
      <UIStateContextProvider>
        <ModalContextProvider>
          <ContextMenuContextProvider>
            <ThemeContextProvider>
              <AppContainer />
            </ThemeContextProvider>
          </ContextMenuContextProvider>
        </ModalContextProvider>
      </UIStateContextProvider>
    </UIDisplayConfigStateContextProvider>
  );
}

export default App;
