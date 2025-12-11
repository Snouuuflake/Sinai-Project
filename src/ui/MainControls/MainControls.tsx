import {
  SerializedMediaWithId,
  SerializedImageMediaWithId
} from "../../shared/media-classes"
import ImageControls from "./ImageContols";

const MainControls:
  React.FC<{ openMedia: SerializedMediaWithId | null }>
  = ({ openMedia }) => {
    return < div className="main-container main-controls" >
      {
        openMedia === null
          ? ""
          : openMedia.type === "image"
            ? <ImageControls openMedia={openMedia as SerializedImageMediaWithId} />
            : openMedia.name
      }
    </div>
  }

export default MainControls;
