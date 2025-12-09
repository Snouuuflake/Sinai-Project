import { useUIState } from "./UIStateContext";

import Header from "./Header/Header";
import Setlist from "./Setlist/Setlist";

const AppContainer: React.FC<{}> = ({ }) => {
  const uiState = useUIState();
  console.log(uiState);
  return <div className="app-container">
    <Header />
    <Setlist setlist={uiState?.setlist ?? null} />
  </div>
}

export default AppContainer;
