import { useUIState } from "../UIStateContext";
import { useContextMenu } from "../ContextMenuContext";
import { DISPLAYS } from "../../shared/constants";
import { forwardRef } from "react";
import { ChevronRight } from "lucide-react";

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
      (window as unknown as UIWindow).electron.sendSetLiveElement(index, null);
      hideMenu();
    }
    const onClickProject = () => {
      (window as unknown as UIWindow).electron.sendSetLiveElement(index, {
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
                  (window as unknown as UIWindow).electron.sendSetLiveElement(i, null);
              }
              hideMenu();
            }
          }
        >
          Remove from all
        </button>
        {
          Array.from({ length: DISPLAYS }, (x, i) => {
            return (
              <ProjectToDisplayButton
                key={`pebcm-${i}`}
                index={i}
                id={id}
                element={element}
              />
            )
          })
        }
      </div>
    )
  }

const ProjectElementButton = forwardRef<
  HTMLButtonElement,
  {
    children: React.ReactNode;
    id: number;
    element: number;
    selected: boolean;
  }
>(
  (
    { children, id, element, selected },
    ref
  ) => {
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

    return (
      <div
        className="project-element-button-container"
      >
        {
          selected ?
            <ChevronRight
              className="project-element-button-caret"
              strokeWidth={3}
              size={"30px"}
              color={"var(--gray-40)"}
            /> :
            <></>
        }
        <button
          ref={ref}
          tabIndex={-1}
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
              console.log("!!!!!!");
              (window as unknown as UIWindow).electron.sendSetSelectedLiveElementId(element);
              for (let i = 0; i < DISPLAYS; i++) {
                (window as unknown as UIWindow).electron.sendSetLiveElement(i, {
                  id: id,
                  element: element,
                });
              }
            }
          }
        >
          <div
            className="project-element-button-blob"
          >
          </div>
          <div
            className={`project-element-button-inner `}
          >
            {children}
          </div>
        </button >
      </div>
    )
  }
)


export default ProjectElementButton;
