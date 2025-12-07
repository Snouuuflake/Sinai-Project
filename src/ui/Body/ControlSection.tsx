import { GlobalContext } from "../GlobalContext";
import { useContext, useEffect, useState } from "react";
import SongControls from "./SongControls/SongControls";
import ImageControls from "./ImageControls";
import "./ControlSection.css";

function ControlsSection() {
  const { viewElement } = useContext(GlobalContext) as GlobalContextType;

  return (
    <div className="control-section">
      {viewElement.value.type === "song" && viewElement.value.song ? (
        <SongControls openSong={viewElement.value} />
      ) : viewElement.value.type === "image" && viewElement.value.image ? (
        <ImageControls image={viewElement.value.image} />
      ) : (
        ""
      )}
    </div>
  );
}

export default ControlsSection;
