import AppContainer from "./AppContainer";
import "./App.css"
import { ContextMenuContextProvider } from "./ContextMenuContext";
import { ModalContextProvider } from "./ModalContext";
import { UIStateContextProvider } from "./UIStateContext";

const App: React.FC<{}> = ({ }) => {
  return (
    <>
      <UIStateContextProvider>
        {/*   <TTButtonTimerContextProvider> */}
        <ContextMenuContextProvider>
          <ModalContextProvider>
            <AppContainer />
          </ModalContextProvider>
        </ContextMenuContextProvider>
        {/*   </TTButtonTimerContextProvider> */}
      </UIStateContextProvider>
    </>
  )
}

export default App;
