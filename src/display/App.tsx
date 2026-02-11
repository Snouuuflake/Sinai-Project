import Body from "./Body";
import { DisplayConfigStateContextProvider } from "./DisplayConfigStateContext";

const App: React.FC<{}> = ({ }) => {
  return <DisplayConfigStateContextProvider>
    <Body />
  </DisplayConfigStateContextProvider>
}

export default App;
