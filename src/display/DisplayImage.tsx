import { SerializedLiveElement } from "../shared/media-classes"

const DisplayImage: React.FC<{ liveElement: SerializedLiveElement }> =
  ({ liveElement }) => {
    return <img className="display-image" src={`fetch-media://${liveElement.id}`} />
  }

export default DisplayImage
