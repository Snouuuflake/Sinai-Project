import { useState, useLayoutEffect } from "react";
import ResetButton from "./ResetButton";
import "./FormInput.css";

function BooleanInput({
  configEntry,
  updateConfig,
}: {
  configEntry: DisplayConfigEntryType;
  updateConfig: (configEntry: DisplayConfigEntryType, newValue: any) => void;
}) {
  const initValue = (
    configEntry.value === null ? configEntry.default : configEntry.value
  ) as boolean;

  const [active, setActive] = useState<boolean>(initValue);

  useLayoutEffect(()=>{setActive(initValue)},[initValue]);

  return (
    <div className="text-input-h-container">
      <button
        className={`form-input-component boolean-input-button darken-hover ${active ? "boolean-input-active" : "boolean-input-inactive"}`}
        onClick={() => {
          const newValue = !active;
          updateConfig(configEntry, newValue);
        }}
      >
        {configEntry.key}
      </button>
      <ResetButton configEntry={configEntry} updateConfig={updateConfig} />
    </div>
  );
}

export default BooleanInput;
