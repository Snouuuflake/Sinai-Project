import { createContext, useState, useLayoutEffect, useRef } from "react";

export const GlobalContext = createContext<GlobalContextType | null>(null);
const GlobalContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // --- live element ---------------------------------------------------------
  //const makeLiveElementsState = (): LiveElementsState => {

  return (
    <GlobalContext.Provider
      value={{ x: 1 }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalContextProvider;
