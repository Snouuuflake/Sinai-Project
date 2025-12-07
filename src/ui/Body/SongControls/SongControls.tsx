import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { GlobalContext } from "../../GlobalContext";
import VerseButton from "./VerseButton";
import Icon from "../../Icon";
import ConfirmKillButton from "../../ConfirmKillButton";
import AddVerseButton from "./AddVerseButton";
import AddBibleButton from "./AddBibleButton";
import "../general-icon-button.css";
import "./SongControls.css";

function makeNoteTitle(text: string) {
  return (
    <>
      <b>Note: </b> {text}
    </>
  );
}

function SongControls({ openSong }: { openSong: OpenSongType }) {
  const [selected, setSelected] = useState<LiveSongReference>(
    openSong.selected,
  );
  const superSetSelected = (value: LiveSongReference) => {
    openSong.selected = value;
    setSelected(value);
  };
  const selectedState = { value: selected, set: superSetSelected };

  // useState is lazy somehow..
  useEffect(() => {
    selectedState.set(openSong.selected);
  }, [openSong]);

  const newElementText = useRef<string>("");
  const { openElements, liveElements, canType } = useContext(
    GlobalContext,
  ) as GlobalContextType;

  const lyricSectionOrder = openSong.song.sectionOrder.filter(
    (sei) => sei.type === "section" || sei.type === "repeat",
  );

  type VerseButtonHandle = {
    enterHandler: () => void;
    reference: LiveSongReference;
  };
  const verseButtonRefs = useRef<VerseButtonHandle[]>([]);
  const setVerseButtonRef = useCallback((index: number) => {
    return (vb: VerseButtonHandle) => {
      verseButtonRefs.current[index] = vb;
    };
  }, []);

  useEffect(() => {
    function keyHandler(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (!target.classList.contains("text-input") && !canType.current) {
        switch (event.key) {
          case "ArrowUp":
            event.preventDefault();
            if (selectedState.value.verseID > 0) {
              selectedState.set({
                ...selectedState.value,
                verseID: selectedState.value.verseID - 1,
              });
            } else if (selectedState.value.sectionID > 0) {
              selectedState.set({
                ...selectedState.value,
                sectionID: selectedState.value.sectionID - 1,
                verseID:
                  openSong.song.sections.find(
                    (s) =>
                      s.name ===
                      lyricSectionOrder[selectedState.value.sectionID - 1].name,
                  )!.verses.length - 1,
              });
            }
            break;
          case "ArrowDown":
            event.preventDefault();

            if (
              selectedState.value.verseID <
              openSong.song.sections.find(
                (s) =>
                  s.name ===
                  lyricSectionOrder[selectedState.value.sectionID].name,
              )!.verses.length -
                1
            ) {
              selectedState.set({
                ...selectedState.value,
                verseID: selectedState.value.verseID + 1,
              });
            } else if (
              selectedState.value.sectionID <
              lyricSectionOrder.length - 1
            ) {
              selectedState.set({
                ...selectedState.value,
                sectionID: selectedState.value.sectionID + 1,
                verseID: 0,
              });
            }

            break;
          case " ":
          case "Enter":
            event.preventDefault();
            verseButtonRefs.current.forEach((vb, _i) => {
              //console.log(i,vb.reference.sectionID, vb.reference.verseID, vb.enterHandler)
              vb.enterHandler();
            });
          default:
            break;
        }
      }
    }

    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("keydown", keyHandler);
    };
  }, [selectedState.value]);

  let buttonIDCounter: number = -1;
  let sIndex: number = -1;
  console.log(openSong);
  const updateState = () => {
    openElements.set([...openElements.value]);
  };
  return [
    <div className="section-controls" key="sectioncontrols">
      <div className="inverse-title-container margin-bottom-7">
        <div className="inverse-title">Song Sections</div>
        <button
          className="inverse-title-button"
          onClick={() => {
            window.electron.invokeSaveSong(openSong.song).then(
              () => {
                console.log("wrote song");
              },
              (e) => {
                console.log("error writing song: " + e.message);
                window.electron.sendAlert(e.message);
              },
            );
          }}
        >
          Save Song
        </button>
      </div>
      {openSong.song.sectionOrder.map((sei, seiIndex) => {
        return (
          <div key={`sc${seiIndex}`} className="section-controls-row">
            <div className="section-row-text">
              {sei.type === "section" || sei.type === "repeat"
                ? sei.name
                : makeNoteTitle(
                    openSong.song.notes.find((n) => n.name === sei.name)!.text,
                  )}
            </div>
            {sei.type !== "note" ? (
              <button
                className="general-icon-button"
                onClick={() => {
                  openSong.song.sectionOrder.splice(seiIndex + 1, 0, {
                    type: "repeat",
                    name: sei.name,
                  });
                  if (selectedState.value.sectionID > seiIndex) {
                    selectedState.set({
                      ...selectedState.value,
                      sectionID: selectedState.value.sectionID + 1,
                    });
                  }
                  liveElements.map((le, _i) => {
                    if (le.type !== "text") return le;
                    if (le.reference.object != openSong.song) return le;
                    if (le.reference.sectionID > seiIndex) {
                      return {
                        ...le,
                        reference: {
                          ...le.reference,
                          sectionID: le.reference.sectionID + 1,
                        },
                      };
                    }
                    return le;
                  });
                  // !! for deleting, we need to check if we're deleting the definition, if so, take the nearest repetition and make it definition, or, if none, ask the user if theyre sure
                  updateState();
                }}
              >
                <Icon code="C" />
              </button>
            ) : (
              ""
            )}
            <ConfirmKillButton
            className=""
              callback={() => {
                if (sei.type === "section" || sei.type === "repeat") {
                  const lyricSectionIndex = lyricSectionOrder.indexOf(sei);
                  if (selectedState.value.sectionID > lyricSectionIndex) {
                    selectedState.set({
                      ...selectedState.value,
                      sectionID: selectedState.value.sectionID - 1,
                    });
                  } else if (
                    selectedState.value.sectionID == lyricSectionIndex
                  ) {
                    if (lyricSectionIndex == 0) {
                      selectedState.set({ ...selectedState.value, verseID: 0 });
                    } else {
                      selectedState.set({
                        ...selectedState.value,
                        sectionID: selectedState.value.sectionID - 1,
                        verseID: 0,
                      });
                    }
                  }
                  liveElements.map((le, _i) => {
                    if (le.type !== "text") return le;
                    if (le.reference.sectionID > lyricSectionIndex) {
                      return {
                        ...le,
                        reference: {
                          ...le.reference,
                          sectionID: selectedState.value.sectionID - 1,
                        },
                      };
                    } else if (le.reference.sectionID == lyricSectionIndex) {
                      if (lyricSectionIndex == 0) {
                        return {
                          type: "none",
                          value: "",
                          reference: {
                            object: null,
                          },
                        };
                      } else {
                        return {
                          ...le,
                          reference: {
                            ...le.reference,
                            verseID: 0,
                            sectionID: le.reference.sectionID - 1,
                          },
                        };
                      }
                    }
                    return le;
                  });
                }

                if (sei.type === "repeat") {
                  openSong.song.sectionOrder.splice(seiIndex, 1);
                } else if (sei.type === "section") {
                  if (
                    openSong.song.sectionOrder.filter(
                      (sei2) =>
                        sei2.name === sei.name && sei2.type === "repeat",
                    ).length != 0
                  ) {
                    openSong.song.sectionOrder.find(
                      (sei2) =>
                        sei2.name === sei.name && sei2.type === "repeat",
                    )!.type = "section";
                    openSong.song.sectionOrder.splice(seiIndex, 1);
                  } else {
                    openSong.song.sectionOrder.splice(seiIndex, 1);
                    openSong.song.sections.splice(
                      openSong.song.sections.indexOf(
                        openSong.song.sections.find(
                          (s) => s.name === sei.name,
                        )!,
                      ),
                      1,
                    );
                  }
                } else if (sei.type === "note") {
                  openSong.song.sectionOrder.splice(seiIndex, 1);
                  openSong.song.notes.splice(
                    openSong.song.notes.indexOf(
                      openSong.song.notes.find((n) => n.name === sei.name)!,
                    ),
                    1,
                  );
                }
                updateState();
              }}
            />
            <button
              className="general-icon-button"
              onClick={() => {
                if (seiIndex > 0) {
                  [
                    openSong.song.sectionOrder[seiIndex - 1],
                    openSong.song.sectionOrder[seiIndex],
                  ] = [
                    openSong.song.sectionOrder[seiIndex],
                    openSong.song.sectionOrder[seiIndex - 1],
                  ];
                  if (
                    (openSong.song.sectionOrder[seiIndex - 1].type ===
                      "section" ||
                      openSong.song.sectionOrder[seiIndex - 1].type ===
                        "repeat") &&
                    (openSong.song.sectionOrder[seiIndex].type === "section" ||
                      openSong.song.sectionOrder[seiIndex].type === "repeat")
                  ) {
                    // swapping selected
                    if (selectedState.value.sectionID == seiIndex) {
                      selectedState.set({
                        ...selectedState.value,
                        sectionID: selectedState.value.sectionID - 1,
                      });
                    } else if (selectedState.value.sectionID == seiIndex - 1) {
                      selectedState.set({
                        ...selectedState.value,
                        sectionID: selectedState.value.sectionID + 1,
                      });
                    }
                    // swapping liveElements
                    liveElements.map((le, _i) =>
                      le.type === "text" &&
                      le.reference.object === openSong.song
                        ? le.reference.sectionID == seiIndex
                          ? {
                              ...le,
                              reference: {
                                ...le.reference,
                                sectionID: le.reference.sectionID - 1,
                              },
                            }
                          : le.reference.sectionID == seiIndex - 1
                            ? {
                                ...le,
                                reference: {
                                  ...le.reference,
                                  sectionID: le.reference.sectionID + 1,
                                },
                              }
                            : le
                        : le,
                    );
                  }
                  updateState();
                }
              }}
            >
              <Icon code="U" />
            </button>
            <button
              className="general-icon-button"
              onClick={() => {
                if (seiIndex < openSong.song.sectionOrder.length - 1) {
                  [
                    openSong.song.sectionOrder[seiIndex + 1],
                    openSong.song.sectionOrder[seiIndex],
                  ] = [
                    openSong.song.sectionOrder[seiIndex],
                    openSong.song.sectionOrder[seiIndex + 1],
                  ];
                  if (
                    (openSong.song.sectionOrder[seiIndex + 1].type ===
                      "section" ||
                      openSong.song.sectionOrder[seiIndex + 1].type ===
                        "repeat") &&
                    (openSong.song.sectionOrder[seiIndex].type === "section" ||
                      openSong.song.sectionOrder[seiIndex].type === "repeat")
                  ) {
                    // swapping selected
                    if (selectedState.value.sectionID == seiIndex) {
                      selectedState.set({
                        ...selectedState.value,
                        sectionID: selectedState.value.sectionID + 1,
                      });
                    } else if (selectedState.value.sectionID == seiIndex + 1) {
                      selectedState.set({
                        ...selectedState.value,
                        sectionID: selectedState.value.sectionID - 1,
                      });
                    }
                    // swapping liveElements
                    liveElements.map((le, _i) =>
                      le.type === "text" && le.reference.object == openSong.song
                        ? le.reference.sectionID == seiIndex
                          ? {
                              ...le,
                              reference: {
                                ...le.reference,
                                sectionID: le.reference.sectionID + 1,
                              },
                            }
                          : le.reference.sectionID == seiIndex + 1
                            ? {
                                ...le,
                                reference: {
                                  ...le.reference,
                                  sectionID: le.reference.sectionID - 1,
                                },
                              }
                            : le
                        : le,
                    );
                  }
                  updateState();
                }
              }}
            >
              <Icon code="D" />
            </button>
          </div>
        );
      })}
      <div className="new-element-container">
        <input
          className="dark-material-input text-input"
          type="text"
          onFocus={() => {
            canType.current = true;
          }}
          onBlur={() => {
            canType.current = false;
          }}
          onChange={(event) => {
            newElementText.current = event.target.value.trim();
          }}
        ></input>
        <button
          className="new-element-button"
          onClick={() => {
            if (!newElementText.current) {
              return;
            }

            let noteID: number = 0;
            while (
              openSong.song.notes.find((n) => n.name === `note${noteID}`)
            ) {
              noteID++;
              if (noteID >= Number.MAX_SAFE_INTEGER) {
                return;
              }
            }
            const newNoteName = `note${noteID}`;
            openSong.song.notes.push({
              name: newNoteName,
              text: newElementText.current,
            });

            openSong.song.sectionOrder.push({
              name: newNoteName,
              type: "note",
            });

            updateState();
          }}
        >
          <div className="new-element-button-content">+N</div>
        </button>
        <button
          className="new-element-button"
          onClick={() => {
            if (
              !openSong.song.sections.find(
                (s) => s.name === newElementText.current,
              ) &&
              newElementText.current
            ) {
              openSong.song.sections.push({
                name: newElementText.current,
                verses: [],
              });
              openSong.song.sectionOrder.push({
                name: newElementText.current,
                type: "section",
              });

              updateState();
            }
          }}
        >
          <div className="new-element-button-content">+S</div>
        </button>
      </div>
    </div>,
    ...openSong.song.sectionOrder.flatMap((sei, seiIndex) => {
      if (sei.type === "section" || sei.type === "repeat") {
        const currentSection = openSong.song.sections.find(
          (s) => s.name == sei.name,
        )!;
        sIndex++;
        return [
          <h3
            key={`s${seiIndex}`}
            className="section-title"
            style={{ marginTop: seiIndex == 0 ? 0 : "" }}
          >
            {sei.name}
          </h3>,

          currentSection.verses.map((_v, vIndex) => {
            return (
              <VerseButton
                key={`s${seiIndex}v${vIndex}`}
                section={currentSection}
                reference={{
                  object: openSong.song,
                  verseID: vIndex,
                  sectionID: sIndex,
                }}
                selectedState={selectedState}
                updateState={updateState}
                ref={setVerseButtonRef(
                  (() => {
                    const x = ++buttonIDCounter;
                    console.log(x);
                    return x;
                  })(),
                )}
              ></VerseButton>
            );
          }),
          <div className="section-controls-add-buttons-container">
            <AddVerseButton
              song={openSong.song}
              key={`ab${seiIndex}`}
              section={currentSection}
              sectionOrderIndex={seiIndex}
            />
            <AddBibleButton
              onSubmit={(value, shiftKey) => {
                if (value.length == 0) {
                  return;
                }

                if (shiftKey) {
                  currentSection.verses.splice(
                    currentSection.verses.length - 0,
                    0,
                    ...value.map((v) => ({ lines: v.split("\n") })),
                  );
                } else {
                  currentSection.verses.push({
                    lines: value,
                  });
                }
                updateState();
              }}
            />
          </div>,
        ];
      } else if (sei.type === "note") {
        return (
          <div key={sei.name} className="note">
            <b>Note: </b>
            {openSong.song.notes.find((n) => n.name === sei.name)!.text}{" "}
          </div>
        );
      }
    }),
  ];
}

export default SongControls;
