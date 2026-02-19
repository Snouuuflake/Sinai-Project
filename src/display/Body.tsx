import { useEffect, useRef, useState } from "react";
import { useDisplayConfigState } from "./DisplayConfigStateContext";
import { SerializedLiveElement } from "../shared/media-classes";
import DisplayText from "./DisplayText";
import DisplayImage from "./DisplayImage";

const LiveElement: React.FC<{
  liveElement: SerializedLiveElement | null
  className: string,
}> = ({
  liveElement,
  className
}) => {
    return liveElement === null ?
      <></> :
      liveElement.type === "text" ?
        <DisplayText liveElement={liveElement} className={className} /> :
        liveElement.type === "image" ?
          <DisplayImage liveElement={liveElement} className={className} /> :
          <></>
  }

const Body: React.FC<{}> = () => {
  const { DISPLAY_ID, configHash } = useDisplayConfigState();
  const [curLiveElement, setCurLiveElement] = useState<SerializedLiveElement | null>(null);
  const hasRequestedLiveState = useRef<boolean>(false);

  const curLiveElementRef = useRef<SerializedLiveElement | null>(null);

  const [prevLiveElement, setPrevLiveElement] = useState<SerializedLiveElement | null>(null);

  useEffect(() => {
    const remover = window.electron.onDisplayStateUpdateLiveElement(
      (displayId, newValue) => {
        if (displayId === DISPLAY_ID) {
          setCurLiveElement(prevValue => {
            if (
              JSON.stringify(curLiveElementRef.current) !==
              JSON.stringify(newValue)
            )
              setPrevLiveElement(prevValue);
            curLiveElementRef.current = newValue;
            return newValue
          });
        }
      }
    );
    if (!hasRequestedLiveState.current)
      window.electron.invokeDisplayGetInitLiveElement(DISPLAY_ID).then(le => {
        hasRequestedLiveState.current = true;
        curLiveElementRef.current = le;
        setCurLiveElement(le);
      })
    return remover;
  }, []);
  useEffect(() => {
  }, [curLiveElement])

  return <div className="body" style={{
    backgroundColor: configHash.get("background-color") as string,
    backgroundImage: `url("localfile:///${(configHash.get("background-image") as string).replaceAll("\\", "/")}")`
  }}>
    <LiveElement key={JSON.stringify(curLiveElement) + "cur"} liveElement={curLiveElement} className="animation-fade-in" />
    <LiveElement key={JSON.stringify(prevLiveElement) + "prev"} liveElement={prevLiveElement} className="animation-fade-out" />
  </div>

};

export default Body;
