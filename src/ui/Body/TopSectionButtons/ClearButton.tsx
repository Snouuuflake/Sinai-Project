import { useContext } from "react";
import { GlobalContext } from "../../GlobalContext";

function ClearButton() {
  const { MAX_LIVE_ELEMENTS, liveElements } = useContext(
    GlobalContext,
  ) as GlobalContextType;
  return (
    <button
      className="top-section-button"
      onClick={() => {
        liveElements.send(
          Array.from({ length: MAX_LIVE_ELEMENTS }, (_, i) => {
            return {
              index: i,
              liveElement: {
                type: "none",
                value: "",
                reference: {
                  object: null
                }
              },
            };
          }),
        );
      }}
    >
      Clear Displays
    </button>
  );
}

export default ClearButton;
