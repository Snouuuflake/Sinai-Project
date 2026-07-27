

import { DISPLAYS } from "../shared/constants";
import { encodeVerseId, SerializedImageMediaWithId, SerializedMediaWithId, SerializedSongMediaWithId, SongSection, SongVerse } from "../shared/media-classes";
import "./Controls.css";
import { CustomIPC } from "./IpcWsOnlyClient";
import LiveDisplayIndexArray from "./LiveDisplayIndexArray";
import { useModal } from "./ModalContext";
import TTButton from "./TTButton";
import { useUIState } from "./UIStateContext";


const ProjectToDisplayButton: React.FC<{
  id: number;
  index: number;
  element: number;
}> = ({ id, index, element }) => {
  const { liveElements } = useUIState();
  const isLive = liveElements[index] ?
    (
      liveElements[index].id === id
      && liveElements[index].element === element
    )
    : false;
  const onClickRemove = () => {
    CustomIPC.send(
      "set-live-element",
      index,
      null,
    );
  }
  const onClickProject = () => {
    CustomIPC.send(
      "set-live-element",
      index,
      {
        id: id,
        element: element,
      }
    );
  }
  return (
    <button
      className="project-to-display-button"
      style={{
        backgroundColor: isLive ? "var(--hi-1)" : "var(--gray-80)",
      }}
      onClick={
        isLive ? onClickRemove : onClickProject
      }
    >
      {index + 1}
    </button>
  )
}

const ProjectElementButtonModal: React.FC<{
  id: number, element: number
}> = ({ id, element }) => {
  const { hideModal } = useModal();
  const { liveElements } = useUIState();
  return (
    <div
      className="modal-main-container project-element-modal"
    >
      <button
        className="modal-text-exit-button text-only-button"
        onClick={() => {
          hideModal();
        }}
      >
        Salir
      </button>
      <div className="project-element-modal-project-to-display-buttons-container">
        {
          Array.from({ length: DISPLAYS }, (_x, i) => {
            return (
              <ProjectToDisplayButton
                key={`pebcm-${i}`}
                index={i}
                id={id}
                element={element}
              />
            )
          })
        }
      </div>
    </div>
  )
}

const ProjectElementButton: React.FC<{
  children: React.ReactNode;
  id: number;
  element: number;
}> = ({ children, id, element }) => {
  const { liveElements } = useUIState();
  const { showModal } = useModal();
  const isFullActive = liveElements.reduce(
    (p, c) => p && (c?.id === id && c?.element === element),
    true
  );
  const isPartlyActive = liveElements.reduce(
    (p, c) => p || (c?.id === id && c?.element === element),
    false
  );

  return <TTButton
    className={`project-element-button ${isFullActive ?
      "project-element-button-full-active" :
      isPartlyActive ?
        "project-element-button-partly-active" :
        ""
      }`}
    style={{}}
    onTimeout={
      () => {
        showModal(null, <ProjectElementButtonModal id={id} element={element} />)
      }
    }
    onConfirm={
      () => {
        for (let i = 0; i < DISPLAYS; i++) {
          CustomIPC.send(
            "set-live-element",
            i,
            {
              id: id,
              element: element,
            }
          );
        }
      }
    }
  >
    <div
      className={`project-element-button-inner `}
    >
      {children}
    </div>
  </TTButton >
}

const ImageControls:
  React.FC<{ openMedia: SerializedImageMediaWithId }>
  = ({ openMedia }) => {
    const ELEMENT = 0; // because it's only this one button
    return <div className="image-controls">
      <ProjectElementButton
        id={openMedia.id}
        element={ELEMENT}
      >
        <div className={`image-controls-project-button-inner `}>
          <div className="image-controls-project-button-left">
            <LiveDisplayIndexArray
              id={openMedia.id}
              element={ELEMENT}
            />
            <div className="image-contols-project-button-text">
              {
                openMedia.name.substring(0, Math.min(50, openMedia.name.length)) +
                (openMedia.name.length >= 50 ? "..." : "")
              }
            </div>
          </div>
          <img
            className="image-controls-image"
            src={`${window.location.origin}/fetch-setlist-media/${openMedia.id}`}

          />
        </div>
      </ProjectElementButton>
    </div>
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
  React.FC<{ id: number, section: SongSection }>
  = ({ id, section }) => {
    const verseButtons = section.verses.map(
      (v) => (
        <ProjectVerseButton
          id={id}
          key={`verse-${v.id}`}
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

const SongControls: React.FC<{
  openMedia: SerializedSongMediaWithId
}> = ({ openMedia }) => {
  return <>
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

const Controls: React.FC<{}> = () => {
  const { openMedia } = useUIState();
  return < div className="main-container main-controls" >
    {
      openMedia === null
        ? ""
        : openMedia.type === "image"
          ? <ImageControls openMedia={openMedia as SerializedImageMediaWithId} />
          : openMedia.type === "song"
            ? <SongControls openMedia={openMedia as SerializedSongMediaWithId} />
            : "can't open " + openMedia.name
    }
  </div>
}

export default Controls;
