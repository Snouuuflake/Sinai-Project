import { isElectron } from "../shared/isElectron";
import { SerializedLiveElement } from "../shared/media-types"
import { useDisplayConfigState } from "./DisplayConfigStateContext";

const DisplayB64Image: React.FC<{ liveElement: SerializedLiveElement, className: string }> =
  ({ liveElement, className }) => {
    const { configHash } = useDisplayConfigState();
    return <img
      className={`display-image display-element-container ${className}`}
      style={{
        backgroundColor: (configHash.get("image-background-color") as string) ?? "",
      }}
      src={`data:image/jpeg;charset=utf-8;base64,${liveElement.value.image}`}
    />
  }

export default DisplayB64Image
