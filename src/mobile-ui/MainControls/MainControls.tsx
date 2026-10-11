import {
  SerializedMediaWithId,
  SerializedImageMediaWithId,
  SerializedSongMediaWithId
} from "../../shared/media-classes"
import ImageControls from "./ImageContols";
import SongControls from "./SongControls";

import "./MainControls.css";

const MainControls:
  React.FC<{ openMedia: SerializedMediaWithId | null }>
  = ({ openMedia }) => {
    return < div className="main-container main-controls" >
      {
        openMedia === null
          ? ""
          : openMedia.type === "image"
            ? <ImageControls openMedia={openMedia as SerializedImageMediaWithId} />
            : openMedia.type === "song"
              ? <SongControls openMedia={openMedia as SerializedSongMediaWithId} />
              : openMedia.name
      }
    </div>
  }

export default MainControls;
