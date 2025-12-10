import { memo } from "react"
import { SerializedMediaWithId } from "../../shared/media-classes"
import { useContextMenu } from "../ContextMenuContext";

import "./SetlistItem.css";

const SetlistItemMenu: React.FC<{ item: SerializedMediaWithId }> = ({ item }) => {
  return <div
    className="setlist-item-menu-container">
    <button className="setlist-item-menu-button">
      Move
    </button>
    <button className="setlist-item-menu-button">
      Delete
    </button>
  </div>
}

const SetlistItem: React.FC<{ maxIdChars: number, item: SerializedMediaWithId }> = ({ maxIdChars, item }) => {
  const { showMenu } = useContextMenu();
  return <button
    className="setlist-item"
    onContextMenu={(e) => {
      showMenu(e, <SetlistItemMenu item={item} />)
    }}>
    <div
      className="setlist-item-id-container"
      style={{ width: `${maxIdChars * 1.1}ch` }}
    >
      {item.id}
    </div>
    <div
      className="setlist-item-name-container"
    >
      {item.name}
    </div>
  </button>
};

export default SetlistItem;
