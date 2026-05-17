import { useUIState } from "./UIStateContext";
import { DISPLAYS } from "../shared/constants";
import { CustomIPC } from "./IpcWsOnlyClient";
const AppContainer: React.FC<{}> = () => {
  const { logo } = useUIState();
  return (
    <div className="app-container">
      hello, world :3
      {
        Array.from({ length: DISPLAYS }, (_x, i) => {
          return <button
            onClick={
              () => CustomIPC.send("set-logo", i, !logo[i])
            }
            style={{
              color: logo[i] ? "red" : "blue"
            }}
          >
            logo {i + 1}
          </button>

        })
      }
    </div>
  )
}

export default AppContainer;
