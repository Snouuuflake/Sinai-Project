import { SerializedMediaIdentifier } from "../../shared/media-classes";
import { useContextMenu } from "../ContextMenuContext";

import "./Setlist.css";

import SetlistItem from "./SetlistItem";

const SetlistPlusMenu: React.FC<{}> = ({ }) => {
  const { hideMenu } = useContextMenu();
  return <div className="context-menu-default-container">
    <button
      onClick={
        (e) => {
          window.electron.sendAddImages();
          hideMenu();
        }
      }>
      Add Images
    </button>
  </div>
}

const Setlist: React.FC<{ setlist: SerializedMediaIdentifier[] | null }> = ({ setlist }) => {
  const { showMenu } = useContextMenu();
  const maxIdChars = setlist?.map<number>(x => x.id.toString().length).reduce((p, c) => c > p ? c : p, 0) ?? 0
  return <div className="setlist main-container">
    <div className="main-container-header">
      <h1 className="main-container-title">Media</h1>
      <div className="main-container-header-buttons-container">
        <button
          className="setlist-header-plus-button hi-1-button"
          onClick={(e) => { showMenu(e, <SetlistPlusMenu />) }}
        >
          +
        </button>
      </div>
    </div>
    <div className="setlist-items-container">
      {setlist?.map((x, i) => <SetlistItem key={i} maxIdChars={maxIdChars} item={x} />) ?? <></>}
    </div>
  </div >
};

export default Setlist;
