import "./config.css"
import {
  ConfigTypePrimitiveType,
  ConfigTypesKey,
  configTypes,
} from "../../shared/config-classes";

import { useModal } from "../ModalContext";
import { useConfigState } from "../ConfigStateContext";
import { useEffect, useState } from "react";
import { FilePlusCorner, RotateCw, X } from "lucide-react";
import { DISPLAYS } from "../../shared/constants";

const ConfigInputBoolean = ({
  cur,
  onSubmit
}: {
  cur: ConfigTypePrimitiveType<"boolean"> | null,
  onSubmit: (newVaulue: ConfigTypePrimitiveType<"boolean">) => void
}): React.ReactElement => {
  if (cur === null) {
    return <>null</>
  }
  return <div className="config-input-content">
    <button className="config-input-boolean-button"
      onClick={() => {
        onSubmit(!cur);
      }}
    >
      {cur ? "True" : "False"}
    </button>
  </div>
}

const ConfigInputHexcolor = ({
  cur,
  onSubmit
}: {
  cur: ConfigTypePrimitiveType<"hexcolor"> | null,
  onSubmit: (newVaulue: ConfigTypePrimitiveType<"hexcolor">) => void
}): React.ReactElement => {
  const [inputValue, setInputValue] = useState<string>(cur ?? "");
  const [isValid, setIsValid] = useState<boolean>(configTypes["hexcolor"].validator(inputValue));

  useEffect(() => {
    const hasValidInput = configTypes["hexcolor"].validator(inputValue);
    if (hasValidInput) {
      onSubmit(inputValue);
    }
    setIsValid(hasValidInput);
  }, [inputValue])
  useEffect(() => {
    setInputValue(cur ?? "");
  }, [cur])

  if (cur === null) {
    return <>null</>
  }

  return <div className="config-input-content">
    <input
      className="config-input-hexcolor-input"
      style={isValid ?
        {
          backgroundColor: inputValue,
          color:
            (parseInt(inputValue.slice(1, 3), 16) * 0.299 + parseInt(inputValue.slice(3, 5), 16) * 0.587 + parseInt(inputValue.slice(5, 7), 16) * 0.114) > 186 ? '#000' : '#fff'
        }
        :
        {
          backgroundImage: "repeating-linear-gradient(45deg, #FF000080 0, #FF000080 5px, transparent 5px, transparent 10px)",
        }
      }
      value={inputValue}
      onChange={(e) => {
        setInputValue(e.target.value)
      }}
    />
  </div>
}

const ConfigInputString = ({
  cur,
  onSubmit
}: {
  cur: ConfigTypePrimitiveType<"string"> | null,
  onSubmit: (newVaulue: ConfigTypePrimitiveType<"string">) => void
}): React.ReactElement => {
  if (cur === null) {
    return <>null</>
  }

  return <div className="config-input-content">
    <input
      className="config-input-string-input"
      value={cur}
      onChange={(e) => {
        onSubmit(e.target.value);
      }}
    />
  </div>
}

const ConfigInputPath = ({
  cur,
  onSubmit
}: {
  cur: ConfigTypePrimitiveType<"path"> | null,
  onSubmit: () => void
}): React.ReactElement => {
  if (cur === null) {
    return <>null</>
  }

  return <div className="config-input-content">
    <button className="config-input-path-button"
      onClick={() => {
        onSubmit()
      }}
    >
      <div className="config-input-path-button-text">{cur?.replace(/.*(\/|\\)/, "") ?? ""}</div>
      <FilePlusCorner size={14} className="config-input-path-icon" />
    </button>
  </div>
}

const ConfigInputNnumber = ({
  cur,
  onSubmit
}: {
  cur: ConfigTypePrimitiveType<"nnumber"> | null,
  onSubmit: (newVaulue: ConfigTypePrimitiveType<"nnumber">) => void
}): React.ReactElement => {
  const [inputValue, setInputValue] = useState<string>(JSON.stringify(cur) ?? "");
  const [isValid, setIsValid] = useState<boolean>(configTypes["nnumber"].validator(inputValue));

  useEffect(() => {
    const numberValue = parseInt(inputValue);
    const hasValidInput = configTypes["nnumber"].validator(numberValue);
    if (hasValidInput) {
      onSubmit(numberValue);
    }
    setIsValid(hasValidInput);
  }, [inputValue])

  useEffect(() => {
    setInputValue(JSON.stringify(cur) ?? "");
  }, [cur])

  if (cur === null) {
    return <>null</>
  }


  return <div className="config-input-content">
    <input
      className="config-input-nnumber-input"
      type="number"
      min="0"
      value={inputValue}
      onChange={(e) => { setInputValue(e.target.value) }}
      style={isValid ?
        {}
        :
        {
          backgroundImage: "repeating-linear-gradient(45deg, #FF000080 0, #FF000080 5px, transparent 5px, transparent 10px)",
        }
      }
    />
  </div>
}

