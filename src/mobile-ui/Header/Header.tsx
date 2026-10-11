import "./Header.css"
import Logo from "./Logo";
import LogoButton from "./LogoButton";
import SetlistButton from "./SetlistButton";

const Header: React.FC<{}> = ({ }) => {
  return <div className="header">
    <Logo />
    <div className="header-buttons-container">
      <LogoButton />
      <SetlistButton />
    </div>
  </div>
}

export default Header
