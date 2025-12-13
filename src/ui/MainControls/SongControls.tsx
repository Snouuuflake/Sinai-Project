import { encodeVerseId, SerializedSongMediaWithId, SongSection, SongVerse, Song } from "../../shared/media-classes";

import ProjectElementButton from "./ProjectElementButton";
import LiveDisplayIndexArray from "./LiveDisplayIndexArray";

import "./SongControls.css";
import { useContextMenu } from "../ContextMenuContext";
import { useModal } from "../ModalContext";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { GripVertical, SquarePen, Copy, Trash2, Plus, Check } from "lucide-react";
import { useUIState } from "../UIStateContext";


const EditSongModalSectionListItem:
  React.FC<{
    song: Song;
    sectionId: number;
    index: number;
    onDragStart: (index: number) => void;
    onDrop: (index: number) => void;
    onEdit: (id: number) => void;
    onCopy: (id: number) => void;
  }>
  = ({
    song,
    sectionId,
    index,
    onDragStart,
    onDrop,
    onEdit,
    onCopy,
  }) => {
    const [isBeingDraggedOver, setIsBeingDraggedOver] = useState<boolean>(false);
    return (
      <div
        className="edit-song-modal-section-list-item droppable"
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
        onDragEnter={(e) => {
          e.preventDefault();
          setIsBeingDraggedOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsBeingDraggedOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsBeingDraggedOver(false);
          onDrop(index);
        }}
      >
        <GripVertical size={15} style={{
          color: isBeingDraggedOver ? "gray" : ""
        }} />
        <div
          className="edit-song-modal-section-list-item-name"
          style={{
            color: isBeingDraggedOver ? "gray" : ""
          }}
        >
          {song.sections.find(s => s.id == sectionId)!.name}
        </div>
        <button
          className="edit-song-modal-section-list-item-icon-button"
          style={{
            color: isBeingDraggedOver ? "gray" : ""
          }}
          onClick={() => {
            onCopy(sectionId);
          }}
        >
          <Copy size={15} />
        </button>
        <button
          className="edit-song-modal-section-list-item-icon-button"
          style={{
            color: isBeingDraggedOver ? "gray" : ""
          }}
          onClick={() => {
            onEdit(sectionId);
          }}
        >
          <SquarePen size={15} />
        </button>
      </div >
    )
  }

const EditSongModalTrash:
  React.FC<{ onDrop: () => void }>
  = ({ onDrop }) => {
    const [isBeingDraggedOver, setIsBeingDraggedOver] = useState<boolean>(false);
    return (
      <div
        className="edit-song-modal-trash droppable"
        style={isBeingDraggedOver ? {
          color: "var(--bg)",
          backgroundColor: "var(--hi-1)"
        } : {}}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsBeingDraggedOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsBeingDraggedOver(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={() => {
          setIsBeingDraggedOver(false);
          onDrop();
        }}
      >
        <Trash2 />
      </div>

    )
  }

const EditSongModalSectionList:
  React.FC<{
    song: Song;
    setSong: (song: Song) => void;
    onEdit: (id: number) => void;
    onCopy: (id: number) => void;
  }
  > = ({ song, setSong, onEdit, onCopy }) => {
    const indexBeingDragged = useRef<number | null>(null);
    const newSectionName = useRef<string>("");
    return (
      <div className="edit-song-modal-section-list ">
        <div className="edit-song-modal-add-section-container">
          <input
            className="edit-song-modal-add-section-input"
            type="text"
            onInput={(e) => {
              if (e.target instanceof HTMLInputElement) {
                newSectionName.current = e.target.value.trim();
              }
            }}
          >
          </input>
          <button
            className="hi-1-button edit-song-modal-add-section-button"
            onClick={() => {
              if (
                song.sections.filter(
                  s => s.name === newSectionName.current
                ).length == 0
                && newSectionName.current !== ""
              ) {
                const newSections = structuredClone(song.sections);
                const newId = Math.max(...song.sections.map(s => s.id)) + 1;
                newSections.push({
                  name: newSectionName.current,
                  id: newId,
                  verses: [],
                })
                const newOrder = [...song.elementOrder]
                newOrder.push(newId);
                const newSong: Song = { ...song, sections: newSections, elementOrder: newOrder };
                console.log(newSong);
                setSong(newSong);
              }
            }}
          >
            <Plus size={18} strokeWidth="4" />
          </button>
        </div>
        <div className="edit-song-modal-section-list-items-container">
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
                    indexBeingDragged.current = null;
                    setSong({ ...song, elementOrder: newOrder });
                  }
                }
                onEdit={onEdit}
                onCopy={onCopy}
              />
            )
          )}
        </div>
        <EditSongModalTrash onDrop={() => {
          if (indexBeingDragged.current === null) {
            return;
          }
          const newOrder = [...song.elementOrder];
          const newSections = structuredClone(song.sections);
          const idBeingDragged = song.elementOrder[
            indexBeingDragged.current as number
          ];

          if (newOrder.filter(x => x == idBeingDragged).length == 1) {
            newSections.splice(
              newSections.findIndex(s => s.id == idBeingDragged),
              1
            )
          }
          newOrder.splice(indexBeingDragged.current, 1);
          const newSong: Song = {
            ...song, elementOrder: newOrder, sections: newSections
          };
          indexBeingDragged.current = null;
          console.log(newSong);
          setSong(newSong);
        }} />
      </div>
    )
  }

