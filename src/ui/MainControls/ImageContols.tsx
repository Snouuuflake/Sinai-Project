import { SerializedImageMediaWithId } from "../../shared/media-classes"

import "./ImageContols.css";

const ImageControls:
  React.FC<{ openMedia: SerializedImageMediaWithId }>
  = ({ openMedia }) => {

    return <>
      <div className="main-container-header">
        {/* TODO: icon */}
        <h1 className="main-container-title">{openMedia.name}</h1>
      </div>
      <button className="image-controls-project-button">
        <div className="image-contols-project-button-text">
          Project
        </div>
        <img
          className="image-controls-image"
          src={`fetch-media://${openMedia.id}`}
        />
      </button >
    </>
  }

export default ImageControls;
