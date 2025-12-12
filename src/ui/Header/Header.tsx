import "./Header.css"
import { useTheme } from "../ThemeContext";
import Logo from "./Logo";
import NewDisplayWindowButton from "./NewDisplayWindowButton";

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
      <NewDisplayWindowButton />
    </div>
  </div>
}

export default Header
