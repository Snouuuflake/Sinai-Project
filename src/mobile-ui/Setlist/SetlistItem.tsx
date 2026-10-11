import { useState, useRef } from "react"
import { SerializedMediaIdentifier } from "../../shared/media-classes"
import { useContextMenu } from "../ContextMenuContext";
import { useModal } from "../ModalContext";
import { useUIState } from "../UIStateContext";

import "./SetlistItem.css";
import { X } from "lucide-react";
import { CustomIPC } from "../IpcWsClient";



const SetlistItem: React.FC<{
  maxIdChars: number,
  item: SerializedMediaIdentifier
}> = ({ maxIdChars, item }) => {
  const { openMedia } = useUIState();
  return <button
    className="setlist-item"
    tabIndex={-1}
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
      style={{ color: item.id === (openMedia?.id) ? "var(--hi-2) !important" : "" }}
    >
      {item.name}
    </div>
  </button >
};

export default SetlistItem;
