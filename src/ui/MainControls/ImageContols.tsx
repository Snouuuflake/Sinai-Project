import { SerializedImageMediaWithId } from "../../shared/media-classes"
import { DISPLAYS } from "../../shared/constants.js";
import { useUIState } from "../UIStateContext";
import { useContextMenu } from "../ContextMenuContext";

import "./ImageContols.css";

/*
  window.electron.sendSetLiveElement(i, {
    id: openMedia.id,
    element: 0,
  });
*/

const ProjectToDisplayButton:
  React.FC<{
    id: number;
    index: number;
    element: number;
  }>
  = ({ id, index, element }) => {
    const { liveElements } = useUIState();
    const { hideMenu } = useContextMenu();
    const isLive = liveElements[index] ?
      (
        liveElements[index].id === id
        && liveElements[index].element === element
      )
      : false;
    const onClickRemove = () => {
      window.electron.sendSetLiveElement(index, null);
      hideMenu();
    }
    const onClickProject = () => {
      window.electron.sendSetLiveElement(index, {
        id: id,
        element: element,
      });
      hideMenu();
    }
    return (
      <button
        onClick={
          isLive ? onClickRemove : onClickProject
        }
      >
        {`${isLive ? "Remove from" : "Project to"} display #${index + 1}`}
      </button>
    )
  }

const ProjectElementButtonContextMenu:
  React.FC<{ id: number, element: number }>
  = ({ id, element }) => {
    const { liveElements } = useUIState();
    const { hideMenu } = useContextMenu();
    return (
      <div
        className="context-menu-default-container project-element-button-context-menu"
      >
        <button
          onClick={
            () => {
              for (let i = 0; i < DISPLAYS; i++) {
                let le = liveElements[i];
                if (le && le.id === id && le.element === element)
                  window.electron.sendSetLiveElement(i, null);
              }
              hideMenu();
            }
          }
        >
          Remove from all
        </button>
        {
          Array.from({ length: DISPLAYS }, (x, i) => {
            return <ProjectToDisplayButton index={i} id={id} element={element} />
          })
        }
      </div>
    )
  }

const ProjectElementButton:
  React.FC<{
    children: React.ReactNode;
    id: number;
    element: number;
  }>
  = ({ children, id, element }) => {
    const { liveElements } = useUIState();
    const { showMenu } = useContextMenu();
    const isFullActive = liveElements.reduce(
      (p, c) => p && (c?.id === id && c?.element === element),
      true
    );
    const isPartlyActive = liveElements.reduce(
      (p, c) => p || (c?.id === id && c?.element === element),
      false
    );

    return <button
      className={`project-element-button ${isFullActive ?
        "project-element-button-full-active" :
        isPartlyActive ?
          "project-element-button-partly-active" :
          ""
        }`}
      onContextMenu={
        (e) => {
          showMenu(e, <ProjectElementButtonContextMenu id={id} element={element} />)
        }
      }
      onClick={
        () => {
          for (let i = 0; i < DISPLAYS; i++) {
            window.electron.sendSetLiveElement(i, {
              id: id,
              element: element,
            });
          }
        }
      }
    >
      <div
        className={`project-element-button-inner `}
      >
        {children}
      </div>
    </button >
  }

const LiveDisplayIndexArrayElement:
  React.FC<{ index: number, id: number, element: number }>
  = ({ index, id, element }) => {
    const { liveElements } = useUIState();
    const isFullActive = liveElements.reduce(
      (p, c) => p && (c?.id === id && c?.element === element),
      true
    );
    const isPartlyActive = liveElements.reduce(
      (p, c, i) => p || (c?.id === id && c?.element === element && i === index),
      false
    );
    return <div className="live-dispaly-index-array-element"
      style={{
        color: isFullActive ?
          "var(--hi-2)" :
          isPartlyActive ?
            "var(--hi-1)" :
            "var(--gray-50)"
      }}
    >
      {index}
    </div>
  }

const LiveDisplayIndexArray:
  React.FC<{ id: number, element: number }>
  = ({ id, element }) => {
    return <div className="live-display-index-array">
      {Array.from({ length: DISPLAYS }, (_x, i) =>
        <LiveDisplayIndexArrayElement
          index={i} id={id} element={element}
        />
      )}
    </div>
  }


const ImageControls:
  React.FC<{ openMedia: SerializedImageMediaWithId }>
  = ({ openMedia }) => {
    const ELEMENT = 0; // because it's only this one button
    return <>
      <div className="main-container-header ">
        {/* TODO: icon */}
        <h1 className="main-container-title">Image Controls</h1>
      </div>
      <ProjectElementButton
        id={openMedia.id}
        element={ELEMENT}
      >
        <div className={`image-controls-project-button-inner `}>
          <div className="image-controls-project-button-left">
            <LiveDisplayIndexArray
              id={openMedia.id}
              element={ELEMENT}
            />
            <div className="image-contols-project-button-text">
              {openMedia.name}
            </div>
          </div>
          <img
            className="image-controls-image"
            src={`fetch-media://${openMedia.id}`}
          />
        </div>
      </ProjectElementButton>
    </>
  }

export default ImageControls;
