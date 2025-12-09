import logoLightImage from "../assets/logo-light.png"
import logoDarkImage from "../assets/logo-dark.png"

import "./logo.css";

import { useTheme } from "../ThemeContext"

const Logo: React.FC<{}> = ({ }) => {
  const themeContext = useTheme();
  return <img
    className="logo"
    src={
      themeContext.theme == "light"
        ? logoLightImage : logoDarkImage
    }
  />
}

export default Logo;
