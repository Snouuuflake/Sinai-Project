import "./Body.css";
import { GlobalContext } from "../GlobalContext";
import { useContext } from "react";

function Body() {
  const { bodyContent } = useContext(GlobalContext) as GlobalContextType;

  return (
    <div className="body">
      body!
    </div>
  );
}

export default Body;
