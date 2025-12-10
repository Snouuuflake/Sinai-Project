import { useRef, useState, useEffect, createContext, useContext } from "react";


type ModalContextType = {
  showModal: (e: React.MouseEvent, content: React.ReactNode) => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("used useModal outside ModalContext!");
  }
  return context;
}

export const ModalContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [content, setContent] = useState<React.ReactNode>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const value: ModalContextType = {
    showModal: (e, content) => {
      e.preventDefault();
      e.stopPropagation();

      setContent(content);
      setVisible(true);
    },
    hideModal: () => {
      setVisible(false);
    }
  }

  useEffect(() => {
    // const handleOutsideClick = (e: Event) => {
    //   if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
    //     value.hideModal();
    //   }
    // }
    // const handleEsc = (e: Event) => {
    //   if ((e as KeyboardEvent).key === "Escape") {
    //     value.hideModal();
    //   }
    // }
    //
    // if (visible) {
    //   document.addEventListener("mousedown", handleOutsideClick);
    //   document.addEventListener("keydown", handleEsc);
    //   document.addEventListener("contextmenu", value.hideModal);
    // }
    //
    // return () => {
    //   document.removeEventListener("mousedown", handleOutsideClick);
    //   document.removeEventListener("keydown", handleEsc);
    //   document.removeEventListener("contextmenu", value.hideModal);
    // }
  }, [visible]);


  return <ModalContext.Provider
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
            top: "0",
            left: "0",
            height: "100vh",
            width: "100vw",
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "color-mix(in srgb, var(--bg), transparent 20%)",
          }}>
          {content}
        </div>
        :
        <></>
    }
  </ModalContext.Provider >
}
