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
      {isInit ? "(i)" : ""}
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

  if (cur === null) {
    return <>null</>
  }

  return <div className="config-input-content">
    <input
      style={{ backgroundColor: isValid ? "green" : "red" }}
      value={inputValue}
      onChange={(e) => {
        setInputValue(e.target.value)
      }}
    />
  </div>
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
    <div className="config-input">
      <h3 className="config-input-title">{title}</h3>
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
            <></>
      }
    </div>
  )    // case "hexcolor":
  //   return <div>
  //     <h2>hexcolor</h2>
  //     <div>{id}</div>
  //     {
  //       cur === null ?
  //         <div>null!</div>
  //         :
  //         <>
  //           <div>{type}</div>
  //           <div>{cur}</div>
  //           <div>{isInit ? "init" : "notinit"}</div>
  //         </>
  //     }
  //   </div>;
}

const SettingsButtonModal: React.FC<{}> = ({ }) => {
  const { hideModal } = useModal();
  const { config } = useUIDisplayConfigState();
  return (
    <div style={{ backgroundColor: "pink" }}>
      <button onClick={(e) => hideModal()}>x</button>
      <h1>Display Config</h1>
      <div>
        {config.map(entry => (
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
    </button>
  )
}

export default SettingsButton;
