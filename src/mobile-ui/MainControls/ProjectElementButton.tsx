import { useUIState } from "../UIStateContext";
import { useContextMenu } from "../ContextMenuContext";
import { DISPLAYS } from "../../shared/constants";
import { forwardRef } from "react";
import { ChevronRight, X } from "lucide-react";
import { useModal } from "../ModalContext";
import { CustomIPC } from "../IpcWsClient";
import LTButton from "../LTButton";

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
      CustomIPC.send("set-live-element", index, null);
    }
    const onClickProject = () => {
      CustomIPC.send("set-live-element", index, { id: id, element: element });
    }
    return (
      <button
        onClick={
          isLive ? onClickRemove : onClickProject
        }
        style={{
          backgroundColor: isLive ? "var(--hi-1)" : "var(--gray-80)",
        }}
      >
        {index + 1}
      </button>
    )
  }

const _ProjectElementButtonContextMenu:
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


const ProjectElementButtonModal: React.FC<{ id: number, element: number }> = ({ id, element }) => {
  const { hideModal } = useModal();
  return (
    <div className="modal-container">
      <div className="main-container-header">
        <div className="main-container-header-buttons-container">
          <button
            className="modal-exit-button hi-1-button"
            onClick={(_e) => hideModal()}
          >
            <X size={32} />
          </button>
        </div>
      </div>
      <div className="display-buttons-container" tabIndex={-1}>
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
    const { showModal } = useModal();
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
        <LTButton
          ref={ref}
          tabIndex={-1}
          className={`project-element-button ${isFullActive ?
            "project-element-button-full-active" :
            isPartlyActive ?
              "project-element-button-partly-active" :
              ""
            }`}
          onTimeout={
            () => {
              showModal(<ProjectElementButtonModal id={id} element={element} />)
            }
          }
          onEarly={
            () => {
              CustomIPC.send("set-selected-live-element-id", element);
              // (window as unknown as UIWindow).electron.sendSetSelectedLiveElementId(element);
              for (let i = 0; i < DISPLAYS; i++) {
                CustomIPC.send("set-live-element", i, {
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
        </LTButton >
      </div>
    )
  }
)


export default ProjectElementButton;
