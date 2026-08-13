import { encodeOrderedVerseId, SerializedSongMediaWithId, SongSection, SongVerse, Song, getSectionFromOrderedSection } from "../../shared/media-classes";

import ProjectElementButton from "./ProjectElementButton";
import LiveDisplayIndexArray from "./LiveDisplayIndexArray";

import "./SongControls.css";
import { useModal } from "../ModalContext";
import { useEffect, useRef, useState } from "react";

import { GripVertical, SquarePen, Copy, Trash2, Plus, ZapIcon } from "lucide-react";
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

const makeNewSectionName = (num: number) => {
  return `Nueva Sección (${num})`;
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
    return (
      <div className="edit-song-modal-section-list ">
        <div className="edit-song-modal-add-section-container">
          <button
            className="hi-1-button edit-song-modal-add-section-button"
            onClick={() => {
              let i = 1;
              let newSectionName: string = "";
              do {
                newSectionName = makeNewSectionName(i);
                i++
              } while (
                song.sections.some(s => s.name === newSectionName));


              const newSections = structuredClone(song.sections);
              const newId = newSections.length == 0 ? 0 :
                Math.max(...song.sections.map(s => s.id)) + 1;
              newSections.push({
                name: newSectionName,
                id: newId,
                verses: [],
              })
              const newOrder = [...song.elementOrder]
              newOrder.push(newId);
              const newSong: Song = { ...song, sections: newSections, elementOrder: newOrder };
              console.log(newSong);
              setSong(newSong);
            }}
          >
            Añadir sección
          </button>
        </div>
        <div className="edit-song-modal-section-list-items-container">
          {
            song.elementOrder.map(
              (id, i) => (
                <EditSongModalSectionListItem
                  key={i}
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
            )
          }
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
      </div >
    )
  }

function parseVerses(previousMaxId: number, text: string): SongVerse[] {
  const lines = text.split(/\r?\n/).map(l => l.trim());
  let verseIdCounter: number = previousMaxId;
  console.log(lines);
  const verses: SongVerse[] = lines.reduce<SongVerse[]>(
    (p, c, i) => {
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
    const textareaRef = useRef<HTMLDivElement>(null);
    const textareaContent = useRef<string>(initialText);
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.innerText = initialText
      }
    }, [sectionId]);
    const [nameValue, setNameValue] = useState<string>(openSection.name);
    // const initialName = openSection.name;
    // const nameInputRef = useRef<HTMLDivElement>(null);
    // const nameInputContent = useRef<string>(initialName);
    // useEffect(() => {
    //   if (nameInputRef.current) {
    //     nameInputRef.current.innerText = initialName
    //   }
    // }, [sectionId])
    return (
      <div className="edit-song-modal-section-editor"
        style={{
          zIndex: 1000
        }}
      >
        <div className="main-container-header edit-song-modal-section-editor-header">
          <div>Nombre: </div>
          <input
            value={nameValue}
            onInput={(event) => {
              setNameValue((event.target as HTMLInputElement).value);
            }}
          />
        </div>
        <div
          ref={textareaRef}
          contentEditable="plaintext-only"
          className="edit-song-modal-textarea"
          onInput={(e) => {
            if (e.target instanceof HTMLDivElement) {
              textareaContent.current = (e.target.innerText ?? "")
            }
          }}
          onPaste={(e) => { }}
        >
        </div>
        <div className="edit-song-modal-section-editor-buttons-container">
          <button
            className="hi-1-button"
            onClick={() => {
              const newNameTrimmed = nameValue.trim();
              if (
                newNameTrimmed !== openSection.name &&
                song.sections.find(s => s.name === newNameTrimmed)
              ) {

                (window as unknown as UIWindow).electron.sendAlert("Ya existe una sección con el mismo nombre.");
                return;
              }
              if (newNameTrimmed === "") {
                (window as unknown as UIWindow).electron.sendAlert("El nombre de la sección está vació.");
                return;
              }
              const newSection = structuredClone(openSection);
              newSection.name = newNameTrimmed;
              const currentMaxId = openSection.verses.length == 0 ? 0 : Math.max(...openSection.verses.map(s => s.id));
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
            Guardar
          </button>
          <button onClick={() => {
            setOpenSection(null);
          }}>
            Cancelar
          </button>
        </div>
      </div >
    )
  }

const EditSongModal:
  React.FC<{ song: Song, mediaId: number }>
  = ({ song, mediaId }) => {
    const { hideModal } = useModal();
    const [localSong, setLocalSong] = useState<Song>(structuredClone(song));
    const [openSection, setOpenSection] = useState<number | null>(null);

    return <div className="edit-song-modal-container"
    >
      <div className="edit-song-modal-header"
      >
        {/* <h1 */}
        {/*   className="main-container-title" */}
        {/* >Editando Canción: */}
        {/* </h1> */}
        <div>Título: </div>
        <input
          value={localSong.properties.title}
          onChange={(e) => {
            const newTitle = e.target.value;
            setLocalSong({ ...localSong, properties: { ...localSong.properties, title: newTitle } });
          }}
        />
        <div>Autor:</div>
        <input
          value={localSong.properties.author}
          onChange={(e) => {
            const newAuthor = e.target.value;
            setLocalSong({ ...localSong, properties: { ...localSong.properties, author: newAuthor } });
          }}
        />
      </div>
      {
        openSection === null ? <></> :
          <>
            <EditSongModalSectionEditor
              key={openSection}
              song={localSong}
              setSong={setLocalSong}
              setOpenSection={setOpenSection}
              sectionId={openSection}
            />
            <div style={{
              "position": "absolute",
              top: "0",
              bottom: "0",
              left: "0",
              right: "0",
              background: "var(--gray-95)",
              opacity: "0.8",
              zIndex: "0"
            }}>
            </div>
          </>
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
          if (localSong.properties.title.trim() === "") {
            (window as unknown as UIWindow).electron.sendAlert("Song has no title!");
            setLocalSong(
              {
                ...localSong,
                properties: {
                  title: localSong.properties.title.trim(),
                  author: localSong.properties.author.trim(),
                }
              }
            );
            return;
          }
          (window as unknown as UIWindow).electron.sendReplaceSong(mediaId,
            {
              ...localSong,
              properties: {
                title: localSong.properties.title.trim(),
                author: localSong.properties.author.trim(),
              }
            }
          );
          hideModal();
        }}
      >
        Actualizar cambios
      </button>
      <button
        className="edit-song-modal-cancel-button"
        onClick={() => { hideModal() }}
      >
        Cancelar
      </button>
    </div>
  }


const ProjectVerseButton:
  React.FC<{
    id: number;
    sectionId: number,
    orderedSectionId: number,
    verse: SongVerse,
  }>
  = ({ id, sectionId, orderedSectionId, verse }) => {
    const { selectedLiveElementId } = useUIState();
    const buttonToFocus = useRef<HTMLButtonElement>(null);
    const selected = encodeOrderedVerseId(orderedSectionId, verse.id) === selectedLiveElementId;
    useEffect(
      () => {
        if (buttonToFocus.current === null)
          return;
        if (selected) {
          buttonToFocus.current.scrollIntoView(
            {
              behavior: "smooth",
              block: "center"
            }
          );
        }
      },
      [selectedLiveElementId]
    );
    useEffect(
      () => {
      },
      [selectedLiveElementId]
    );
    return (
      <ProjectElementButton
        id={id}
        element={encodeOrderedVerseId(orderedSectionId, verse.id)}
        ref={buttonToFocus}
        selected={selected}
      >
        <div className="song-project-button-inner" >
          <LiveDisplayIndexArray
            id={id}
            element={encodeOrderedVerseId(orderedSectionId, verse.id)}
          />
          <div
          >
            {
              verse.lines.reduce<any[]>((p, c, i) => {
                p.push(<div key={i}>{c}</div>)
                return p;
              }, [])
            }</div>
        </div>

      </ProjectElementButton>
    )
  }

const SectionContainer:
  React.FC<{ id: number, section: SongSection, orderedSectionId: number }>
  = ({ id, section, orderedSectionId }) => {
    const verseButtons = section.verses.map(
      (v) => (
        <ProjectVerseButton
          id={id}
          key={`verse-${v.id}`}
          sectionId={section.id}
          orderedSectionId={orderedSectionId}
          verse={v}
        />
      )
    )
    return (
      <div>
        <h2 className="controls-section-header">{section.name}</h2>
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
    const { showModal } = useModal()
    return <>
      <div className="main-container-header ">
        {/* TODO: icon */}
        <h1 className="main-container-title">Controles de canción</h1>
        <div className="main-container-header-buttons-container">
          <button
            className="song-controls-edit-button main-container-button"
            onClick={
              (e) => {
                showModal(e,
                  <EditSongModal song={openMedia.value.song} mediaId={openMedia.id} />)
              }
            }
          >
            Editar
          </button>
          <button
            className="song-controls-edit-button main-container-button"
            onClick={
              (_e) => {
                (window as unknown as UIWindow).electron.sendSaveSong(openMedia.id);
              }
            }
          >
            Guardar
          </button>
        </div>
      </div>
      <div className="song-controls-song-container" tabIndex={-1}>
        {openMedia.value.song.elementOrder.map((id, i) =>
          <SectionContainer
            id={openMedia.id}
            key={`section-${i}`}
            section={openMedia.value.song.sections.find(s => s.id == id)!}
            orderedSectionId={i}
          />
        )}
        {<div style={{ height: "5px" }}></div>}
      </div>
    </>
  }

export default SongControls;
