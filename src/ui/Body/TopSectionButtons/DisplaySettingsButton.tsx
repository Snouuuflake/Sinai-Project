import "./DisplayButton.css";
import { useContext } from "react";
import { GlobalContext } from "../../GlobalContext";

function DisplayButton() {
  const { bodyContent } = useContext(GlobalContext) as GlobalContextType;
  return (
    <button
      className="top-section-button"
      style={{
        backgroundColor: bodyContent.value === "display" ? "var(--hi1)" : "",
      }}
      onClick={() => {
        if (bodyContent.value === "main") {
          bodyContent.set("display");
        } else {
          bodyContent.set("main")
        }
      }}
    >
      Display Settings
    </button>
  );
}

export default DisplayButton;
