import { encodeVerseId, SerializedSongMediaWithId, SongSection, SongVerse, Song } from "../../shared/media-classes";

import ProjectElementButton from "./ProjectElementButton";
import LiveDisplayIndexArray from "./LiveDisplayIndexArray";

import "./SongControls.css";
import { useContextMenu } from "../ContextMenuContext";
import { useModal } from "../ModalContext";
import { useRef, useState } from "react";

import { GripVertical, SquarePen } from "lucide-react";


const EditSongModalSectionListItem:
  React.FC<{
    song: Song;
    sectionId: number;
    index: number;
    onDragStart: (index: number) => void;
    onDrop: (index: number) => void;
    onEdit: (index: number) => void;
  }>
  = ({
    song,
    sectionId,
    index,
    onDragStart,
    onDrop,
    onEdit,
  }) => {
    const [isBeingDraggedOver, setIsBeingDraggedOver] = useState<boolean>(false);
    return (
      <div
        className="edit-song-modal-section-list-item"
        style={isBeingDraggedOver ? {
          color: "var(--gray-60)",
          backgroundColor: "var(--gray-90)",
        } : {}
        }
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          onDragStart(index);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDragEnter={() => {
          setIsBeingDraggedOver(true);
        }}
        onDragLeave={() => {
          setIsBeingDraggedOver(false);
          // setIsBeingDragged(true);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsBeingDraggedOver(false);
          onDrop(index);
        }}
      >
        <GripVertical size={15} />
        <div className="edit-song-modal-section-list-item-name">
          {song.sections.find(s => s.id == sectionId)!.name}
        </div>
        <button className="edit-song-modal-section-list-item-edit-button">
          <SquarePen size={30} />
        </button>
      </div >
    )
  }

const EditSongModalSectionList:
  React.FC<{
    song: Song;
    setSong: (song: Song) => void;
    onEdit: (index: number) => void;
  }
  > = ({ song, setSong, onEdit }) => {
    const indexBeingDragged = useRef<number | null>(null);
    return (
      <div className="edit-song-modal-section-list">
        {song.elementOrder.map(
          (id, i) => (
            <EditSongModalSectionListItem
              song={song}
              sectionId={id}
              index={i}
              onDragStart={
                (index) => {
                  indexBeingDragged.current = index;
                }
              }
              onDrop={
                (index) => {
                  if (indexBeingDragged.current === null ||
                    indexBeingDragged.current === index) {
                    return;
                  }
                  const newOrder = [...song.elementOrder];
                  const draggedItem = newOrder[indexBeingDragged.current];
                  newOrder.splice(indexBeingDragged.current, 1);
                  newOrder.splice(index, 0, draggedItem);
                  setSong({ ...song, elementOrder: newOrder });
                }
              }
              onEdit={onEdit}
            />
          )
        )}
      </div>
    )
  }

const EditSongModal:
  React.FC<{ song: Song }>
  = ({ song }) => {
    const { hideModal } = useModal();
    const [localSong, setLocalSong] = useState<Song>(structuredClone(song));
    const [openSection, setOpenSection] = useState<number | null>(null);

    return <div className="edit-song-modal-container">
      <div className="main-container-header ">
        <h1
          className="main-container-title"
        >Edit Song: {song.properties.title}
        </h1>
        <div className="main-container-header-buttons-container">
          <button
            className="hi-1-button song-controls-edit-button"
            onClick={
              (_e) => {
                hideModal();
              }
            }
          >
            X
          </button>
        </div>
      </div>
      <div>
        {localSong.sections.find(s => s.id === openSection)?.name ?? "null"}
      </div>
      <div className="edit-song-modal-body">
        <EditSongModalSectionList
          song={localSong}
          setSong={setLocalSong}
          onEdit={(index) => { setOpenSection(index) }}
        />
      </div>
    </div>
  }


const ProjectVerseButton:
  React.FC<{
    id: number;
    sectionId: number,
    verse: SongVerse,
  }>
  = ({ id, sectionId, verse }) => {
    return (
      <ProjectElementButton
        id={id}
        element={encodeVerseId(sectionId, verse.id)}
      >
        <div className="song-project-button-inner">
          <LiveDisplayIndexArray
            id={id}
            element={encodeVerseId(sectionId, verse.id)}
          />
          <div>{
            verse.lines.reduce((p, c, i, a) => p + c + (i == (a.length - 1) ? "" : "\n"), "")
          }</div>
        </div>

      </ProjectElementButton>
    )
  }

const SectionContainer:
  React.FC<{ id: number, section: SongSection }>
  = ({ id, section }) => {
    const verseButtons = section.verses.map(
      (v, i) => (
        <ProjectVerseButton
          id={id}
          key={`verse-${i}`}
          sectionId={section.id}
          verse={v}
        />
      )
    )
    return (
      <div>
        <h2 className="song-controls-section-header">{section.name}</h2>
        <div className="song-controls-section-verses-container">
          {verseButtons}
        </div>
      </div>
    )
  }

const SongControls:
  React.FC<{ openMedia: SerializedSongMediaWithId }>
  = ({ openMedia }) => {
    const { showModal, hideModal } = useModal()
    return <>
      <div className="main-container-header ">
        {/* TODO: icon */}
        <h1 className="main-container-title">Song Controls</h1>
        <div className="main-container-header-buttons-container">
          <button
            className="hi-1-button song-controls-edit-button"
            onClick={
              (e) => {
                showModal(e, <EditSongModal song={openMedia.value.song} />)
              }
            }
          >
            Edit
          </button>
        </div>
      </div>
      <div className="song-controls-song-container">
        {openMedia.value.song.elementOrder.map((id, i) =>
          <SectionContainer
            id={openMedia.id}
            key={`section-${i}`}
            section={openMedia.value.song.sections.find(s => s.id == id)!}
          />
        )}
        {<div style={{ height: "5px" }}></div>}
      </div>
      {/* <ProjectElementButton */}
      {/*   id={openMedia.id} */}
      {/*   element={ELEMENT} */}
      {/* > */}
      {/*   <div className={`image-controls-project-button-inner `}> */}
      {/*     <div className="image-controls-project-button-left"> */}
      {/*       <LiveDisplayIndexArray */}
      {/*         id={openMedia.id} */}
      {/*         element={ELEMENT} */}
      {/*       /> */}
      {/*       <div className="image-contols-project-button-text"> */}
      {/*         {openMedia.name} */}
      {/*       </div> */}
      {/*     </div> */}
      {/*     <img */}
      {/*       className="image-controls-image" */}
      {/*       src={`fetch-media://${openMedia.id}`} */}
      {/*     /> */}
      {/*   </div> */}
      {/* </ProjectElementButton> */}
    </>
  }

export default SongControls;
