import Body from "./Body";
import { DisplayConfigStateContextProvider } from "./DisplaySettingsContext";

const App: React.FC<{}> = ({ }) => {
  return <DisplayConfigStateContextProvider>
    <Body />
  </DisplayConfigStateContextProvider>
}

export default App;
