import { useState, useRef } from "react"
import { SerializedMediaWithId } from "../../shared/media-classes"
import { useContextMenu } from "../ContextMenuContext";
import { useModal } from "../ModalContext";
import { useUIState } from "../UIStateContext";

import "./SetlistItem.css";

const VSplitClickable:
  React.FC<{
    onHover: (half: number) => void,
    onClick: (half: number) => void,
    children: React.ReactNode
  }>
  = ({
    onHover,
    onClick,
    children
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [half, setHalf] = useState<0 | 1>(0);

    return <div
      ref={containerRef}
      onMouseMove={
        (e) => {
          if (!containerRef.current) return;
          const boundingRect = containerRef.current.getBoundingClientRect();
          let newHalf: 0 | 1 = 0;
          if (e.clientY > boundingRect.y + (boundingRect.height / 2)) {
            newHalf = 1;
          }
          onHover(newHalf);
          setHalf(newHalf);
        }
      }
      onClick={() => { onClick(half) }}
    >
      {children}
    </div>
  }

const MoveItemModal: React.FC<{ item: SerializedMediaWithId }> = ({ item }) => {
  type HoveredHalfType = {
    id: number;
    half: number;
  }
  const [hoveredHalf, setHoveredHalf] =
    useState<HoveredHalfType | null>(null);

  const { hideModal } = useModal();
  const { setlist } = useUIState();

  const maxIdChars = 4;

  return <div
    className="setlist-item-move-item-modal-container">
    <div className="main-container-header">
      <h1 className="main-container-title">
        Move <span className="setlist-item-move-item-modal-title-id">{item.id}</span> {item.name}
      </h1>
      <div className="main-container-header-buttons-container">
        <button
          className="setlist-item-move-item-modal-x-button"
          onClick={hideModal}
        >
          {/* TODO: icon */}
          X
        </button>
      </div>
    </div>
    {setlist.flatMap(i => {
      const renderedItem =
        <VSplitClickable onHover={
          (half) => {
            setHoveredHalf({
              id: i.id,
              half: half,
            })
          }
        } onClick={console.log}>
          <div className="setlist-item-move-item-modal-list-container">
            <div
              className="setlist-item-id-container"
              style={{ width: `${maxIdChars * 1.1}ch` }}
            >
              {i.id}
            </div>
            <div
              className="setlist-item-name-container"
            >
              {i.name}
            </div>
          </div>
        </VSplitClickable>;

      return (i.id == hoveredHalf?.id) ?
        [
          (hoveredHalf.half == 0) ? <hr /> : <></>,
          renderedItem,
          (hoveredHalf.half == 1) ? <hr /> : <></>,
        ]
        :
        renderedItem;
    }
    )}
  </div>
}

const SetlistItemMenu:
  React.FC<{ item: SerializedMediaWithId }>
  = ({ item }) => {
    const { hideMenu } = useContextMenu();
    const { showModal } = useModal();
    return <div
      className="setlist-item-menu-container">
      <button
        className="setlist-item-menu-button"
        onClick={
          (e) => {
            hideMenu();
            showModal(e, <MoveItemModal item={item} />);
          }
        }
      >
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
