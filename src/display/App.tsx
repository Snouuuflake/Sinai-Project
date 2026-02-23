import { useEffect } from "react";
import Body from "./Body";
import { DisplayConfigStateContextProvider } from "./DisplayConfigStateContext";

const App: React.FC<{}> = ({ }) => {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "f") {
        window.document.documentElement.requestFullscreen();
      }
    };
    window.addEventListener("keydown", listener)
    return () => {
      window.removeEventListener("keydown", listener);
    }
  }, [])
  return <DisplayConfigStateContextProvider>
    <Body />
  </DisplayConfigStateContextProvider>
}

export default App;
