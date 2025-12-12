import { useContextMenu } from "../ContextMenuContext";
import { DISPLAYS } from "../../shared/constants";

const NewDisplayContextMenu: React.FC<{}> = ({ }) => {
  const { hideMenu } = useContextMenu();
  return <div
    className="context-menu-default-container"
    style={{ display: "flex", flexDirection: "column" }}
  >
    {Array.from({ length: DISPLAYS }, (_x, i) => {
      return <button
        onClick={
          () => {
            window.electron.sendNewDisplayWindow(i);
            hideMenu();
          }
        }
      >
        New window with id: {i + 1}
      </button>
    })}
  </div>
}


const NewDisplayWindowButton: React.FC<{}> =
  ({ }) => {
    const { showMenu } = useContextMenu();
    return (
      <button
        className="header-button"
        onClick={
          (e) => {
            showMenu(e, <NewDisplayContextMenu />)
          }
        }
      >
        New Display Window
      </button>
    )
  }

export default NewDisplayWindowButton;
