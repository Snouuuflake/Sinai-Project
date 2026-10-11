import { useUIState } from "../UIStateContext";
import { DISPLAYS } from "../../shared/constants"


const LiveDisplayIndexArrayElement:
  React.FC<{ index: number, id: number, element: number }>
  = ({ index, id, element }) => {
    const { liveElements } = useUIState();
    const isFullActive = liveElements.reduce(
      (p, c) => p && (c?.id === id && c?.element === element),
      true
    );
    const isPartlyActive = liveElements.reduce(
      (p, c, i) => p || (c?.id === id && c?.element === element && i === index),
      false
    );
    return <div className="live-dispaly-index-array-element"
      style={{
        color: isFullActive ?
          "var(--hi-2)" :
          isPartlyActive ?
            "var(--hi-1)" :
            "var(--gray-50)"
      }}
    >
      {index + 1}
    </div>
  }

const LiveDisplayIndexArray:
  React.FC<{ id: number, element: number }>
  = ({ id, element }) => {
    return <div className="live-display-index-array">
      {Array.from({ length: DISPLAYS }, (_x, i) =>
        <LiveDisplayIndexArrayElement
          index={i} id={id} element={element} key={i}
        />
      )}
    </div>
  }

export default LiveDisplayIndexArray;
