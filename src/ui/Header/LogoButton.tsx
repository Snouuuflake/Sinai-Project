import { useContextMenu } from "../ContextMenuContext";
import { DISPLAYS } from "../../shared/constants";
import { useUIState } from "../UIStateContext";

const LogoContextMenuEntry: React.FC<{ logo: boolean, index: number }> = ({ logo, index }) => {
  const { hideMenu } = useContextMenu();
  return <button>
    ${logo ? "Disable" : "Enable"} logo for window: {index + 1}
  </button>
}

const LogoContextMenu: React.FC<{}> = ({ }) => {
  const { hideMenu } = useContextMenu();
  const { logo } = useUIState();
  return <div
    className="context-menu-default-container"
    style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}
  >
    <button key="a" onClick={() => {
      logo.forEach((_x, i) => {
        window.electron.sendSetLogo(i, false);
        hideMenu();
      })
    }
    }>
      Remove logo from all displays
    </button>
    <hr style={{ width: "90%" }} />
    {logo.map((x, i) => {
      return <button
        key={i}
        onClick={
          () => {
            window.electron.sendSetLogo(i, !x);
            hideMenu();
          }
        }
      >
        {x ? "Remove logo from" : "Project logo to"} display: {i + 1}
      </button>
    })}
  </div>
}


const LogoButton: React.FC<{}> =
  ({ }) => {
    const { showMenu } = useContextMenu();
    const { logo } = useUIState();
    return (
      <button
        className={`header-button `}
        style={{
          borderWidth: "3px",
          borderStyle: "solid",
          borderColor: (logo.every(x => x)) ?
            "var(--hi-2)" :
            (logo.includes(true)) ?
              "color-mix(in oklch, var(--hi-1), transparent var(--blink-transparent-blend))"
              :
              ""


        }}
        onContextMenu={
          (e) => {
            showMenu(e, <LogoContextMenu />)
          }
        }
        onClick={(e) => {
          if (logo.every(x => x == false)) {
            logo.forEach((_x, i) => {
              window.electron.sendSetLogo(i, true);
            });
          } else if (logo.every(x => x)) {
            logo.forEach((_x, i) => {
              window.electron.sendSetLogo(i, false);
            });
          }
          else {
            showMenu(e, <LogoContextMenu />)
          }
        }}
      >
        Logo
      </button>
    )
  }

export default LogoButton;
