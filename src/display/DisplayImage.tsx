import { SerializedLiveElement } from "../shared/media-classes"

const DisplayImage: React.FC<{ liveElement: SerializedLiveElement, className: string }> =
  ({ liveElement, className }) => {
    return <img className={`display-image ${className}`} src={`fetch-media://${liveElement.id}`} />
  }

export default DisplayImage
