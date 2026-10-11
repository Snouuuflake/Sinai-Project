import { X } from "lucide-react";
import { useModal } from "../ModalContext";
import Setlist from "../Setlist/Setlist";
import { useUIState } from "../UIStateContext";
import SetlistItem from "../Setlist/SetlistItem";

const SetlistButtonModal: React.FC<{}> = () => {
  const { hideModal } = useModal();
  const uiState = useUIState();
  const maxIdChars = uiState.setlist?.map<number>(x => x.id.toString().length).reduce((p, c) => c > p ? c : p, 0) ?? 0
  return (
    <div className="modal-container">
      <div className="main-container-header">
        <div className="main-container-title">Multimedia</div>
        <div className="main-container-header-buttons-container">
          <button
            className="modal-exit-button hi-1-button"
            onClick={(_e) => hideModal()}
          >
            <X size={32} />
          </button>
        </div>
      </div>
      <div className="setlist-items-container" tabIndex={-1}>
        {uiState.setlist?.map((x, i) => <SetlistItem key={i} maxIdChars={maxIdChars} item={x} />) ?? <></>}
      </div>
    </div>
  )
}

const SetlistButton: React.FC<{}> = () => {
  const { showModal } = useModal();
  return (
    <button
      className="header-button"
      onClick={() => {
        showModal(<SetlistButtonModal />)
      }}
    >
      Setlist
    </button>
  )
}
export default SetlistButton;
