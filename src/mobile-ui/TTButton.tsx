import { useRef, useState } from "react";
import { useTTButtonTimer } from "./TTButtonTimerContext";


const TTButton: React.FC<{
  children: React.ReactNode;
  onConfirm: (event: React.MouseEvent) => void;
  onTimeout: () => void;
  className: string;
  style: object;
}> = ({ children, onConfirm, onTimeout, className, style }) => {
  const { registerTimer, unregisterTimer, clearTimers } = useTTButtonTimer();
  const [pending, setPending] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pending) {
      clearTimers();
      setPending(false);
      onConfirm(e);
    } else {
      clearTimers();
      setPending(true);
      timerRef.current = setTimeout(() => {
        setPending(false)
        onTimeout();
      }, 1000)
      registerTimer({
        id: timerRef.current,
        onClear: () => setPending(false)
      }
      );
    }

  }
  return (
    <button onClick={handleClick} className={className}
      style={{
        opacity: pending ? "0.4" : "1",
        ...style
      }}
    >
      {children}
    </button>
  )
}

export default TTButton;
