import AppContainer from "./AppContainer";
import { UIStateContextProvider } from "./UIStateContext";

const App: React.FC<{}> = ({ }) => {
  console.log("!!!!!!")
  return (
    <UIStateContextProvider>
      <AppContainer />
    </UIStateContextProvider>
  )
}

export default App;
