import { SerializedMediaWithId } from "../../shared/media-classes";

import "./Setlist.css";

import SetlistItem from "./SetlistItem";

const Setlist: React.FC<{ setlist: SerializedMediaWithId[] | null }> = ({ setlist }) => {
  return <div className="setlist main-container">
    <div className="main-container-header">
      <h1 className="main-container-title">Media</h1>
      <div className="main-container-header-buttons-container">
        <button className="setlist-header-plus-button hi-1-button">+</button>
      </div>
    </div>
    <div className="setlist-items-container">
      {setlist?.map((x, i) => <SetlistItem key={i} maxIdChars={4} item={x} />) ?? <></>}
    </div>
  </div >
};

export default Setlist;
