import { useContext } from "react";
import { GlobalContext } from "../../GlobalContext";
import "./FormInput.css";

// https://www.npmjs.com/package/get-system-fonts

import BooleanInput from "./BooleanInput";
import CssColorInput from "./CssColorInput";
import TextInput from "./TextInput";
import IntInput from "./IntInput";
import PathInput from "./PathInput";

function FormInput({
  configEntry,
  configArray,
  updateConfig,
}: {
  configEntry: DisplayConfigEntryType;
  configArray: DisplayConfigEntryType[];
  updateConfig: (newValue: any) => void;
}) {

  const { displayConfig } = useContext(
    GlobalContext,
  ) as GlobalContextType;

  const updateConfigAndState = (configEntry: DisplayConfigEntryType, newValue: any) => {
    updateConfig(newValue);
    configArray.find((x) => x.key === configEntry.key)!.value = newValue;
    displayConfig.set({ ...(displayConfig.value as FullDisplayConfigType) });
  };

  return configEntry.type === "boolean" ? (
    <BooleanInput configEntry={configEntry} updateConfig={updateConfigAndState} />
  ) : configEntry.type === "csscolor" ? (
    <CssColorInput configEntry={configEntry} updateConfig={updateConfigAndState} />
  ) : configEntry.type === "font" ? (
    <TextInput configEntry={configEntry} updateConfig={updateConfigAndState} />
  ) : configEntry.type === "number" ? (
    <IntInput configEntry={configEntry} updateConfig={updateConfigAndState} />
  ) : configEntry.type === "path" ? (
    <PathInput configEntry={configEntry} updateConfig={updateConfigAndState} />
  ) : ""; 
}

export default FormInput;
