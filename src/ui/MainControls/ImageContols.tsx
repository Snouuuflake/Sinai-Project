import { SerializedImageMediaWithId } from "../../shared/media-classes"

import ProjectElementButton from "./ProjectElementButton";
import LiveDisplayIndexArray from "./LiveDisplayIndexArray";

import "./ImageContols.css";

const ImageControls:
  React.FC<{ openMedia: SerializedImageMediaWithId }>
  = ({ openMedia }) => {
    const ELEMENT = 0; // because it's only this one button
    return <div className="image-controls">
      <div className="main-container-header ">
        {/* TODO: icon */}
        <h1 className="main-container-title">Image Controls</h1>
      </div>
      <ProjectElementButton
        id={openMedia.id}
        element={ELEMENT}
      >
        <div className={`image-controls-project-button-inner `}>
          <div className="image-controls-project-button-left">
            <LiveDisplayIndexArray
              id={openMedia.id}
              element={ELEMENT}
            />
            <div className="image-contols-project-button-text">
              {openMedia.name}
            </div>
          </div>
          <img
            className="image-controls-image"
            src={`fetch-media://${openMedia.id}`}
          />
        </div>
      </ProjectElementButton>
    </div>
  }

export default ImageControls;
