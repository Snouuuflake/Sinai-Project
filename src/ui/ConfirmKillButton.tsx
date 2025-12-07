import Icon from "./Icon";
import { useState, useRef, useEffect } from "react";

/**
 * @param props.className already has "general-icon-button"
 */
function ConfirmKillButton({ callback, className }: { callback: () => void; className: string }) {
  const [gonnaKill, setGonnaKill] = useState<boolean>(false);
  const thisRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const callback = (event: MouseEvent) => {
      if (thisRef.current && !thisRef.current.contains(event.target as Node)) {
        setGonnaKill(false);
      }
    };

    document.body.addEventListener("click", callback);

    return () => {
      document.body.removeEventListener("click", callback);
    };
  },[gonnaKill]);
  return (
    <button
      ref={thisRef}
      style={{ color: gonnaKill ? "red" : "" }}
      className={"general-icon-button" + " " + className}
      onClick={(event) => {
        if (!gonnaKill) {
          setGonnaKill(true);
        } else {
          callback();
          setGonnaKill(false);
        }
      }}
    >
      <Icon code="X" />
    </button>
  );
}

export default ConfirmKillButton;