const ConfigInputResetButton = ({
  isInit,
  onReset,
}: {
  isInit: boolean
  onReset: () => void;
}): React.ReactElement => {
  return <button
    className="config-input-reset-button"
    onClick={() => {
      onReset();
    }}
  >
    <RotateCw size={13} style={isInit ? { color: "var(--gray-70)" } : {}} />
  </button>;
}

const ConfigInput = ({
  type,
  id,
  displayId,
  cur,
  isInit,
  title,
  isDisplay,
}: {
  type: ConfigTypesKey,
  id: string,
  displayId: number,
  cur: (ConfigTypePrimitiveType<ConfigTypesKey> | null),
  isInit: boolean
  title: string,
  isDisplay: boolean
}): React.ReactElement => {
  const onSubmit = (value: any) => {
    if (isDisplay) {
      window.electron.sendUISetDisplayConfigEntry(id, displayId, value);
    } else {
      window.electron.sendUISetGeneralConfigEntry(id, value);
    }
  }
  const onReset = () => {
    if (isDisplay) {
      window.electron.sendUIResetDisplayConfigEntry(id, displayId);
    } else {
      window.electron.sendUIResetGeneralConfigEntry(id);
    }
  }
  return (
    <div className="config-input" style={cur === null ? { opacity: "50%", pointerEvents: "none" } : {}}>
      <div className="config-input-title">{title}</div>
      {
        type === "boolean" ?
          <ConfigInputBoolean
            cur={cur as (ConfigTypePrimitiveType<"boolean"> | null)}
            onSubmit={onSubmit}
          />
          :
          type === "hexcolor" ?
            <ConfigInputHexcolor
              cur={cur as (ConfigTypePrimitiveType<"hexcolor"> | null)}
              onSubmit={onSubmit}
            />
            :
            type === "nnumber" ?
              <ConfigInputNnumber
                cur={cur as (ConfigTypePrimitiveType<"nnumber"> | null)}
                onSubmit={onSubmit}
              />
              :
              type === "path" ?
                <ConfigInputPath
                  cur={cur as (ConfigTypePrimitiveType<"path"> | null)}
                  onSubmit={() => {
                    if (isDisplay) {
                      window.electron.sendDisplayConfigInputPath(id, displayId);
                    } else {
                      window.electron.sendGeneralConfigInputPath(id);
                    }
                  }}
                />
                :
                <></>
      }
      <ConfigInputResetButton
        isInit={isInit}
        onReset={onReset}
      />
    </div>
  );
}

const SettingsButtonModal: React.FC<{}> = ({ }) => {
  const { hideModal } = useModal();
  const { displayConfig, generalConfig } = useConfigState();
  const [menuSelection, useMenuSelection] = useState<string>("general");
  return (
    <div className="settings-button-modal">
      <div className="settings-button-modal-header-container">
        <h1 className="settings-button-modal-title">Settings</h1>
        <button
          className="settings-button-modal-exit-button hi-1-button"
          onClick={(e) => hideModal()}
        >
          <X />
        </button>
      </div>
      <div className="settings-button-modal-controls">
        <select
          className="settings-button-modal-select"
          value={menuSelection}
          onChange={e => useMenuSelection(e.target.value)}
        >
          <option value="general">General</option>
          {
            Array.from({ length: DISPLAYS }, (_, i) => (
              <option value={i} key={i}>Display {i + 1}</option>
            ))
          }
        </select>
      </div>
      <div className="settings-button-modal-content">
        {
          menuSelection === "general" ?
            generalConfig.map(entry =>
              typeof entry === "string" ?
                <h3 className="config-heading">{entry}</h3>
                :
                <ConfigInput
                  key={entry.id}
                  type={entry.type}
                  id={entry.id}
                  cur={entry.cur}
                  isInit={entry.isInit}
                  displayId={parseInt(menuSelection)}
                  title={entry.title}
                  isDisplay={false}
                />
            )
            :
            displayConfig.map(entry => (
              typeof entry === "string" ?
                <h3 className="config-heading">{entry}</h3>
                :
                <ConfigInput
                  key={entry.id}
                  type={entry.type}
                  id={entry.id}
                  cur={entry.cur[parseInt(menuSelection)]}
                  isInit={entry.isInit[parseInt(menuSelection)]}
                  displayId={parseInt(menuSelection)}
                  title={entry.title}
                  isDisplay={true}
                />
            ))
        }
      </div>
    </div >
  )
}

const SettingsButton: React.FC<{}> = ({ }) => {
  const { showModal } = useModal();
  return (
    <button
      className="header-button"
      onClick={
        (e) => {
          showModal(e, <SettingsButtonModal />);
        }
      }
    >
      Settings
    </button>
  )
}

export default SettingsButton;
