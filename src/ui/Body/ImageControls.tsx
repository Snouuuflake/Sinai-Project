import "./ImageControls.css";
import { useContext, useEffect, useRef } from "react";
import { GlobalContext } from "../GlobalContext";

function ImageControls({ image }: { image: Image }) {
  const imageButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function keyHandler(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (!target.classList.contains("text-input")) {
        switch (event.key) {
          case " ":
          case "Enter":
            event.preventDefault();
            imageButtonRef.current!.click();
          default:
            break;
        }
      }
    }
    window.addEventListener("keydown", keyHandler);
    return () => {
      window.removeEventListener("keydown", keyHandler);
    };
  }, []);

  const { MAX_LIVE_ELEMENTS, liveElements } = useContext(
    GlobalContext,
  ) as GlobalContextType;
  const liveIndexesRange = Array.from(
    { length: MAX_LIVE_ELEMENTS },
    (_, i) => i,
  );

  const matchingLiveIndexes = liveElements.value.flatMap((le, i) =>
    le.reference.object == image ? [i] : [],
  );

  const someMatching = !!matchingLiveIndexes.length;
  const allMatching = matchingLiveIndexes.length == MAX_LIVE_ELEMENTS;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      className="image-controls"
    >
      <div className="verse-button-container-row">
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
            className="icon-container"
            style={{
              backgroundColor: "white",
              flexGrow: 1,
            }}
          ></div>
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
                    typeof matchingLiveIndexes.find((j) => j == i) !=
                    "undefined"
                      ? "var(--hi1)"
                      : "gray",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  if (
                    typeof matchingLiveIndexes.find((j) => j == i) !==
                    "undefined"
                  ) {
                    liveElements.send([
                      {
                        index: i,
                        liveElement: {
                          type: "none",
                          value: "",
                          reference: { object: null },
                        },
                      },
                    ]);
                  } else {
                    liveElements.send([
                      {
                        index: i,
                        liveElement: {
                          type: "image",
                          value: image.path,
                          reference: {
                            object: image,
                          },
                        },
                      },
                    ]);
                  }
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            className="image-button"
            ref={imageButtonRef}
            onClick={() => {
              liveElements.send(
                Array.from({ length: MAX_LIVE_ELEMENTS }).map((_, i) => {
                  return {
                    index: i,
                    liveElement: {
                      type: "image",
                      value: image.path,
                      reference: { object: image },
                    },
                  };
                }),
              );
            }}
          >
            {image.title}
          </button>
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
              backgroundColor: "white",
              flexGrow: 1,
            }}
          ></div>
        </div>
      </div>

      <div style={{ flex: "1" }}>
        <img
          src={`mssf://${image.path}`}
          style={{ width: "100%", objectFit: "cover" }}
        />
      </div>
    </div>
  );
}

export default ImageControls;
