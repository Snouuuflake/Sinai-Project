import "../ControlSection.css";
import "../general-icon-button.css";
import Icon from "../../Icon";
import {
  forwardRef,
  useImperativeHandle,
  useContext,
  useRef,
  useEffect,
  useState,
} from "react";
import { GlobalContext } from "../../GlobalContext";

const VerseButton = forwardRef<
  { enterHandler: () => void; reference: LiveSongReference },
  {
    section: Section;
    reference: LiveSongReference;
    selectedState: StateObject<LiveSongReference>;
    updateState: () => void;
  }
>(({ section, reference, selectedState, updateState }, ref) => {
  const { MAX_LIVE_ELEMENTS, liveElements, canType } = useContext(
    GlobalContext,
  ) as GlobalContextType;

  const compareReferences = (r1: LiveSongReference, r2: LiveSongReference) =>
    (Object.keys(r1) as (keyof LiveSongReference)[]).every(
      (k) => r1[k] === r2[k],
    );

  const matchingLiveIndexes = liveElements.value.flatMap((le, i) =>
    le.type === "text" && compareReferences(reference, le.reference) ? [i] : [],
  );

  /** [0,1,...,MAX_LIVE_ELEMENTS-1] */
  const liveIndexesRange = Array.from(
    { length: MAX_LIVE_ELEMENTS },
    (_, i) => i,
  );

  const someMatching = !!matchingLiveIndexes.length;
  const allMatching = matchingLiveIndexes.length == MAX_LIVE_ELEMENTS;

  const thisRef = useRef<HTMLDivElement | null>(null);
  const selected = compareReferences(selectedState.value, reference);

  useEffect(() => {
    if (selected && thisRef.current) {
      thisRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selected]);

  const bigButtonClickHandler = () => {
    selectedState.set(reference);
    liveElements.send(
      Array.from({ length: MAX_LIVE_ELEMENTS }).map((_, i) => {
        return {
          index: i,
          liveElement: {
            type: "text",
            value: section.verses[reference.verseID].lines
              .reduce((p, c) => p + "\n" + c, "")
              .trim(),
            reference: reference,
          },
        };
      }),
    );
  };
  useImperativeHandle(ref, () => ({
    enterHandler: () => {
      if (selected) {
        bigButtonClickHandler();
      }
    },
    reference: reference,
  }));

  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const editorContentRef = useRef<string>(
    section.verses[reference.verseID].lines.reduce((p, c) => p + "\n" + c),
  );

  return (
    <div className="verse-button-container-row" ref={thisRef}>
      <div className="icons-container">
        <div className="icon-container">
          <div
            className={`dot ${someMatching && !allMatching ? "blink" : ""}`}
            style={{
              backgroundColor: someMatching ? "var(--hi1)" : "white",
            }}
          ></div>
        </div>
        <div
          className="icon-container icon-button"
          style={{
            backgroundColor: editorOpen ? "var(--hi2)" : "",
          }}
        >
          <span
            className="text-icon no-select"
            onClick={() => {
              if (editorOpen) {
                setEditorOpen(false);
              } else {
                setEditorOpen(true);
              }
            }}
          >
            {editorOpen ? "X" : "E"}
          </span>
        </div>
        {editorOpen ? (
          <div className="icon-container icon-button">
            <span
              className="text-icon no-select"
              onClick={(event) => {
                if (editorOpen) {
                  if (editorContentRef.current.trim() !== "") {
                    if (event.shiftKey) {
                      const newVerses = editorContentRef.current
                        .trim()
                        .replace(/[\n\r]/, "\n")
                        .split("\n")
                        .map((s) => s.trim())
                        .reduce((p, c) => p + "\n" + c)
                        .split(/\n{2,}/m)
                        .map((s) => ({
                          lines: s.split("\n"),
                        }));

                      section.verses.splice(reference.verseID, 1, ...newVerses);

                      if (selectedState.value.verseID > reference.verseID) {
                        selectedState.set({
                          ...selectedState.value,
                          verseID:
                            selectedState.value.sectionID +
                            newVerses.length -
                            1,
                        });
                      }
                      liveElements.map((le, _i) => {
                        if (le.type !== "text") return le;
                        if (le.reference.object != reference.object) return le;
                        if (le.reference.verseID > reference.verseID) {
                          return {
                            ...le,
                            reference: {
                              ...le.reference,
                              verseID:
                                le.reference.sectionID + newVerses.length - 1,
                            },
                          };
                        }
                        return le;
                      });

                      console.log(newVerses);
                    } else {
                      section.verses[reference.verseID].lines =
                        editorContentRef.current
                          .trim()
                          .replace(/[\n\r]/, "\n")
                          .split("\n")
                          .map((s) => s.trim())
                          .reduce((p, c) => p + "\n" + c)
                          .replace(/$\n(^\s*$\n)*/gm, "\n")
                          .split("\n");

                          console.log(
                        editorContentRef.current
                          .replace(/[\n\r]/, "\n")
                          .split("\n")
                          .map((s) => s.trim())
                          .reduce((p, c) => p + "\n" + c)
                          .replace(/$\n(^\s*$\n)*/gm, "\n")
                          .split("\n"))
                    }
                    updateState();
                  } else {
                    // keeps selected in section
                    if (
                      section.verses.length - 1 == reference.verseID &&
                      compareReferences(reference, selectedState.value)
                    ) {
                      selectedState.set({
                        ...selectedState.value,
                        verseID: selectedState.value.verseID - 1,
                      });
                    }
                    // deleting verse from section
                    section.verses.splice(reference.verseID, 1);
                    // stops projecting this button
                    liveElements.send(
                      matchingLiveIndexes.map((mli) => ({
                        index: mli,
                        liveElement: {
                          type: "none",
                          value: "",
                          reference: {
                            object: null,
                          },
                        },
                      })),
                    );
                  }
                  setEditorOpen(false);
                }
              }}
            >
              S
            </span>
          </div>
        ) : (
          <></>
        )}
        <div
          className="icon-container"
          style={{
            backgroundColor: selected ? "white" : "var(--icon-container-bg)",
            flexGrow: 1,
          }}
        >
          <span
            className="text-icon s"
            style={{
              color: selected ? "var(--icon-container-bg)" : "white",
            }}
          >
            {/*s*/}
          </span>
        </div>
      </div>
      <div className="verse-button-container-col">
        <div className="display-indexes-container">
          {liveIndexesRange.map((i) => (
            <button
              tabIndex={-1}
              key={`di${i}`}
              className="display-index"
              style={{
                color:
                  typeof matchingLiveIndexes.find((j) => j == i) != "undefined"
                    ? "var(--hi1)"
                    : "gray",
              }}
              onClick={(e) => {
                e.preventDefault();
                if (
                  typeof matchingLiveIndexes.find((j) => j == i) !== "undefined"
                ) {
                  liveElements.send([
                    {
                      index: i,
                      liveElement: {
                        type: "none",
                        value: "",
                        reference: {
                          object: null,
                        },
                      },
                    },
                  ]);
                } else {
                  liveElements.send([
                    {
                      index: i,
                      liveElement: {
                        type: "text",
                        value: section.verses[reference.verseID].lines
                          .reduce((p, c) => p + "\n" + c, "")
                          .trim(),
                        reference: reference,
                      },
                    },
                  ]);
                }
              }}
            >
              {i + 1}
            </button>
          ))}
          <div className="up-down-container">
            <button
              className="general-icon-button"
              onClick={() => {
                if (!editorOpen && reference.verseID > 0) {
                  // swapping inside section object
                  [
                    section.verses[reference.verseID],
                    section.verses[reference.verseID - 1],
                  ] = [
                    section.verses[reference.verseID - 1],
                    section.verses[reference.verseID],
                  ];
                  // updating id of liveElements
                  // adds -1 to ones with to verse id == this verse id
                  // adds 1 to ones with to verse id == this verse id - 1
                  // (verse id - 1 is guarenteed to exist cause the if)
                  liveElements.map((le, _i): LiveElementType => {
                    return le.type === "text" &&
                      compareReferences(reference, le.reference)
                      ? {
                          ...le,
                          reference: {
                            ...le.reference,
                            verseID: le.reference.verseID - 1,
                          },
                        }
                      : le.type === "text" &&
                          compareReferences(
                            { ...reference, verseID: reference.verseID - 1 },
                            le.reference,
                          )
                        ? {
                            ...le,
                            reference: {
                              ...le.reference,
                              verseID: le.reference.verseID + 1,
                            },
                          }
                        : le;
                  });
                }
              }}
            >
              <Icon code="U" />
            </button>
            <button
              className="general-icon-button"
              onClick={() => {
                if (
                  !editorOpen &&
                  reference.verseID < section.verses.length - 1
                ) {
                  // swapping verses in section object
                  [
                    section.verses[reference.verseID],
                    section.verses[reference.verseID + 1],
                  ] = [
                    section.verses[reference.verseID + 1],
                    section.verses[reference.verseID],
                  ];
                  // updating id of liveElements
                  // adds 1 to ones with to verse id == this verse id
                  // adds -1 to ones with to verse id == this verse id + 1
                  // (verse id + 1 is guarenteed to exist cause the if)
                  liveElements.map((le, _i): LiveElementType => {
                    return le.type === "text" &&
                      compareReferences(reference, le.reference)
                      ? {
                          ...le,
                          reference: {
                            ...le.reference,
                            verseID: le.reference.verseID + 1,
                          },
                        }
                      : le.type === "text" &&
                          compareReferences(
                            { ...reference, verseID: reference.verseID + 1 },
                            le.reference,
                          )
                        ? {
                            ...le,
                            reference: {
                              ...le.reference,
                              verseID: le.reference.verseID - 1,
                            },
                          }
                        : le;
                  });
                }
              }}
            >
              <Icon code="D" />
            </button>
          </div>
        </div>

        {editorOpen ? (
          <textarea
            className="inline-verse-editor text-input"
            defaultValue={section.verses[reference.verseID].lines
              .reduce((p, c) => p + "\n" + c)
              .trim()}
            style={{
              minHeight: `${section.verses[reference.verseID].lines.length}em`
            }}
            onFocus={() => {
              canType.current = true;
            }}
            onBlur={() => {
              canType.current = false;
            }}
            onChange={(event) => {
              editorContentRef.current = event.target.value;
            }}
          ></textarea>
        ) : (
          <button
            tabIndex={-1}
            className="verse-button"
            key={`b${reference.verseID}`}
            id={`verse-button-${reference.verseID}`}
            onClick={() => {
              selectedState.set(reference);
              liveElements.send(
                Array.from({ length: MAX_LIVE_ELEMENTS }).map((_, i) => {
                  return {
                    index: i,
                    liveElement: {
                      type: "text",
                      value: section.verses[reference.verseID].lines
                        .reduce((p, c) => p + "\n" + c, "")
                        .trim(),
                      reference: reference,
                    },
                  };
                }),
              );
            }}
          >
            <div className="verse-button-content">
              {section.verses[reference.verseID].lines
                .flatMap((l, lIndex) => [
                  <hr className="verse-button-hr" key={`hr${lIndex}`} />,
                  <div key={`l${lIndex}`} className="line">
                    {l}
                  </div>,
                ])
                .slice(1)}
            </div>
          </button>
        )}
      </div>
      <div className="lights-container">
        <div
          className={`icon-container dot-light ${someMatching && !allMatching ? "blink" : ""} blinkcable`}
          style={{
            backgroundColor: someMatching ? "var(--hi1)" : "var(--gray-3)",
          }}
        ></div>
        <div
          className="icon-container s-light"
          style={{
            backgroundColor: selected ? "white" : "var(--icon-container-bg)",
            flexGrow: 1,
          }}
        ></div>
      </div>
    </div>
  );
});

export default VerseButton;
