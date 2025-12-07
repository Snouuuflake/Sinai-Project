import { useState } from "react";
import Icon from "../../Icon";
import "./FormInput.css";

function IntInput({
  configEntry,
  updateConfig,
}: {
  configEntry: DisplayConfigNumberEntry;
  updateConfig: (configEntry: DisplayConfigEntryType, newValue: any) => void;
}) {
  const getDisplayValue = (x: number | null) => {
    return x === null ? configEntry.default : x;
  };

  const [value, sV] = useState<number>(getDisplayValue(configEntry.value));

  const setValue = (newValue: number | null) => {
    const newNewValue = newValue !== null && isNaN(newValue) ? 0 : newValue;
    sV(getDisplayValue(newNewValue));
    updateConfig(configEntry, newNewValue);
  };

  return (
    <div className="text-input-v-container">
      <div className="text-input-title">{configEntry.key}</div>
      <div className="form-input-component text-input-h-container">
        <input
          style={{}}
          className="form-input-component no-spin int-input-input"
          onChange={(event) => {
            const newValue = parseInt((event.target as HTMLInputElement).value);
            setValue(newValue);
          }}
          value={value}
          type="number"
        ></input>
        <button
          className="text-input-reset-button darken-hover"
          onClick={() => {
            setValue(value + 1);
          }}
        >
          <Icon code="U" />
        </button>
        <button
          className="text-input-reset-button darken-hover"
          onClick={() => {
            const tmpNewValue = value - 1;
            setValue(tmpNewValue < 0 ? value : tmpNewValue);
          }}
        >
          <Icon code="D" />
        </button>
        <button
          className="text-input-reset-button darken-hover"
      style={{ backgroundColor: configEntry.value === null ? "var(--gray-3)" : "" }}
          onClick={() => {
            setValue(null);
          }}
        >
          <Icon code="X" />
        </button>
      </div>
    </div>
  );
}

export default IntInput;
