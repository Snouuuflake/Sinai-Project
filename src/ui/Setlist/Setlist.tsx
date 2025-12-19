import { useState } from "react";
import { SerializedMediaIdentifier } from "../../shared/media-classes";
import { useContextMenu } from "../ContextMenuContext";
import { useModal } from "../ModalContext";

import "./Setlist.css";

import SetlistItem from "./SetlistItem";

const NewSongModal: React.FC<{}> = ({ }) => {
  const { hideModal } = useModal();
  const [title, setTitle] = useState<string>("");
  const [author, setAuthor] = useState<string>("");
  return <div className=" new-song-modal-container">
    <div className="new-song-modal-form-container">
      <h1 className="new-song-modal-form-header">
        New Song
      </h1>
      <div>Title:</div>
      <input
        value={title}
        onChange={(e) => {
          const newTitle = e.target.value;
          setTitle(newTitle);
        }}
      />
      <div>Author:</div>
      <input
        value={author}
        onChange={(e) => {
          const newAuthor = e.target.value;
          setAuthor(newAuthor);
        }}
      />
    </div>
    <button
      className="new-song-modal-create-button hi-1-button"
      onClick={() => {
        hideModal();
        if (title.trim() !== "") {
          window.electron.sendCreateSong(title.trim(), author.trim());
        } else {
          window.electron.sendAlert("New song has no title!")
        }
      }}
    >
      Create
    </button>
    <button
      className="new-song-modal-cancel-button"
      onClick={() => {
        hideModal();
      }}
    >
      Cancel
    </button>
  </div>
}

const SetlistPlusMenu: React.FC<{}> = ({ }) => {
  const { hideMenu } = useContextMenu();
  const { showModal } = useModal();
  return <div className="context-menu-default-container setlist-plus-menu-container">
    <button
      onClick={
        (e) => {
          window.electron.sendAddImages();
          hideMenu();
        }
      }>
      Add Images
    </button>
    <button
      onClick={
        (e) => {
          window.electron.sendAddSongs();
          hideMenu();
        }
      }>
      Add Songs
    </button>
    <button
      onClick={
        (e) => {
          hideMenu();
          showModal(e, <NewSongModal />);
        }
      }
    >
      New Song
    </button>
  </div>
}

const Setlist: React.FC<{ setlist: SerializedMediaIdentifier[] | null }> = ({ setlist }) => {
  const { showMenu } = useContextMenu();
  const maxIdChars = setlist?.map<number>(x => x.id.toString().length).reduce((p, c) => c > p ? c : p, 0) ?? 0
  return <div className="setlist main-container">
    <div className="main-container-header">
      <h1 className="main-container-title">Media</h1>
      <div className="main-container-header-buttons-container">
        <button
          className="setlist-header-plus-button hi-1-button"
          onClick={(e) => { showMenu(e, <SetlistPlusMenu />) }}
        >
          +
        </button>
      </div>
    </div>
    <div className="setlist-items-container">
      {setlist?.map((x, i) => <SetlistItem key={i} maxIdChars={maxIdChars} item={x} />) ?? <></>}
    </div>
  </div >
};

export default Setlist;
