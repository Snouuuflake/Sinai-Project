import { useUIState } from "./UIStateContext";

import Header from "./Header/Header";
import Setlist from "./Setlist/Setlist";
import MainControls from "./MainControls/MainControls";

const AppContainer: React.FC<{}> = ({ }) => {
  const uiState = useUIState();
  return <div className="app-container">
    <Header />
    <MainControls openMedia={uiState.openMedia} />
  </div>
}

export default AppContainer;
