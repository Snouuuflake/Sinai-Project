import { useUIState } from "./UIStateContext";

import Header from "./Header/Header";
import Setlist from "./Setlist/Setlist";

const AppContainer: React.FC<{}> = ({ }) => {
  const uiState = useUIState();
  return <div className="app-container">
    <Header />
    <Setlist setlist={uiState?.setlist ?? null} />
    <div className="main-container"></div>
  </div>
}

export default AppContainer;
