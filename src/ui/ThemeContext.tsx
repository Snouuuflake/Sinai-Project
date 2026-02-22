import { createContext, useContext, useState, useEffect } from "react";

import { useConfigState } from "./ConfigStateContext";

type ThemeType = "light" | "dark";

type ThemeContextType = {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { generalConfigMap } = useConfigState();
  const [theme, setTheme] = useState<ThemeType>(generalConfigMap.get("dark-theme") ?? false ? "dark" : "light");
  useEffect(() => {
    const themeValue = generalConfigMap.get("dark-theme") ?? false ? "dark" : "light";
    setTheme(themeValue);
    document.documentElement.setAttribute("data-theme", themeValue);
  }, [generalConfigMap.get("dark-theme")])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("Calling useTheme with no ThemeContext!");
  }
  return context;
}
