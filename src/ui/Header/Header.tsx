import "./Header.css"
import Logo from "./Logo";
import LogoButton from "./LogoButton";
import NewDisplayWindowButton from "./NewDisplayWindowButton";
import SettingsButton from "./SettingsButton";

const Header: React.FC<{}> = ({ }) => {
  return <div className="header">
    <Logo />
    <div className="header-buttons-container">
      {/* {b("Logo")} */}
      <SettingsButton />
      <NewDisplayWindowButton />
      <LogoButton />
    </div>
  </div>
}

export default Header
