import AppContainer from "./AppContainer";
import { UIStateContextProvider } from "./UIStateContext";
import { TTButtonTimerContextProvider } from "./TTButtonTimerContext";
import { ContextMenuContextProvider } from "./ContextMenuContext";
import { ModalContextProvider } from "./ModalContext";

const App: React.FC<{}> = ({ }) => {
  console.log("!!!!!!")
  return (
    <UIStateContextProvider>
      <TTButtonTimerContextProvider>
        <ContextMenuContextProvider>
          <ModalContextProvider>
            <AppContainer />
          </ModalContextProvider>
        </ContextMenuContextProvider>
      </TTButtonTimerContextProvider>
    </UIStateContextProvider>
  )
}

export default App;
