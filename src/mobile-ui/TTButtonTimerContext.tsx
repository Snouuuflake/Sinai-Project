import { createContext, useContext, useEffect, useRef, useState } from "react";

type TTButtonTimerContextType = {
  registerTimer: (timer: Timer) => void;
  unregisterTimer: (id: ReturnType<typeof setTimeout>) => void;
  clearTimers: () => void;
}

export const TTButtonTimerContext = createContext<TTButtonTimerContextType | null>(null);


type Timer = {
  id: ReturnType<typeof setTimeout>;
  onClear: () => void;
}

export const TTButtonTimerContextProvider:
  React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const timers = useRef<Set<Timer>>(new Set());

    const clearTimers = () => {
      timers.current.forEach(timer => {
        clearTimeout(timer.id);
        timer.onClear()
      });
      timers.current.clear();
    }
    useEffect(() => {
      const handleClick = () => {
        clearTimers();
      };
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick)
    })

    const registerTimer = (timer: Timer) => {
      timers.current.add(timer);
    }
    const unregisterTimer = (id: ReturnType<typeof setTimeout>) => {
      timers.current.forEach(
        timer => {
          if (timer.id === id) timers.current.delete(timer)
        }
      );
    }


    return <TTButtonTimerContext.Provider
      value={{ registerTimer, unregisterTimer, clearTimers }}>
      {children}
    </TTButtonTimerContext.Provider >
  };

export const useTTButtonTimer = () => {
  const context = useContext(TTButtonTimerContext);
  if (!context) {
    throw new Error("used useTTButtonTimer outside of TTButtonTimerContext");
  }
  return context;
}