function parseVerses(previousMaxId: number, text: string): SongVerse[] {
  const lines = text.split(/\r?\n/).map(l => l.trim());
  let verseIdCounter: number = previousMaxId;
  console.log(lines);
  const verses: SongVerse[] = lines.reduce<SongVerse[]>(
    (p, c, i, a) => {
      if (i == 0 || c === "") {
        p.push({
          id: ++verseIdCounter,
          lines: []
        })
      }
      if (c !== "") {
        p[p.length - 1].lines.push(c)
      }
      return p;
    },
    []
  ).flatMap(v => v.lines.length == 0 ? [] : v)
  return verses;
}

const EditSongModalSectionEditor:
  React.FC<{
    song: Song;
    setSong: (song: Song) => void;
    setOpenSection: (id: number | null) => void;
    sectionId: number;
  }> = ({ song, setSong, setOpenSection, sectionId }) => {
    const openSection: SongSection = song.sections.find(s => s.id == sectionId)!;
    const initialText = openSection.verses.reduce(
      (p, c, i, a) => p +
        c.lines.reduce(
          (p, c, i, a) => p + c + (i == (a.length - 1) ? "" : "\n"), ""
        )
        + (i == (a.length - 1) ? "" : "\n\n"), ""
    );
    console.log(initialText)
    const textareaRef = useRef<HTMLDivElement>(null);
    const textareaContent = useRef<string>(
      initialText
    )
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.innerText = initialText
      }
    }, [sectionId])
    return (
      <div className="edit-song-modal-section-editor">
        <div className="main-container-header edit-song-modal-section-editor-header">
          <h2 className="edit-song-modal-section-editor-title">
            {openSection.name}
          </h2>
          <button
            className="edit-song-modal-setion-editor-save-button"
            onClick={() => {
              const newSection = structuredClone(openSection);
              const currentMaxId = Math.max(...song.sections.map(s => s.id));
              newSection.verses = parseVerses(currentMaxId, textareaContent.current);
              const newSections = structuredClone(song.sections)
              newSections.splice(
                newSections.findIndex(s => s.id == newSection.id),
                1,
                newSection
              );
              const newSong = { ...song, sections: newSections }
              console.log(newSong);
              setSong(newSong);
              setOpenSection(null);
            }}
          >
            Save
          </button>
        </div>
        <div
          ref={textareaRef}
          contentEditable
          className="edit-song-modal-textarea"
          onInput={(e) => {
            if (e.target instanceof HTMLDivElement) {
              textareaContent.current = (e.target.innerText ?? "")
              // console.log(textareaContent.current)
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            textareaContent.current += text.replace(/\r?\n/, "\n");
            if (textareaRef.current !== null)
              textareaRef.current.innerText = textareaContent.current;
          }}
        >
        </div>
      </div>
    )
  }

const EditSongModal:
  React.FC<{ song: Song, mediaId: number }>
  = ({ song, mediaId }) => {
    const { hideModal } = useModal();
    const [localSong, setLocalSong] = useState<Song>(structuredClone(song));
    const [openSection, setOpenSection] = useState<number | null>(null);

    return <div className="edit-song-modal-container">
      <div className="edit-song-modal-header">
        <h1
          className="main-container-title"
        >Edit Song:
        </h1>
        <input
          value={localSong.properties.title}
          onChange={(e) => {
            const newTitle = e.target.value;
            setLocalSong({ ...localSong, properties: { ...localSong.properties, title: newTitle } });
          }}
        ></input>
        <div>by</div>
        <input
          value={localSong.properties.author}
          onChange={(e) => {
            const newAuthor = e.target.value;
            setLocalSong({ ...localSong, properties: { ...localSong.properties, author: newAuthor } });
          }}
        > </input>
      </div>
      {
        openSection === null ? <></> :
          <EditSongModalSectionEditor
            key={openSection}
            song={localSong}
            setSong={setLocalSong}
            setOpenSection={setOpenSection}
            sectionId={openSection}
          />
      }
      <EditSongModalSectionList
        song={localSong}
        setSong={setLocalSong}
        onEdit={(index) => { setOpenSection(index) }}
        onCopy={(id) => {
          const newOrder = [...localSong.elementOrder];
          newOrder.push(id);
          setLocalSong({ ...localSong, elementOrder: newOrder })
        }}
      />
      <button
        className="edit-song-modal-save-button hi-1-button"
        onClick={() => {
          if (localSong.properties.title === "") {
            window.electron.sendAlert("Song has no title!");
            return;
          }
          window.electron.sendReplaceSong(mediaId, localSong);
          hideModal();
        }}
      >
        Save
      </button>
      <button
        className="edit-song-modal-cancel-button"
        onClick={() => { hideModal() }}
      >
        Cancel
      </button>
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
            verse.lines.reduce<any[]>((p, c, i, a) => {
              p.push(<div>{c}</div>)
              return p;
            }, [])
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
    console.log(openMedia);
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
                showModal(e,
                  <EditSongModal song={openMedia.value.song} mediaId={openMedia.id} />)
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
    </>
  }

export default SongControls;
