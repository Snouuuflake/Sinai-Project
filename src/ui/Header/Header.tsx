import "./Header.css"
import { useTheme } from "../ThemeContext";
import Logo from "./Logo";
import NewDisplayWindowButton from "./NewDisplayWindowButton";
import SettingsButton from "./SettingsButton";

const Header: React.FC<{}> = ({ }) => {
  const b = (name: string) => <button className="header-button" onClick={
    () => {
      themeContext.setTheme(
        themeContext.theme == "light" ? "dark" : "light"
      )
    }
  }>
    {name}
  </button>
  const themeContext = useTheme();
  return <div className="header">
    <Logo />
    <div className="header-buttons-container">
      {/* {b("Logo")} */}
      {b("theme")}
      <SettingsButton />
      <NewDisplayWindowButton />
    </div>
  </div>
}

export default Header
