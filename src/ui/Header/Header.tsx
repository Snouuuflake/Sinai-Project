import "./Header.css"
import { useTheme } from "../ThemeContext";
import Logo from "./Logo";
import NewDisplayWindowButton from "./NewDisplayWindowButton";
import SettingsButton from "./SettingsButton";

const Header: React.FC<{}> = ({ }) => {
  const themeContext = useTheme();
  return <div className="header">
    <Logo />
    <div className="header-buttons-container">
      {/* {b("Logo")} */}
      {/* {b("Clear")} */}
      <SettingsButton />
      <NewDisplayWindowButton />
    </div>
  </div>
}

export default Header
