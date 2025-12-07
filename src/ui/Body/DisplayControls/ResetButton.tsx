import Icon from "../../Icon";
import "./FormInput.css";

const ResetButton: React.FC<{
  configEntry: DisplayConfigEntryType;
  updateConfig: (configEntry: DisplayConfigEntryType, value: any) => void;
}> = ({ configEntry, updateConfig }) => {
  return (
    <button
      className="text-input-reset-button darken-hover"
      onClick={() => {
        updateConfig(configEntry, null);
      }}
      style={{ backgroundColor: configEntry.value === null ? "var(--gray-3)" : "" }}
    >
      <Icon code="X" />
    </button>
  );
};

export default ResetButton;
