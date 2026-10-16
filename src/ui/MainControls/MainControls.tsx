import {
  SerializedMediaWithId,
  SerializedImageMediaWithId,
  SerializedSongMediaWithId,
  SerializedPDFMediaWithId
} from "../../shared/media-types"
import ImageControls from "./ImageContols";
import SongControls from "./SongControls";

import "./MainControls.css";
import PDFControls from "./PDFControls";

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
              : openMedia.type === "pdf" ?
                <PDFControls openMedia={openMedia as SerializedPDFMediaWithId} />
                : openMedia.name
      }
    </div>
  }

export default MainControls;
