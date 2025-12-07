import { GlobalContext } from "../../GlobalContext";
import { useState, useContext } from "react";
import FormInput from "./FormInput";
import "./DisplayControls.css";
function DisplayControls() {
  const { MAX_LIVE_ELEMENTS, displayConfig } = useContext(
    GlobalContext,
  ) as GlobalContextType;

  // INFO: -1 means *
  const [displayIndex, setDisplayIndex] = useState<number>(-1);

  //const TMP_drawEntries = (field: DisplayConfigEntryType[]) => {
  //  return field.map((entry) => {
  //    return (
  //      <div>
  //        {entry.key}: {entry.value ? entry.value : entry.default}
  //      </div>
  //    );
  //  });
  //};

  const sendConfigUpdateToMain = (
    index: number,
    arrayName: string,
    newEntry: DisplayConfigEntryType,
  ) => {
    console.log(newEntry);
    window.electron.sendUpdateCss(index, arrayName, newEntry);
  };

  // entry gets modified default such that null value works. this. should. work.
  const makeFormInput = (
    index: number,
    entry: DisplayConfigEntryType,
    configArray: DisplayConfigSectionType,
  ) => (
    <FormInput
      key={`${entry.key}${index}`}
      configEntry={entry}
      configArray={configArray.entries}
      updateConfig={(newValue) => {
        sendConfigUpdateToMain(index, configArray.name, {
          ...entry,
          value: newValue,
        });
      }}
    />
  );

  //const getConfigArrayTitle = (key: string) => {
  //  switch (key) {
  //    case "global":
  //      return "Global Settings";
  //      break;
  //
  //    case "text":
  //      return "Text Settings";
  //      break;
  //
  //    default:
  //      return "how did this happen?";
  //      break;
  //  }
  //};

  const drawDefaultDisplayConfig = (defaultConfig: DisplayConfigType) => {
    return defaultConfig.map((dcs) => (
      <div className="display-controls-section" key={`si-1k${dcs.name}`}>
        {[
          <div className="display-config-header" key={`hi-1k${dcs.name}`}>
            {dcs.name}
          </div>,
          dcs.entries.map((entry) => makeFormInput(-1, entry, dcs)),
        ]}
      </div>
    ));
  };

  const drawSpecificDisplayConfig = (
    defaultConfig: DisplayConfigType,
    specificConfig: DisplayConfigType,
    index: number,
  ) => {
    return specificConfig.map((dcs) => (
      <div className="display-controls-section" key={`si${index}k${dcs.name}`}>
        {[
          <div className="display-config-header" key={`hi${index}k${dcs.name}`}>
            {dcs.name}
          </div>,
          dcs.entries.map((entry) => {
            const defaultEntry = defaultConfig.find(ddcs => ddcs.name === dcs.name)!.entries.find(
              (x) => x.key === entry.key,
            )!;
            const newDefault =
              defaultEntry.value === null
                ? defaultEntry.default
                : defaultEntry.value;
            return makeFormInput(
              index,
              { ...entry, default: newDefault },
              dcs,
            );
          }),
        ]}
      </div>
    ));
  };

  return (
    <div className="display-controls">
      <div className="display-index-buttons-container">
        {Array(MAX_LIVE_ELEMENTS + 1)
          .fill(0)
          .map((_, i) => {
            const index = i - 1;
            const highlight = index == displayIndex;
            return (
              <button
                className={`display-index-button darken-hover ${highlight ? "display-index-button-active" : ""}`}
                onClick={() => setDisplayIndex(index)}
              >
                {index >= 0 ? index + 1 : "D"}
              </button>
            );
          })}
      </div>
      {displayConfig.value === null
        ? ""
        : displayIndex == -1
          ? drawDefaultDisplayConfig(displayConfig.value.globalDisplay)
          : drawSpecificDisplayConfig(
            displayConfig.value.globalDisplay,
            displayConfig.value.specificDisplays[displayIndex],
            displayIndex,
          )}
    </div>
  );
}

export default DisplayControls;
