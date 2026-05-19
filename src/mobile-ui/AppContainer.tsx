import { DISPLAYS } from "../shared/constants";
import { CustomIPC } from "./IpcWsOnlyClient";
import { useUIState } from "./UIStateContext";
import Header from "./Header";
import Controls from "./Controls";

import "./AppContainer.css"

const AppContainer: React.FC<{}> = () => {
  const { logo } = useUIState();
  return (
    <div className="app-container">
      <Header />
      <Controls />
    </div>
  )
}

export default AppContainer;
