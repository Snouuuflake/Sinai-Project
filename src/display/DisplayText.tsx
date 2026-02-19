import { useRef, useState, useEffect } from "react";
import { LiveElementTextValue, SerializedLiveElement } from "../shared/media-classes"
import { useDisplayConfigState } from "./DisplayConfigStateContext";

const AutoScaleText: React.FC<{
  children: React.ReactNode;
  minSize: number;
  maxSize: number;
  step: number;
}> = ({ children, minSize, maxSize, step }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<number>(minSize);
  const { configHash } = useDisplayConfigState();

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;

    if (!container || !content) return;

    // Binary search for optimal font size
    const calculateFontSize = () => {
      // Binary search for optimal font size
      let low = minSize;
      let high = maxSize;
      let optimalSize = minSize;

      const checkFit = (size: number) => {
        content.style.fontSize = `${size}px`;

        // Force a reflow to ensure accurate measurements
        void content.offsetHeight;

        // Single check: does the content fit as it naturally renders?
        return (
          content.scrollHeight <= container.clientHeight &&
          content.scrollWidth <= container.clientWidth
        );
      };

      // Binary search for the largest fitting size
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);

        if (checkFit(mid)) {
          optimalSize = mid;
          low = mid + 1; // Try larger
        } else {
          high = mid - 1; // Try smaller
        }
      }

      // Double-check that the optimal size actually fits
      // (sometimes binary search can be off by one due to rounding)
      if (!checkFit(optimalSize) && optimalSize > minSize) {
        optimalSize -= 1;
      }

      setFontSize(optimalSize);
    };

    calculateFontSize();
    window.addEventListener('resize', calculateFontSize);

    return () => {
      window.removeEventListener('resize', calculateFontSize);
    };
  }, [children, minSize, maxSize, step]);

  return (
    <div style={{
      all: "unset",
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: "border-box",
      fontFamily: "inherit",
      paddingTop: configHash.get("text-margin-top") as number + "vh",
      paddingBottom: configHash.get("text-margin-bottom") as number + "vh",
      paddingLeft: configHash.get("text-margin-left") as number + "vh",
      paddingRight: configHash.get("text-margin-right") as number + "vh",
    }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: "border-box",
          fontFamily: "inherit",
          backgroundColor: configHash.get("text-background-color") as string,
        }}
      >
        <div
          ref={contentRef}
          style={{
            fontSize: `${fontSize}px`,
            maxWidth: '100%',
            maxHeight: '100%',
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            boxSizing: "border-box",
            fontFamily: "inherit"
          }}
        >
          {children}
        </div>
      </div>
    </div >
  );
};

const DisplayText: React.FC<{ liveElement: SerializedLiveElement }> =
  ({ liveElement }) => {
    const { configHash } = useDisplayConfigState();
    return (
      <div
        className="display-text"
        style={{
          fontWeight: configHash.get("bold") as boolean ? "bold" : "normal",
          color: configHash.get("text-color") as string,
          fontFamily: configHash.get("font") as string,
        }}
      >
        <AutoScaleText
          minSize={1}
          maxSize={(configHash.get("font-size") as number) > 1 ? configHash.get("font-size") as number : 2}
          step={1}
        >
          {
            (liveElement.value as LiveElementTextValue).lines.map(
              (l, i, a) => <div className="text-line">{l}</div>
            )
          }
        </AutoScaleText>
      </div>
    )
  }

export default DisplayText;
