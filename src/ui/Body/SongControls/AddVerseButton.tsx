import { useContext } from "react";
import { GlobalContext } from "../../GlobalContext";

function AddVerseButton({
  song,
  section,
  sectionOrderIndex,
}: {
  song: Song;
  section: Section;
  sectionOrderIndex: number;
}) {
  const { openElements } = useContext(GlobalContext) as GlobalContextType;

  return (
    <button className="section-controls-add-button"
      onClick={() => {
        section.verses.push({ lines: ["Verse text goes here."] });
        console.log(section.verses);

        // i cant tell if this is/nt incredibly stupid
        openElements.set([...openElements.value]);
      }}
    >
      + Verse
    </button>
  );
}

export default AddVerseButton;
