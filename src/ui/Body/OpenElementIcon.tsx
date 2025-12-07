import "./OpenElementIcon.css";
import { useContext } from "react";
import { GlobalContext } from "../GlobalContext";

function OpenElementIcon({ openElement }: { openElement: OpenElementType }) {
  const { liveElements, MAX_LIVE_ELEMENTS } = useContext(
    GlobalContext,
  ) as GlobalContextType;

  const filtered = liveElements.value.filter(
    (le) =>
      openElement.type !== "none" && 
      (
        openElement.type === "song" && le.type === "text" && openElement.song == le.reference.object ||
        openElement.type === "image" && le.type === "image" && openElement.image == le.reference.object 
       )
      //openElement.type === le.type && true
  );
  const allLive = filtered.length == MAX_LIVE_ELEMENTS;
  const someLive = filtered.length != 0;

  return (
    <svg
      className={`open-element-icon ${!allLive && someLive ? "blink" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        color: someLive ? "var(--hi1)" : "white",
      }}
    >
      {" "}
      {openElement.type === "song" ? (
        <path
          d="M9 19C9 20.1046 7.65685 21 6 21C4.34315 21 3 20.1046 3 19C3 17.8954 4.34315 17 6 17C7.65685 17 9 17.8954 9 19ZM9 19V5L21 3V17M21 17C21 18.1046 19.6569 19 18 19C16.3431 19 15 18.1046 15 17C15 15.8954 16.3431 15 18 15C19.6569 15 21 15.8954 21 17ZM9 9L21 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        "?"
      )}
    </svg>
  );
}

export default OpenElementIcon;
