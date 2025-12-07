import "./Body.css";
import ControlSection from "./ControlSection";
import OpenElementMenu from "./OpenElementMenu";
import TopSection from "./TopSection";
import DisplayControls from "./DisplayControls/DisplayControls";
import { GlobalContext } from "../GlobalContext";
import { useContext } from "react";

function Body() {
  const { bodyContent } = useContext(GlobalContext) as GlobalContextType;

  return (
    <div className="body">
      <TopSection />
      {bodyContent.value === "main" ? (
        <div className="main-container">
          <OpenElementMenu />
          <ControlSection />
        </div>
      ) : bodyContent.value === "display" ? (
      <DisplayControls />
      ) : (
        <></>
      )}
    </div>
  );
}

export default Body;
