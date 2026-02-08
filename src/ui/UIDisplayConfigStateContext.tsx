import { createContext, useContext, useState, useEffect, useRef } from "react";
import { DISPLAYS } from "../shared/constants";
import {
  ConfigEntryBase,
  ConfigTypePrimitiveType,
  ConfigTypesKey,
  SerializedDisplayConfigEntry
} from "../shared/config-classes";


class UIDisplayConfigEntry<T extends ConfigTypesKey> extends ConfigEntryBase<T> {
  // null will disable controls incase no value is given from main
  #cur: (ConfigTypePrimitiveType<T> | null)[] = Array.from({ length: DISPLAYS }, () => null);
  #isInit: boolean[] = Array.from({ length: DISPLAYS }, () => false);
  readonly title: string;
  constructor(id: string, type: T, title: string) {
    super(id, type);
    this.title = title;
  }
  set(value: unknown[], isInit: boolean[]) {
    this.assertArray(value);
    this.#cur = value;
    this.#isInit = isInit;
  }
  get cur() {
    return this.#cur;
  }
  get isInit() {
    return this.#isInit;
  }
  assertArray(value: unknown[]): asserts value is ConfigTypePrimitiveType<T>[] {
    value.forEach(v => { this.assertType(v) });
  }
}

class UIDisplayConfig {
  #config: UIDisplayConfigEntry<ConfigTypesKey>[] = [];
  constructor() {
  }
  addEntry(entry: UIDisplayConfigEntry<ConfigTypesKey>) {
    const findRes = this.#config.find(x => x.id === entry.id);
    if (findRes)
      throw new Error("addEntry: id already exists");
    this.#config.push(entry);
  }
  updateFromSerialized(serializedConfig: SerializedDisplayConfigEntry[]) {
    serializedConfig.forEach(sentry => {
      const foundConfigEntry = this.#config.find(x => x.id === sentry.id);
      if (foundConfigEntry === undefined)
        throw new Error("Attempt to write to non-existant config entry from main to UI");
      console.log(sentry)
      foundConfigEntry.set(sentry.cur, sentry.isInit)
    })
  }
  get config(): readonly UIDisplayConfigEntry<ConfigTypesKey>[] {
    return this.#config;
  }
}



type UIDisplayConfigStateContextType = {
  config: readonly UIDisplayConfigEntry<ConfigTypesKey>[];
}

export const UIDisplayConfigStateContext = createContext<UIDisplayConfigStateContextType | null>(null);

export const UIDisplayConfigStateContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const displayConfigRef = useRef<UIDisplayConfig | null>(null);
  if (displayConfigRef.current === null) {
    displayConfigRef.current = new UIDisplayConfig();
    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("bold", "boolean", "Bold Text"));
    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("background-color", "hexcolor", "Background Color"));
    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("test", "hexcolor", "test"));
  }

  const [config, setConfig] = useState<readonly UIDisplayConfigEntry<ConfigTypesKey>[]>(displayConfigRef.current.config);

  useEffect(() => {
    const remover = window.electron.onUIUpdateDisplayConfig(
      (newconfig: SerializedDisplayConfigEntry[]) => {
        // this is safe, right?
        try {
          displayConfigRef.current!.updateFromSerialized(newconfig);
        } catch (err) {
          console.error(err)
          console.log(newconfig)
        }
        console.log(displayConfigRef.current!.config)
        setConfig([...displayConfigRef.current!.config]);
        console.log(displayConfigRef.current!.config)
      }
    );
    window.electron.sendUIDisplayConfigRequest();
    return remover;
  }, [])

  return <UIDisplayConfigStateContext.Provider
    value={{ config }}>
    {children}
  </UIDisplayConfigStateContext.Provider >
};

export const useUIDisplayConfigState = () => {
  const context = useContext(UIDisplayConfigStateContext);
  if (!context) {
    throw new Error("used useUIDisplayConfigState outside of UIDisplayConfigStateContext");
  }
  return context;
}
