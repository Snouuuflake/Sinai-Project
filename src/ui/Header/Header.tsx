import "./Header.css"
import { useTheme } from "../ThemeContext";
import Logo from "./Logo";

const Header: React.FC<{}> = ({ }) => {
  const themeContext = useTheme();
  const b = (name: string) => <button className="header-button" onClick={
    () => {
      themeContext.setTheme(
        themeContext.theme == "light" ? "dark" : "light"
      )
    }
  }>
    {name}
  </button>

  return <div className="header">
    <Logo />
    <div className="header-buttons-container">
      {b("Logo")}
      {b("Clear")}
      {b("Settings")}
      <button
        className="header-button"
        onClick={
          () => {
            window.electron.sendNewDisplayWindow(0);
          }
        }
      >
        New Display Window
      </button>
    </div>
  </div>
}

export default Header
