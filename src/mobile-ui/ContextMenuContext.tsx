import { useRef, useState, useEffect, createContext, useContext, } from "react";

import "./ContextMenuContext.css";

type ContextMenuPositionType = {
  x: number;
  y: number;
}

type ContextMenuContextType = {
  showMenu: (e: React.MouseEvent, content: React.ReactNode) => void;
  hideMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export const useContextMenu = (): ContextMenuContextType => {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error("used useContextMenu outside ContextMenuContext!");
  }
  return context;
}

export const ContextMenuContextProvider:
  React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [visible, setVisible] = useState<boolean>(false);
    const [position, setPosition] = useState<ContextMenuPositionType>({ x: 0, y: 0 });
    const [content, setContent] = useState<React.ReactNode>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const value: ContextMenuContextType = {
      showMenu: (e, content) => {
        e.preventDefault();
        e.stopPropagation();

        setContent(content);
        setPosition({ x: e.clientX, y: e.clientY });
        setVisible(true);
      },
      hideMenu: () => {
        setVisible(false);
      }
    }

    useEffect(() => {
      const handleOutsideClick = (e: Event) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          value.hideMenu();
        }
      }
      const handleEsc = (e: Event) => {
        if ((e as KeyboardEvent).key === "Escape") {
          value.hideMenu();
        }
      }

      if (visible) {
        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEsc);
        document.addEventListener("contextmenu", value.hideMenu);
      }

      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
        document.removeEventListener("keydown", handleEsc);
        document.removeEventListener("contextmenu", value.hideMenu);
      }
    }, [visible]);

    useEffect(() => {
      if (visible && menuRef.current) {
        const menuBounds = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const newPosition: ContextMenuPositionType = {
          ...position
        };

        if (menuBounds.right > viewportWidth) {
          newPosition.x = viewportWidth - menuBounds.width - 10;
          console.log("overflow x");
        }
        if (menuBounds.bottom > viewportHeight) {
          newPosition.y = viewportHeight - menuBounds.height - 10;
          console.log("overflow y");
        }

        console.log(menuBounds.right, viewportWidth, menuBounds.bottom, viewportHeight)

        if (newPosition.x !== position.x || newPosition.y !== position.y) {
          setPosition(newPosition);
        }
      }
    }, [position]);

    return <ContextMenuContext.Provider
      value={value}
    >
      {children}
      {
        visible ?
          <div
            className="context-menu-container"
            ref={menuRef}
            style={{
              position: "fixed",
              top: `${position.y}px`,
              left: `${position.x}px`,
              zIndex: 1000,
            }}>
            {content}
          </div>
          :
          <></>
      }
      {
        visible ?
          <div
            style={{
              position: "fixed",
              top: "0",
              left: "0",
              height: "100vh",
              width: "100vw",
              background: "var(--gray-10)",
              opacity: "30%",
            }}
          ></div>
          : <></>
      }
    </ContextMenuContext.Provider >
  };
