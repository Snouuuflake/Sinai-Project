import { ThemeContextProvider } from "./ThemeContext";
import { UIStateContextProvider, useUIState } from "./UIStateContext";

import "./App.css";

import AppContainer from "./AppContainer";

function App() {
  const uiState = useUIState();
  console.log(uiState);
  return (
    <UIStateContextProvider>
      <ThemeContextProvider>
        <AppContainer />
      </ThemeContextProvider>
    </UIStateContextProvider>
  );
}

export default App;
