import { SerializedLiveElement } from "../shared/media-classes"

const DisplayImage: React.FC<{ liveElement: SerializedLiveElement }> =
  ({ liveElement }) => {
    return <div>
      <img
        style={{ height: "100px" }}
        src={`fetch-media://${liveElement.id}`} />
    </div>
  }

export default DisplayImage
