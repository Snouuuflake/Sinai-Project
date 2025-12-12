import { useState, useEffect } from "react";
import { SerializedLiveElement } from "../shared/media-classes";

import DisplayImage from "./DisplayImage";


const App: React.FC<{}> = ({ }) => {
  const params = new URLSearchParams(window.location.search);
  const DISPLAY_ID = parseInt(params.get('displayId') || '0');
  console.log("DISPLAY_ID", DISPLAY_ID);
  const [liveElement, setLiveElement] =
    useState<SerializedLiveElement | null>(null);

  useEffect(() => {
    const remover = window.electron.onDisplayStateUpdateLiveElement(
      (displayId, newValue) => {
        if (displayId === DISPLAY_ID) {
          console.log(newValue);
          setLiveElement(newValue);
        }
      }
    );
    return remover;
  }, []);

  return <div>
    {
      liveElement === null ?
        "null" :
        liveElement.type === "image" ?
          <DisplayImage liveElement={liveElement} /> : ""
    }
  </div>
}

export default App;
