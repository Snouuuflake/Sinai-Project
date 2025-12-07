import { useContext } from "react";
import { GlobalContext } from "../../GlobalContext";

function OpenFileButton() {
  const { MAX_LIVE_ELEMENTS } = useContext(GlobalContext) as GlobalContextType;
  const { openElements } = useContext(GlobalContext) as GlobalContextType;
  return (
    <button className="top-section-button"
      onClick={() => {
        window.electron.invokeReadElement((newElement: OpenElementType) => {
          if (newElement.type === "song") {
            // INFO: super important because ipc doesnt preserve references
            newElement.selected.object = newElement.song; 
          }
          openElements.set([...openElements.value, newElement]);
        });
      }}
    >Open File</button>
  );
}

export default OpenFileButton;
