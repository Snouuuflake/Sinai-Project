import logoLightImage from "../assets/logo-light.png"
import logoDarkImage from "../assets/logo-dark.png"

import "./logo.css";


const Logo: React.FC<{}> = ({ }) => {
  return <img
    className="logo"
    src={
      logoDarkImage
    }
  />
}

export default Logo;
