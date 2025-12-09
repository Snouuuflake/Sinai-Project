import { memo } from "react"
import { SerializedMediaWithId } from "../../shared/media-classes"

import "./SetlistItem.css";

const SetlistItem = memo<{ maxIdChars: number, item: SerializedMediaWithId }>(({ maxIdChars, item }) => {
  return <button className="setlist-item">
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
})

export default SetlistItem;
