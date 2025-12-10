import { ThemeContextProvider } from "./ThemeContext";
import { ContextMenuContextProvider } from "./ContextMenuContext";
import { UIStateContextProvider } from "./UIStateContext";

import "./App.css";

import AppContainer from "./AppContainer";

function App() {
  return (
    <UIStateContextProvider>
      <ContextMenuContextProvider>
        <ThemeContextProvider>
          <AppContainer />
        </ThemeContextProvider>
      </ContextMenuContextProvider>
    </UIStateContextProvider>
  );
}

export default App;
