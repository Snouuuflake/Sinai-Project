import { createContext, useContext, useState, useEffect } from "react";

type PortType = number | null;

type PortContextType = {
  port: PortType;
}

export const PortContext = createContext<PortContextType | null>(null);

export const PortContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [port, setPort] = useState<PortType>(null);
  useEffect(() => {
    const remover = (window as unknown as UIWindow).electron.onUIUpdatePort((port) => {
      setPort(port);
    });
    (window as unknown as UIWindow).electron.sendUIPortRequest();
    return remover;
  }, [])

  return <PortContext.Provider value={{ port }}>{children}</PortContext.Provider>
};

export const usePort = () => {
  const context = useContext(PortContext);
  if (!context) {
    throw new Error("Calling usePort with no PortContext!");
  }
  return context;
}
