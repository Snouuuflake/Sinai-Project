import "./Header.css";
import logoLight from "./assets/logo-light.png";
import logoDark from "./assets/logo-dark.png"
import TTButton from "./TTButton";
import { CustomIPC } from "./IpcWsOnlyClient";
import { useUIState } from "./UIStateContext";
import { DISPLAYS } from "../shared/constants";
import { useModal } from "./ModalContext";
import { useContextMenu } from "./ContextMenuContext";

import "./Header.css";

import { SerializedMediaIdentifier } from "../shared/media-classes";


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
  const { logo } = useUIState();
  const { showModal, hideModal } = useModal();
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
    </div>
  )

}

export default Header
