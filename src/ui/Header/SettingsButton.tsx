import "./config.css"
import {
  ConfigEntryBase,
  ConfigTypePrimitiveType,
  ConfigTypesKey,
  configTypes,
  SerializedDisplayConfigEntry
} from "../../shared/config-classes";

import { useModal } from "../ModalContext";
import { UIDisplayConfigStateContextProvider, useUIDisplayConfigState } from "../UIDisplayConfigStateContext";
import { useEffect, useState } from "react";
import { RotateCw, X } from "lucide-react";

const ConfigInputBoolean = ({
  id,
  index,
  cur,
  isInit,
}: {
  id: string,
  index: number,
  cur: ConfigTypePrimitiveType<"boolean"> | null,
  isInit: boolean
}): React.ReactElement => {
  if (cur === null) {
    return <>null</>
  }
  return <div className="config-input-content">
    <button className="config-input-boolean-button"
      onClick={() => {
        window.electron.sendUISetDisplayConfigEntry(id, index, !cur);
      }}
    >
      {cur ? "True" : "False"}
    </button>
  </div>
}

const ConfigInputHexcolor = ({
  id,
  index,
  cur,
  isInit,
}: {
  id: string,
  index: number,
  cur: ConfigTypePrimitiveType<"hexcolor"> | null,
  isInit: boolean
}): React.ReactElement => {
  const [inputValue, setInputValue] = useState<string>(cur ?? "");
  const [isValid, setIsValid] = useState<boolean>(configTypes["hexcolor"].validator(inputValue));

  useEffect(() => {
    const hasValidInput = configTypes["hexcolor"].validator(inputValue);
    if (hasValidInput) {
      window.electron.sendUISetDisplayConfigEntry(id, index, inputValue);
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

const ConfigInputNnumber = ({
  id,
  index,
  cur,
  isInit,
}: {
  id: string,
  index: number,
  cur: ConfigTypePrimitiveType<"nnumber"> | null,
  isInit: boolean
}): React.ReactElement => {
  const [inputValue, setInputValue] = useState<string>(JSON.stringify(cur) ?? "");
  const [isValid, setIsValid] = useState<boolean>(configTypes["nnumber"].validator(inputValue));

  useEffect(() => {
    const numberValue = parseInt(inputValue);
    const hasValidInput = configTypes["nnumber"].validator(numberValue);
    if (hasValidInput) {
      window.electron.sendUISetDisplayConfigEntry(id, index, numberValue);
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
        {
        }
        :
        {
          backgroundImage: "repeating-linear-gradient(45deg, #FF000080 0, #FF000080 5px, transparent 5px, transparent 10px)",
        }
      }
    />
  </div>
}

const ConfigInputResetButton = ({
  id,
  index,
  isInit,
}: {
  id: string,
  index: number,
  isInit: boolean
}): React.ReactElement => {
  return <button
    className="config-input-reset-button"
    onClick={() => {
      window.electron.sendUIResetDisplayConfigEntry(id, index);
    }}
  >
    <RotateCw size={13} style={isInit ? { color: "var(--gray-70)" } : {}} />
  </button>;
}

const ConfigInput = ({
  type,
  id,
  index,
  cur,
  isInit,
  title,
}: {
  type: ConfigTypesKey,
  id: string,
  index: number,
  cur: ConfigTypePrimitiveType<ConfigTypesKey> | null,
  isInit: boolean
  title: string,
}): React.ReactElement => {
  return (
    <div className="config-input" style={cur === null ? { opacity: "50%", pointerEvents: "none" } : {}}>
      <div className="config-input-title">{title}</div>
      {
        type === "boolean" ?
          <ConfigInputBoolean
            id={id}
            index={index}
            cur={cur as ConfigTypePrimitiveType<"boolean"> | null}
            isInit={isInit}
          />
          :
          type === "hexcolor" ?
            <ConfigInputHexcolor
              id={id}
              index={index}
              cur={cur as ConfigTypePrimitiveType<"hexcolor"> | null}
              isInit={isInit}
            />
            :
            type === "nnumber" ?
              <ConfigInputNnumber
                id={id}
                index={index}
                cur={cur as ConfigTypePrimitiveType<"nnumber"> | null}
                isInit={isInit}
              />
              :
              <></>
      }
      <ConfigInputResetButton
        id={id}
        index={index}
        isInit={isInit}
      />
    </div>
  );
}

const SettingsButtonModal: React.FC<{}> = ({ }) => {
  const { hideModal } = useModal();
  const { config } = useUIDisplayConfigState();
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
      <div style={{ background: "red" }}>
        controls
      </div>
      <div className="settings-button-modal-content">
        {config.map(entry => (
          typeof entry === "string" ?
            <h3 className="config-heading">{entry}</h3>
            :
            <ConfigInput
              key={entry.id}
              type={entry.type}
              id={entry.id}
              cur={entry.cur[0]}
              isInit={entry.isInit[0]}
              index={0}
              title={entry.title}
            />
        ))}
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
