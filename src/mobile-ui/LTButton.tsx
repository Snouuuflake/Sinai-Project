import { useRef, useState, forwardRef, useEffect } from "react";


const LTButton = forwardRef<
  HTMLButtonElement,
  {
    children: React.ReactNode;
    onTimeout: () => void;
    onEarly: () => void;
    className?: string;
    style?: object;
    tabIndex?: number;
  }>(
    ({ children, onTimeout, onEarly, className = "", style = {}, tabIndex }, ref) => {
      const [pending, setPending] = useState<boolean>(false);
      const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
      const pointerTypeRef = useRef('mouse');

      const clearTimer = () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };

      // cleanup on unmount
      useEffect(() => clearTimer, []);
      return (
        <button
          ref={ref}
          style={{
            touchAction: 'manipulation', WebkitTouchCallout: 'none', userSelect: 'none',
            animation: pending ? "1.5s linear 0s 1 normal forwards running lt-fade, 1s step-start 0s infinite normal forwards running lt-blink" : "",
            opacity: pending ? "calc(var(--lt-fade-value) + var(--lt-blink-opacity))" : "",
            ...style
          }}
          onPointerDown={(event) => {
            pointerTypeRef.current = event.pointerType;
            if (event.pointerType !== 'touch') return; // desktop: nothing to wait for

            setPending(true);
            clearTimer();
            timerRef.current = setTimeout(() => {
              timerRef.current = null;
              setPending(false);
              onTimeout();
            }, 1500);
          }}
          onPointerUp={(event) => {
            if (event.pointerType !== 'touch') return;

            setPending(false);
            if (timerRef.current) {
              // released before 3s: treat as a normal tap
              clearTimer();
              onEarly();
            }
          }}
          onPointerCancel={() => {
            // scroll or system gesture took over: abandon without firing anything
            clearTimer();
            setPending(false);
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            // touch already handled in pointerup; ignore its synthesized click
            if (pointerTypeRef.current === 'touch' && event.detail !== 0) return;
            onEarly();
          }}
          onContextMenu={(event) => {
            event.preventDefault();
            event.stopPropagation();
            // On touch, contextmenu fires at ~500ms from the native long press,
            // so ignore it there and let the 3s timer decide.
            if (pointerTypeRef.current === 'touch') return;
            onTimeout(); // desktop right-click
          }}
          className={className}
          tabIndex={tabIndex}
        >
          {children}
        </button>
      )
    }
  )



export default LTButton;
