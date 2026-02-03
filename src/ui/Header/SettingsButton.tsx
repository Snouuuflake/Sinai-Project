import { useModal } from "../ModalContext"
import { useUIState } from "../UIStateContext";

// const SettingsButtonModal: React.FC<{}> = ({ }) => {
//   const { config } = useUIState();
//   const { hideModal } = useModal();
//   return (
//     <div>
//       <button onClick={(e) => hideModal()}>x</button>
//       <div>hi</div>
//       <div>
//         {config.map(ce => <div>
//           {`${ce.type} ${ce.category} ${ce.id} ${ce.defaultValue}`}
//         </div>)}
//       </div>
//     </div >
//   )
// }

const SettingsButton: React.FC<{}> = ({ }) => {
  const { showModal } = useModal();
  return (
    <button
      className="header-button"
      onClick={
        (e) => {
          // showModal(e, <SettingsButtonModal />);
        }
      }
    >
    </button>
  )
}

export default SettingsButton;
