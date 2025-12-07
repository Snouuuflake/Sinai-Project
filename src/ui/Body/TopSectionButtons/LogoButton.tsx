import { useContext } from "react";
import { GlobalContext } from "../../GlobalContext";

function LogoButton() {
  const { logoState } = useContext(
    GlobalContext,
  ) as GlobalContextType;
  return (
    <button
      className="top-section-button"
      style={{backgroundColor: logoState.value ? "var(--hi1)" : ""}}
      onClick={() => {
        logoState.set(!logoState.value);
      }}
    >
      Logo
    </button>
  );
}

export default LogoButton;
