import {
  useEffect,
  useContext,
  useState,
  useRef,
  FC,
  useLayoutEffect,
} from "react";

import { search, Searcher } from "fast-fuzzy";

import { TRANSLATIONS } from "../constants";

import { GlobalContext } from "../GlobalContext";

import "./Bible.css";

const BibleCheckIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="50"
      height="50"
      fill="currentColor"
      className="bible-check-icon"
      viewBox="0 0 16 16"
    >
      <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z" />
    </svg>
  );
};

const TranslationSearch: React.FC<{
  onSet: (selected: any) => void;
}> = ({ onSet }) => {
  const [manualInput, setManualInput] = useState("");
  const [selectedValue, setSelectedValue] = useState<any | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (inputRef.current !== null) {
      inputRef.current.focus();
    }
  }, [open]);
  return (
    <div className="bible-input-container">
      {open ? (
        <input
          ref={inputRef}
          className="bible-text-input"
          onChange={(event) => {
            setManualInput(event.target.value);
            setCandidates(
              search(event.target.value, TRANSLATIONS, {
                keySelector: (t) => t.full_name,
              }),
            );
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          onBlur={() => setOpen(false)}
          value={manualInput || ""}
        ></input>
      ) : (
        <div
          className="bible-text-input"
          onClick={() => {
            setOpen(true);
          }}
        >
          {selectedValue === null ? "Version" : selectedValue?.full_name}
        </div>
      )}
      <div
        className="bible-input-suggestions-container"
        style={{
          display: open ? "flex" : "none",
        }}
      >
        {(candidates.length > 0 ? candidates : TRANSLATIONS).map((s) => (
          <button
            className="bible-input-suggestion"
            onMouseDown={() => {
              console.log(s);
              setSelectedValue(s);
              setManualInput(s.full_name);
              onSet(s);
            }}
          >
            {s.full_name}
          </button>
        ))}
      </div>
    </div>
  );
};

const BookSearch: React.FC<{
  init: any | null;
  onSet: (selected: any) => void;
  translation: any | null;
}> = ({ init, onSet, translation }) => {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any>([]);

  const [manualInput, setManualInput] = useState("");
  const [selectedValue, _base_setSelectedValue] = useState<any | null>(init);
  const setSelectedValue = (value: any | null) => {
    _base_setSelectedValue(value);
    onSet(value);
  };
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (inputRef.current !== null) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (translation !== null) {
      fetch(`https://bolls.life/get-books/${translation.short_name}/`)
        .then((res) => res.json())
        .then((res) => {
          console.log(res);
          setCandidates(res);
          setLoading(false);
          setSelectedValue(res[init?.bookid - 1] ?? null);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [translation]);

  return (
    <div className="bible-input-container">
      {open ? (
        <input
          ref={inputRef}
          className="bible-text-input"
          onChange={(event) => {
            setManualInput(event.target.value);
            setSearchResults(
              search(event.target.value, candidates, {
                keySelector: (t) => t.name,
              }),
            );
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          onBlur={() => setOpen(false)}
          value={manualInput || ""}
        ></input>
      ) : (
        <div
          className="bible-text-input"
          onClick={() => {
            setOpen(true);
          }}
        >
          {selectedValue === null
            ? "Book"
            : `${selectedValue.bookid}. ${selectedValue.name}`}
        </div>
      )}
      <div
        style={{
          display: open ? "flex" : "none",
        }}
        className="bible-input-suggestions-container"
      >
        {!loading
          ? (searchResults.length > 0 ? searchResults : candidates).map(
              (s: any) => (
                <button
                  className="bible-input-suggestion"
                  onMouseDown={() => {
                    console.log(s);
                    setSelectedValue(s);
                  }}
                >
                  {s.bookid}. {s.name}
                </button>
              ),
            )
          : "loading..."}
      </div>
    </div>
  );
};

const ChapterSearch: React.FC<{
  init: number | null;
  onSet: (selected: any) => void;
  book: any | null;
}> = ({ init, onSet, book }) => {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any>([]);

  const [manualInput, setManualInput] = useState("");
  const [selectedValue, _base_setSelectedValue] = useState<number | null>(init);
  const setSelectedValue = (value: number) => {
    _base_setSelectedValue(value);
    onSet(value);
  };
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (inputRef.current !== null) {
      inputRef.current.focus();
    }
  }, [open]);

  console.log("BOOK", book);

  useEffect(() => {
    if (book !== null) {
      setCandidates(
        Array.from({ length: book.chapters }).map((v, i) => String(i + 1)),
      );
      console.log(
        Array.from({ length: book.chapters }).map((v, i) => String(i + 1)),
      );
      setLoading(false);
      setSelectedValue(init !== null && init <= book.chapters ? init : 1);
    }
  }, [book?.bookid ?? null]);

  return (
    <div className="bible-input-container">
      {open ? (
        <input
          ref={inputRef}
          className="bible-text-input"
          onChange={(event) => {
            setManualInput(event.target.value);
            setSearchResults(
              search(event.target.value, candidates, {
                keySelector: (t) => t.name,
              }),
            );
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          onBlur={() => setOpen(false)}
          value={manualInput || ""}
        ></input>
      ) : (
        <div
          className="bible-text-input"
          onClick={() => {
            setOpen(true);
          }}
        >
          {selectedValue === null ? "Chapter" : `Chapter ${selectedValue}`}
        </div>
      )}
      <div
        style={{
          display: open ? "flex" : "none",
        }}
        className="bible-input-suggestions-container"
      >
        {!loading
          ? (searchResults.length > 0 ? searchResults : candidates).map(
              (s: any) => (
                <button
                  className="bible-input-suggestion"
                  style={{
                    textAlign: "left",
                  }}
                  onMouseDown={() => {
                    console.log(s);
                    setSelectedValue(parseInt(s));
                  }}
                >
                  Chapter {s}
                </button>
              ),
            )
          : "loading..."}
      </div>
    </div>
  );
};

const BibleBody: React.FC<{
  init: number | null;
  onSet: (selected: string[]) => void;
  bookid: number | null;
  translation: any | null;
  chapter: any | null;
}> = ({ init, onSet, bookid, translation, chapter }) => {
  const [loading, setLoading] = useState(true);
  const [verses, setVerses] = useState<any[]>([]);
  const [selection, setSelection] = useState<[number, number] | null>(null);
  const lastSelectedIndex = useRef(0);
  const verseRefs = useRef<HTMLElement[]>([]);

  const addToSelection = (newValue: number): void => {
    if (selection !== null && !selection.some((x) => x == newValue)) {
      selection[lastSelectedIndex.current] = newValue;
      lastSelectedIndex.current =
        selection[0] == selection[1]
          ? newValue > selection[0]
            ? 1
            : 0
          : (lastSelectedIndex.current + 1) % 2;
      setSelection(selection.toSorted((a, b) => a - b) as [number, number]);
    } else {
      // INFO: null or one newValue
      setSelection([newValue, newValue]);
    }
  };

  console.log(bookid, translation, chapter);
  console.log(selection);

  useLayoutEffect(() => {});

  useEffect(() => {
    if (translation !== null && bookid !== null && chapter !== null) {
      fetch(
        `https://bolls.life/get-text/${translation.short_name}/${bookid}/${chapter}/`,
      )
        .then((res) => res.json())
        .then((r) => {
          const res = r.map((x: any) => ({ ...x, text: x.text.trim() }));
          console.log(res);
          setVerses(res);
          setLoading(false);
          setSelection(null);
          verseRefs.current = verseRefs.current.slice(0, res.length);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [bookid, translation, chapter]);

  useEffect(() => {
    if (init !== null && verses.find((v: any) => v.verse == init)) {
      verseRefs.current[init - 1].scrollIntoView();
    }
  }, [chapter, bookid, translation]);

  useEffect(() => {
    if (selection) {
      onSet(
        verses
          .slice(selection[0] - 1, selection[1])
          .map((v) => `${v.verse}. ${v.text.replace(/<\/?[^>]+(>|$)/g, "")}`),
      );
    }
  });
  return (
    <div
      style={{
        userSelect: "none",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        flexGrow: "1",
        //minHeight: "0px"
      }}
    >
      {loading
        ? "loading"
        : verses.map((v: any) => (
            <div
              ref={(el) => (verseRefs.current[v.verse - 1] = el!)}
              onClick={(event) => {
                if (event.shiftKey) {
                  addToSelection(v.verse);
                } else {
                  setSelection([v.verse, v.verse]);
                }
              }}
              style={{
                textAlign: "left",
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
                gap: "10px",
                backgroundColor:
                  selection !== null &&
                  v.verse >= selection[0] &&
                  v.verse <= selection[1]
                    ? "red"
                    : "" ,
              }}
            >
              <div
                style={{
                  all: "unset",
                  minWidth: "35px",
                  textAlign: "right",
                }}
              >
                {v.verse}
              </div>
              <div style={{ flexGrow: "1" }}>
                {v.text.replace(/<\/?[^>]+(>|$)/g, "")}
              </div>
            </div>
          ))}
    </div>
  );
};

const Bible: FC<{
  onSubmit: (value: string[], event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  onExit: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}> = ({ onSubmit, onExit }) => {
  const { canType } = useContext(GlobalContext) as GlobalContextType;
  const [translation, setTranslation] = useState<any | null>(null);
  const [book, setBook] = useState<any | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const verseRefs = useRef<HTMLElement[]>([]);
  const finalTextRef = useRef<string[]>([]);
  useEffect(()=>{
    canType.current = true;
    return () => {
      canType.current = false;
    }
  })
  return false ? (
    ""
  ) : (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: "100vw",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onExit(event);
        }
      }}
    >
      <div className="bible-container">
        <div className="bible-form-container">
          <div className="bible-text-inputs-container">
            <TranslationSearch
              onSet={(value) => {
                setTranslation(value);
              }}
            />
            <BookSearch
              translation={translation}
              init={book}
              onSet={(value) => {
                setBook(value);
              }}
            />
            <ChapterSearch
              book={book}
              init={null}
              onSet={(value) => {
                setChapter(value);
              }}
            />
          </div>
          <button
            className="bible-form-submit-button"
            onClick={(event) => {
              onSubmit(finalTextRef.current, event);
            }}
          >
            <BibleCheckIcon />
          </button>
        </div>
        {
          // TODO: make searchers have init prop
          // so that state reolades them
        }
        <BibleBody
          translation={translation}
          bookid={book?.bookid ?? null}
          init={1}
          chapter={chapter}
          onSet={(value) => {
            finalTextRef.current = value;
            console.log(value);
          }}
        />
      </div>
    </div>
  );
};

export default Bible;
