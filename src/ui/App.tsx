import "./App.css";
import Body from "./Body/Body";
import  InlineEditor from "./Editor/InlineEditor";
import GlobalContextProvider from "./GlobalContext";

function App() {
  return (
    <GlobalContextProvider>
    {/*<InlineEditor />*/}
      <Body></Body>
    </GlobalContextProvider>
  );
}

export default App;
