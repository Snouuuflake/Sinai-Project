import "./DisplayButton.css";
import { useContext } from "react";
import { GlobalContext } from "../../GlobalContext";

function makeIndexButtons(n: number) {
  return [...Array(n).keys()].map((element) => (
    <button
      key={`${element}`}
      className="index"
      onClick={() => {
        window.electron.sendNewDisplayWindow(element);
      }}
    >
      {element + 1}
    </button>
  ));
}

function DisplayButton() {
  const { MAX_LIVE_ELEMENTS } = useContext(GlobalContext) as GlobalContextType;
  return (
    <div className="new-display drop-down">
      <button className="top-section-button drop-down-btn">New Window</button>
      <div className="drop-down-content">
        <div className="index-title">Window ID:</div>
        <div className="index-container">
          {makeIndexButtons(MAX_LIVE_ELEMENTS)}
        </div>
      </div>
    </div>
  );
}

export default DisplayButton;
