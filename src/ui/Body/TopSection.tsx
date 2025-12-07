import "./TopSection.css";
import DisplayButton from "./TopSectionButtons/DisplayButton";
import OpenFileButton from "./TopSectionButtons/OpenFileButton";
import DisplaySettingsButton from "./TopSectionButtons/DisplaySettingsButton";
import ClearButton from "./TopSectionButtons/ClearButton";
import LogoButton from "./TopSectionButtons/LogoButton";

function TopSection() {
  // NOTE: it should request window types from body eventually
  return (
    <div className="top-section">
      <DisplayButton />
      <OpenFileButton />
      <DisplaySettingsButton />
      <ClearButton />
      <LogoButton />
    </div>
  );
}

export default TopSection;
