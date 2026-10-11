import { isElectron } from "../shared/isElectron";
import { SerializedLiveElement } from "../shared/media-classes"
import { useDisplayConfigState } from "./DisplayConfigStateContext";

export function mediaUrl(id: number): string {
  if (isElectron()) {
    return `fetch-setlist-media://${id}`;
  }
  return `${window.location.origin}/fetch-setlist-media/${id}`;
}

const DisplayImage: React.FC<{ liveElement: SerializedLiveElement, className: string }> =
  ({ liveElement, className }) => {
    const { configHash } = useDisplayConfigState();
    return <img
      className={`display-image display-element-container ${className}`}
      style={{
        backgroundColor: (configHash.get("image-background-color") as string) ?? "",
      }}
      src={mediaUrl(liveElement.id)}
    />
  }

export default DisplayImage
