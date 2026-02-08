import { createContext, useContext, useState, useEffect, useRef } from "react";
import { DISPLAYS } from "../shared/constants";
import {
  ConfigEntryBase,
  ConfigTypePrimitiveType,
  ConfigTypesKey,
  SerializedDisplayConfigEntry
} from "../shared/config-classes";

type UIDisplayConfigType = (UIDisplayConfigEntry<ConfigTypesKey> | string)[];


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
  #config: UIDisplayConfigType = [];
  constructor() {
  }
  addEntry(entry: UIDisplayConfigEntry<ConfigTypesKey>) {
    const findRes = this.#config.find(x => (typeof x === "object") && x.id === entry.id);
    if (findRes)
      throw new Error("addEntry: id already exists");
    this.#config.push(entry);
  }
  addHeading(heading: string) {
    this.#config.push(heading);
  }
  updateFromSerialized(serializedConfig: SerializedDisplayConfigEntry[]) {
    serializedConfig.forEach(sentry => {
      const foundConfigEntry = this.#config.filter(x => x instanceof UIDisplayConfigEntry).find((x) => x.id === sentry.id);
      // yes, this is stupid
      try {
        if (foundConfigEntry === undefined)
          throw new Error(`Attempt to write to non-existant config entry from main to UI (id: ${sentry.id})`);
        console.log(sentry)
        foundConfigEntry.set(sentry.cur, sentry.isInit);
      } catch (err) {
        if (err instanceof Error)
          window.electron.sendAlert(err.message);
      }
    })
  }
  get config(): readonly (UIDisplayConfigEntry<ConfigTypesKey> | string)[] {
    return this.#config;
  }
}



type UIDisplayConfigStateContextType = {
  config: readonly (UIDisplayConfigEntry<ConfigTypesKey> | string)[];
}

export const UIDisplayConfigStateContext = createContext<UIDisplayConfigStateContextType | null>(null);

export const UIDisplayConfigStateContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const displayConfigRef = useRef<UIDisplayConfig | null>(null);
  if (displayConfigRef.current === null) {
    displayConfigRef.current = new UIDisplayConfig();
    displayConfigRef.current.addHeading("General");
    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("background-color", "hexcolor", "Background Color"));
    displayConfigRef.current.addHeading("Text");
    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("bold", "boolean", "Bold Text"));
    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("test", "hexcolor", "test"));
  }

  const [config, setConfig] = useState<(readonly (UIDisplayConfigEntry<ConfigTypesKey> | string)[])>(displayConfigRef.current.config);

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
        setConfig([...displayConfigRef.current!.config]);
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
