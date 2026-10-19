import { SerializedPDFMediaWithId } from "../../shared/media-types"

import ProjectElementButton from "./ProjectElementButton";
import LiveDisplayIndexArray from "./LiveDisplayIndexArray";

import "./SongControls.css";
import "./ImageContols.css";

import "./PDFControls.css"

import { useUIState } from "../UIStateContext";

const PDFControls:
  React.FC<{ openMedia: SerializedPDFMediaWithId }>
  = ({ openMedia }) => {
    const ELEMENT = 0; // because it's only this one button
    const { selectedLiveElementId } = useUIState();
    return <div className="pdf-controls">
      <div className="main-container-header ">
        {/* TODO: icon */}
        <h1 className="main-container-title">{openMedia.name}</h1>
      </div>

      <div className="pdf-controls-pages-container">
        {
          openMedia.value.b64pages.map((p, i) => {
            return <ProjectElementButton
              id={openMedia.id}
              element={i}
              selected={selectedLiveElementId === i}
            >
              <div className={`image-controls-project-button-inner`}>
                <div className="image-controls-project-button-left">
                  <LiveDisplayIndexArray
                    id={openMedia.id}
                    element={i}
                  />
                  <div className="image-contols-project-button-text">
                    Página {i + 1}
                  </div>
                </div>
                <img
                  className="image-controls-image"
                  src={`data:image/jpeg;charset=utf-8;base64,${p}`}
                />
              </div>
            </ProjectElementButton>
          })
        }
      </div>
    </div>
  }

export default PDFControls;
