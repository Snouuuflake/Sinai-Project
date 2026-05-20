import "./Header.css";
import logoLight from "./assets/logo-light.png";
import logoDark from "./assets/logo-dark.png"
import TTButton from "./TTButton";
import { CustomIPC } from "./IpcWsOnlyClient";
import { useUIState } from "./UIStateContext";
import { DISPLAYS } from "../shared/constants";
import { useModal } from "./ModalContext";

import "./Header.css";

import { SerializedMediaIdentifier } from "../shared/media-classes";
import { useEffect, useState } from "react";


const SetlistItem: React.FC<{ maxIdChars: number, item: SerializedMediaIdentifier }> = ({ maxIdChars, item }) => {
  const { openMedia } = useUIState();
  return <button
    className="setlist-item"
    onClick={
      () => {
        CustomIPC.send("set-open-media", item.id);
      }
    }
  >
    <div
      className="setlist-item-id-container"
      style={{ width: `${maxIdChars * 1.1}ch` }}
    >
      {item.id}
    </div>
    <div
      className="setlist-item-name-container"
      style={{ color: item.id === (openMedia?.id) ? "var(--hi-2)" : "" }}
    >
      {item.name}
    </div>
  </button >
};


const SetlistButtonModal: React.FC<{}> = () => {
  const { hideModal } = useModal();
  const { setlist } = useUIState();
  const maxIdChars = setlist?.map<number>(x => x.id.toString().length).reduce((p, c) => c > p ? c : p, 0) ?? 0
  return <div
    className="modal-main-container logo-button-modal"
  >
    <button
      className="modal-text-exit-button text-only-button"
      onClick={() => {
        hideModal();
      }}
    >
      Salir
    </button>
    <div className="setlist-items-container">
      {
        setlist?.map((x, i) => <SetlistItem key={i} maxIdChars={maxIdChars} item={x} />) ?? <>no setlist</>
      }
    </div>
  </div>

}
const SetlistButton: React.FC<{}> = () => {
  const { showModal } = useModal();
  return (
    <button
      className="setlist-button header-button"
      onClick={(e) => {
        showModal(e, <SetlistButtonModal />);
      }}
    >
      Medios
    </button>
  )
}

const LogoButtonModal: React.FC<{}> = () => {
  const { hideModal } = useModal();
  const { logo } = useUIState();
  return <div
    className="modal-main-container logo-button-modal"
  >
    <button
      className="modal-text-exit-button text-only-button"
      onClick={() => {
        hideModal();
      }}
    >
      Salir
    </button>
    <div className="logo-button-modal-display-buttons-container">
      {logo.map((x, i) => {
        return <button
          key={i}
          className="logo-button-modal-display-button"
          onClick={
            () => {
              CustomIPC.send("set-logo", i, !x);
            }
          }
          style={{
            backgroundColor: x ? "var(--hi-1)" : "var(--gray-80)",
          }}
        >
          {i + 1}
        </button>
      })}
    </div>
  </div>

}

const LogoButton: React.FC<{}> = () => {
  const { logo } = useUIState();
  const allTrue = logo.every(x => x);
  const allFalse = logo.every(x => !x);
  const someTrue = logo.some(x => x);
  const { showModal, hideModal } = useModal();
  return (
    <TTButton
      onConfirm={(event) => {
        if (allTrue) {
          for (let i = 0; i < DISPLAYS; i++) {
            CustomIPC.send("set-logo", i, false);
          }
        } else if (allFalse) {
          for (let i = 0; i < DISPLAYS; i++) {
            CustomIPC.send("set-logo", i, true);
          }
        } else {
          showModal(event, <LogoButtonModal />)
        }
      }}
      onTimeout={() => {
        showModal(null, <LogoButtonModal />);
      }}
      className="logo-button header-button"
      style={{
        borderWidth: "5px",
        borderStyle: "solid",
        borderColor: (allTrue) ?
          "var(--hi-2)" :
          (someTrue) ?
            "color-mix(in oklch, var(--hi-1), transparent var(--blink-transparent-blend))"
            :
            ""
      }}
    >
      Logo
    </TTButton>
  )
}

const WsIndicator: React.FC<{}> = () => {
  const [status, setStatus] = useState<number>(0);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const ws = CustomIPC.getWsVariable();
      if (ws === null) {
        setStatus(0); // Doesnt exist
      } else if (ws.readyState === WebSocket.OPEN) {
        setStatus(2); // Works
      } else {
        setStatus(1); // Connecting or disconnecting
      }
    }, 1000)
    return () => { clearTimeout(timeoutId); }
  })
  return (
    <div
      style={{
        height: "18px",
        width: "26px",
        borderRadius: "6px",
        backgroundColor: ["red", "yellow", "green"][status],
        display: "inline-block"
      }}
    >
    </div>
  )
}

const Header: React.FC<{}> = () => {
  return (
    <div
      className="header"
    >
      <img src={logoDark}
        className="logo"
      />
      <LogoButton />
      <SetlistButton />
      <div
        className="ws-status-container"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          opacity: "0.9",
          gridArea: "status"
        }}
      >
        <div
          style={{
            fontSize: "15px",
            fontFamily: "monospace",
          }}
        >
          Status
        </div>
        <WsIndicator />
      </div>
    </div>
  )

}

export default Header
