import { useEffect, useRef, useState } from "react";
import { useDisplayConfigState } from "./DisplayConfigStateContext";
import { SerializedLiveElement } from "../shared/media-classes";
import DisplayText from "./DisplayText";
import DisplayImage from "./DisplayImage";
import { formatSrcPath } from "./util";
import { CustomIPC } from "../shared/IpcWsClient";
import { isElectron } from "../shared/isElectron";

export function extraMediaUrl(id: string): string {
  if (isElectron()) {
    return `fetch-extra-media://${id}?t=${Date.now()}`;
  }
  return `${window.location.origin}/fetch-extra-media/${encodeURIComponent(id)}?t=${Date.now()}`;
}

const Logo: React.FC<{ logoIsVisible: boolean }> = ({ logoIsVisible }) => {
  const { DISPLAY_ID, configHash } = useDisplayConfigState();
  const logoHasBeenVisible = useRef<boolean>(logoIsVisible);

  if (logoIsVisible)
    logoHasBeenVisible.current = true;

  const logoPath = configHash.get("logo-path") as string;

  return <div
    className={`display-logo display-element-container ${logoIsVisible ? "logo-animation-in" : "logo-animation-out"}`}
  >
    <img className="logo-img"
      style={{
        height: `${configHash.get("logo-size") as number}vh`,
        opacity: logoHasBeenVisible.current && logoPath !== "" ? "100%" : "0", // "/" for avoiding error icon on empty src
      }}
      src={extraMediaUrl(`logo-media-${DISPLAY_ID}`)} />
  </div>
}

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
  const [prevLiveElement, setPrevLiveElement] = useState<SerializedLiveElement | null>(null);
  const hasRequestedLiveState = useRef<boolean>(false);

  const [logoIsVisible, setLogoIsVisible] = useState<boolean>(false);

  const curLiveElementRef = useRef<SerializedLiveElement | null>(null);


  useEffect(() => {
    // const remover = (window as unknown as UIWindow).electron.onDisplayStateUpdateLiveElement(
    const remover = CustomIPC.on("display-state-update-live-elements",
      (displayId, newValue) => {
        console.log("set curLiveElement", newValue);
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
      // (window as unknown as UIWindow).electron.invokeDisplayGetInitLiveState(DISPLAY_ID).then(le => {
      CustomIPC.invoke("invoke-display-get-init-live-state", DISPLAY_ID).then(le => {
        hasRequestedLiveState.current = true;
        curLiveElementRef.current = le.liveElement;
        setCurLiveElement(le.liveElement);
        setLogoIsVisible(le.logo);
      })
    return remover;
  }, []);
  useEffect(() => {
    // const remover = (window as unknown as UIWindow).electron.onDisplayStateUpdateLogo(
    const remover = CustomIPC.on("display-state-update-logo",
      (displayId, logo) => {
        if (displayId === DISPLAY_ID)
          setLogoIsVisible(logo);
      }
    );
    return remover;
  }, [])


  return <div className="body" style={{
    backgroundColor: configHash.get("background-color") as string,
    backgroundImage: `url("local-file://${formatSrcPath(configHash.get("background-image") as string)}")`
  }}>
    <style>
      {
        `
:root {
--transition-duration: ${configHash.get("transition-duration") as number}ms;
}
.animation-in {
animation-name: fade-in;
}
.animation-out {
animation-name: fade-out;
}
`
      }
    </style>
    <Logo logoIsVisible={logoIsVisible} />
    <div
      className={`live-elements-container ${logoIsVisible ? "animation-out" : "animation-in"}`}
    >
      <LiveElement key={JSON.stringify(curLiveElement) + "cur"} liveElement={curLiveElement} className={"animation-in"} />
      <LiveElement key={JSON.stringify(prevLiveElement) + "prev"} liveElement={prevLiveElement} className="animation-out" />
    </div>
  </div>

};

export default Body;
