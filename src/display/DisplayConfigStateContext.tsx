import { createContext, useContext, useState, useEffect, useRef } from "react";
import { DISPLAYS } from "../shared/constants";
import {
  ConfigEntryBase,
  ConfigTypePrimitiveType,
  ConfigTypesKey,
  SerializedDisplayConfigEntry
} from "../shared/config-classes";


class DisplayConfigEntry<T extends ConfigTypesKey> extends ConfigEntryBase<T> {
  #cur: ConfigTypePrimitiveType<T> | null = null;
  #init: ConfigTypePrimitiveType<T>;
  constructor(id: string, type: T, init: ConfigTypePrimitiveType<T>) {
    super(id, type);
    this.assertType(init);
    this.#init = init;
  }
  set(value: unknown) {
    this.assertType(value);
    this.#cur = value;
  }
  get cur() {
    return this.#cur === null ? this.#init : this.#cur;
  }
}

class DisplayConfig {
  #config: DisplayConfigEntry<ConfigTypesKey>[] = [];
  constructor() {
  }
  addEntry(entry: DisplayConfigEntry<ConfigTypesKey>) {
    const findRes = this.#config.find(x => x.id === entry.id);
    if (findRes)
      throw new Error("addEntry: id already exists");
    this.#config.push(entry);
  }
  updateFromSerialized(serializedConfig: SerializedDisplayConfigEntry[], index: number) {
    const errors: Error[] = [];
    serializedConfig.forEach(sentry => {
      try {
        const foundConfigEntry = this.#config.find((x) => x.id === sentry.id);
        if (foundConfigEntry === undefined)
          throw new Error(`Attempt to write to non-existant config entry from main to display with index ${index} (id: ${sentry.id})`);
        console.log(sentry)
        foundConfigEntry.set(sentry.cur[index]);
      } catch (err) {
        if (err instanceof Error)
          errors.push(err);
      }
    })
    if (errors.length > 0)
      window.electron.sendAlert(errors.map(err => err.message).reduce((p, c) => p + c + "\n\n", "").trim());
  }
  get config(): readonly DisplayConfigEntry<ConfigTypesKey>[] {
    return this.#config;
  }
  get configHash(): Map<string, ConfigTypePrimitiveType<ConfigTypesKey>> {
    return new Map(this.#config.map(x => [x.id, x.cur]))
  }
}



type DisplayConfigStateContextType = {
  DISPLAY_ID: number;
  configHash: Map<string, ConfigTypePrimitiveType<ConfigTypesKey>>;
}

export const DisplayConfigStateContext = createContext<DisplayConfigStateContextType | null>(null);

export const DisplayConfigStateContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const params = new URLSearchParams(window.location.search);
  const DISPLAY_ID = parseInt(params.get('displayId') || '0');
  console.log("DISPLAY_ID", DISPLAY_ID);

  const displayConfigRef = useRef<DisplayConfig | null>(null);
  if (displayConfigRef.current === null) {
    displayConfigRef.current = new DisplayConfig();
    displayConfigRef.current.addEntry(new DisplayConfigEntry("background-color", "hexcolor", "#000000"));
    displayConfigRef.current.addEntry(new DisplayConfigEntry("background-image", "path", ""));

    displayConfigRef.current.addEntry(new DisplayConfigEntry("transition-duration", "nnumber", 0));
    displayConfigRef.current.addEntry(new DisplayConfigEntry("logo-path", "path", ""));
    displayConfigRef.current.addEntry(new DisplayConfigEntry("logo-size", "nnumber", 50));

    displayConfigRef.current.addEntry(new DisplayConfigEntry("font-size", "nnumber", 30));
    displayConfigRef.current.addEntry(new DisplayConfigEntry("bold", "boolean", false));
    displayConfigRef.current.addEntry(new DisplayConfigEntry("text-color", "hexcolor", "#FFFFFF"));
    displayConfigRef.current.addEntry(new DisplayConfigEntry("font", "string", "Arial"));

    displayConfigRef.current.addEntry(new DisplayConfigEntry("text-margin-top", "nnumber", 0));
    displayConfigRef.current.addEntry(new DisplayConfigEntry("text-margin-bottom", "nnumber", 0));
    displayConfigRef.current.addEntry(new DisplayConfigEntry("text-margin-left", "nnumber", 0));
    displayConfigRef.current.addEntry(new DisplayConfigEntry("text-margin-right", "nnumber", 0));

    displayConfigRef.current.addEntry(new DisplayConfigEntry("text-background-color", "hexcolor", "#00000000"));

  }

  const [configHash, setConfigHash] = useState<Map<string, ConfigTypePrimitiveType<ConfigTypesKey>>>(displayConfigRef.current.configHash);

  useEffect(() => {
    const remover = window.electron.onDisplayUpdateDisplayConfig(
      (newconfig: SerializedDisplayConfigEntry[]) => {
        // this is safe, right?
        try {
          displayConfigRef.current!.updateFromSerialized(newconfig, DISPLAY_ID);
        } catch (err) {
          console.error(err)
          console.log(newconfig)
        }
        setConfigHash(displayConfigRef.current!.configHash);
      }
    );
    window.electron.sendUIDisplayConfigRequest();
    return remover;
  }, [])

  return <DisplayConfigStateContext.Provider
    value={{ configHash, DISPLAY_ID }}>
    {children}
  </DisplayConfigStateContext.Provider >
};

export const useDisplayConfigState = () => {
  const context = useContext(DisplayConfigStateContext);
  if (!context) {
    throw new Error("used useDisplayConfigState outside of DisplayConfigStateContext");
  }
  return context;
}
