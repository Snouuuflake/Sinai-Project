import { useState, useRef } from "react"
import { SerializedMediaIdentifier } from "../../shared/media-classes"
import { useContextMenu } from "../ContextMenuContext";
import { useModal } from "../ModalContext";
import { useUIState } from "../UIStateContext";

import "./SetlistItem.css";

type HoveredHalfType = {
  index: number;
  half: number;
}

const MoveButton: React.FC<{ item: SerializedMediaIdentifier, hoveredHalf: HoveredHalfType }> = ({ item, hoveredHalf }) => {
  const { hideModal } = useModal();
  return <button
    className="setlist-item-move-item-modal-move-button"
    onClick={
      () => {
        window.electron.sendMoveMedia(
          item.id, hoveredHalf.index + hoveredHalf.half
        );
        hideModal();
      }
    }
  >
    <hr
      className="setlist-item-move-item-modal-move-button-hr"
    />
    <div
      className="setlist-item-move-item-modal-move-button-text"
    >
      [Move here!]
    </div>
    <hr
      className="setlist-item-move-item-modal-move-button-hr"
    />
  </button>
}

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

const MoveItemModal: React.FC<{ item: SerializedMediaIdentifier }> = ({ item }) => {
  const [hoveredHalf, setHoveredHalf] =
    useState<HoveredHalfType | null>(null);

  const { hideModal } = useModal();
  const { setlist } = useUIState();

  const setlistWithoutItem = [...setlist];

  setlistWithoutItem.splice(setlist.findIndex(i => i.id == item.id), 1);

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
    <div className="setlist-item-move-item-modal-list-container">
      {setlistWithoutItem.flatMap((x, i) => {
        const renderedButton = hoveredHalf ?
          <MoveButton key="button" item={item} hoveredHalf={hoveredHalf} />
          : <></>;
        {/* const renderedButton = <div>hi</div>; */ }

        const renderedItem =
          <VSplitClickable key={`item-${i}`} onHover={
            (half) => {
              setHoveredHalf({
                index: i,
                half: half,
              })
            }
          } onClick={console.log}>
            <div className="setlist-item-move-item-modal-list-item-container">
              <div
                className="setlist-item-id-container"
                style={{ width: `${maxIdChars * 1.1}ch` }}
              >
                {x.id}
              </div>
              <div
                className="setlist-item-name-container"
              >
                {x.name}
              </div>
            </div>
          </VSplitClickable>;

        return (i == hoveredHalf?.index) ?
          [
            (hoveredHalf.half == 0) ? renderedButton : <></>,
            renderedItem,
            (hoveredHalf.half == 1) ? renderedButton : <></>,
          ]
          :
          renderedItem;
      }
      )}
    </div>
  </div>
}

const SetlistItemMenu:
  React.FC<{ item: SerializedMediaIdentifier }>
  = ({ item }) => {
    const { hideMenu } = useContextMenu();
    const { showModal } = useModal();
    return <div
      className="context-menu-default-container setlist-item-menu-container">
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
      <button
        className="setlist-item-menu-button"
        onClick={
          (_e) => {
            window.electron.sendDeleteMedia(item.id);
            hideMenu();
          }
        }
      >
        Delete
      </button>
    </div>
  }

const SetlistItem: React.FC<{ maxIdChars: number, item: SerializedMediaIdentifier }> = ({ maxIdChars, item }) => {
  const { showMenu } = useContextMenu();
  const { openMedia } = useUIState();
  return <button
    className="setlist-item"
    onContextMenu={(e) => {
      showMenu(e, <SetlistItemMenu item={item} />)
    }}
    onClick={
      () => {
        window.electron.sendSetOpenMedia(item.id);
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
