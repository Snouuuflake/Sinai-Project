import { useEffect, useRef, useState } from "react";
import { useDisplayConfigState } from "./DisplayConfigStateContext";
import { SerializedLiveElement } from "../shared/media-classes";
import DisplayText from "./DisplayText";
import DisplayImage from "./DisplayImage";

const Body: React.FC<{}> = () => {
  const { DISPLAY_ID, configHash } = useDisplayConfigState();
  const [liveElement, setLiveElement] = useState<SerializedLiveElement | null>(null);
  const hasRequestedLiveState = useRef<boolean>(false);


  useEffect(() => {
    const remover = window.electron.onDisplayStateUpdateLiveElement(
      (displayId, newValue) => {
        if (displayId === DISPLAY_ID) {
          console.log(newValue);
          setLiveElement(newValue);
        }
      }
    );
    if (!hasRequestedLiveState.current)
      window.electron.invokeDisplayGetInitLiveElement(DISPLAY_ID).then(le => {
        hasRequestedLiveState.current = true;
        console.log(le);
        setLiveElement(le);
      })
    return remover;
  }, []);

  return <div className="body" style={{
    backgroundColor: configHash.get("background-color") as string,
    backgroundImage: `url("localfile:///${(configHash.get("background-image") as string).replaceAll("\\", "/")}")`
  }}>

    {/* {[...configHash].map(([k, v]) => { */}
    {/*   return <div> */}
    {/*     {k}: {JSON.stringify(v)} */}
    {/*   </div> */}
    {/* })} */}

    {
      liveElement === null ?
        <></> :
        liveElement.type === "text" ?
          <DisplayText liveElement={liveElement} /> :
          liveElement.type === "image" ?
            <DisplayImage liveElement={liveElement} /> :
            <></>
    }

  </div>

};

export default Body;
