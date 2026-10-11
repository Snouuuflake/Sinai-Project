import { useContextMenu } from "../ContextMenuContext";
import { DISPLAYS } from "../../shared/constants";
import { useUIState } from "../UIStateContext";
import { useModal } from "../ModalContext";
import LTButton from "../LTButton";
import { CustomIPC } from "../IpcWsClient";
import { X } from "lucide-react";

const LogoContextMenu: React.FC<{}> = ({ }) => {
  const { hideMenu } = useContextMenu();
  const { logo } = useUIState();
  return <div
    className="context-menu-default-container"
  >
    <button
      key="a"
      className="text-button"
      onClick={() => {
        logo.forEach((_x, i) => {
          CustomIPC.send("set-logo", i, false);
          hideMenu();
        })
      }
      }>
      Ocultar logo en todo display
    </button>
    {logo.map((x, i) => {
      return <button
        className="text-button"
        key={i}
        onClick={
          () => {
            CustomIPC.send("set-logo", i, !x);
            hideMenu();
          }
        }
      >
        {x ? "Ocultar logo en" : "Mostrar logo en"} display: {i + 1}
      </button>
    })}
  </div>
}

const LogoButtonModal: React.FC<{}> = () => {
  const { logo } = useUIState();
  const { hideModal } = useModal();
  return (
    <div className="modal-container">
      <div className="main-container-header">
        <div className="main-container-header-buttons-container">
          <button
            className="modal-exit-button hi-1-button"
            onClick={(_e) => hideModal()}
          >
            <X size={32} />
          </button>
        </div>
      </div>
      <div className="display-buttons-container" tabIndex={-1}>
        {
          logo.map((x, i) => (<button
            style={{
              backgroundColor: x ? "var(--hi-1)" : "var(--gray-80)",
            }}
            onClick={() => {
              CustomIPC.send("set-logo", i, !x);
            }}
          >
            {i + 1}
          </button>
          ))
        }
      </div>
    </div>
  )
}


const LogoButton: React.FC<{}> =
  ({ }) => {
    const { showModal } = useModal();
    const { logo } = useUIState();
    return (
      <LTButton
        className={`header-button `}
        style={{
          borderWidth: "2px",
          borderStyle: "solid",
          borderColor: (logo.every(x => x)) ?
            "var(--hi-2)" :
            (logo.includes(true)) ?
              "color-mix(in oklch, var(--hi-1), transparent var(--blink-transparent-blend))"
              :
              "var(--gray-60)"


        }}
        onTimeout={
          () => {
            showModal(<LogoButtonModal />)
          }
        }
        onEarly={() => {
          if (logo.every(x => x == false)) {
            logo.forEach((_x, i) => {
              CustomIPC.send("set-logo", i, true);
            });
          } else if (logo.every(x => x)) {
            logo.forEach((_x, i) => {
              CustomIPC.send("set-logo", i, false);
            });
          }
          else {
            showModal(<LogoButtonModal />)
          }
        }}
      >
        Logo
      </LTButton>
    )
  }

export default LogoButton;
