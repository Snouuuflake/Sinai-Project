import { createContext, useContext, useState, useEffect, useRef } from "react";
import { DISPLAYS } from "../shared/constants";
import {
  ConfigEntryBase,
  ConfigTypePrimitiveType,
  ConfigTypesKey,
  SerializedDisplayConfigEntry,
  SerializedGeneralConfigEntry
} from "../shared/config-classes";

interface UIConfig {
  config: readonly any[];
  addEntry(entry: any): void;
  addHeading(heading: string): void;
  updateFromSerialized(serializedConfig: any[]): void;
}

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

type UIDisplayConfigType = (UIDisplayConfigEntry<ConfigTypesKey> | string)[];
type ReadonlyUIDisplayConfigType = readonly (UIDisplayConfigEntry<ConfigTypesKey> | string)[];

class UIDisplayConfig implements UIConfig {
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
    const errors: Error[] = [];
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
          errors.push(err);
      }
    })
    if (errors.length > 0)
      window.electron.sendAlert(errors.map(err => err.message).reduce((p, c) => p + c + "\n\n", "").trim());
  }
  get config(): ReadonlyUIDisplayConfigType {
    return this.#config;
  }
}

type UIGeneralConfigType = (UIGeneralConfigEntry<ConfigTypesKey> | string)[];
type ReadonlyUIGeneralConfigType = readonly (UIGeneralConfigEntry<ConfigTypesKey> | string)[];
type GeneralConfigMap = Map<string, ConfigTypePrimitiveType<ConfigTypesKey> | null>;

class UIGeneralConfigEntry<T extends ConfigTypesKey> extends ConfigEntryBase<T> {
  // null will disable controls incase no value is given from main
  #cur: (ConfigTypePrimitiveType<T> | null) = null;
  #isInit: boolean = false;
  readonly title: string;
  constructor(id: string, type: T, title: string) {
    super(id, type);
    this.title = title;
  }
  set(value: unknown, isInit: boolean) {
    this.assertType(value);
    this.#cur = value;
    this.#isInit = isInit;
  }
  get cur() {
    return this.#cur;
  }
  get isInit() {
    return this.#isInit;
  }
}

class UIGeneralConfig implements UIConfig {
  #config: UIGeneralConfigType = [];
  constructor() {
  }
  addEntry(entry: UIGeneralConfigEntry<ConfigTypesKey>) {
    const findRes = this.#config.find(x => (typeof x === "object") && x.id === entry.id);
    if (findRes)
      throw new Error("addEntry: id already exists");
    this.#config.push(entry);
  }
  addHeading(heading: string) {
    this.#config.push(heading);
  }
  updateFromSerialized(serializedConfig: SerializedGeneralConfigEntry[]) {
    const errors: Error[] = [];
    serializedConfig.forEach(sentry => {
      const foundConfigEntry = this.#config.filter(x => x instanceof UIGeneralConfigEntry).find((x) => x.id === sentry.id);
      // yes, this is stupid
      try {
        if (foundConfigEntry === undefined)
          throw new Error(`Attempt to write to non-existant config entry from main to UI (id: ${sentry.id})`);
        console.log(sentry)
        foundConfigEntry.set(sentry.cur, sentry.isInit);
      } catch (err) {
        if (err instanceof Error)
          errors.push(err);
      }
    })
    if (errors.length > 0)
      window.electron.sendAlert(errors.map(err => err.message).reduce((p, c) => p + c + "\n\n", "").trim());
  }
  get config(): ReadonlyUIGeneralConfigType {
    return this.#config;
  }
  get map(): Map<string, ConfigTypePrimitiveType<ConfigTypesKey> | null> {
    return new Map(this.#config.filter(x => x instanceof UIGeneralConfigEntry).map(x => [x.id, x.cur]))
  }
}

type ConfigStateContextType = {
  displayConfig: ReadonlyUIDisplayConfigType;
  generalConfig: ReadonlyUIGeneralConfigType;
  generalConfigMap: GeneralConfigMap;
}

export const ConfigStateContext = createContext<ConfigStateContextType | null>(null);

export const ConfigStateContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const displayConfigRef = useRef<UIDisplayConfig | null>(null);
  if (displayConfigRef.current === null) {
    displayConfigRef.current = new UIDisplayConfig();
    displayConfigRef.current.addHeading("General");
    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("background-color", "hexcolor", "Background Color"));
    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("background-image", "path", "Background Image"));
    displayConfigRef.current.addHeading("Text");
    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("font-size", "nnumber", "Font Size"));
    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("font", "string", "Font"));
    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("bold", "boolean", "Bold Text"));
    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("text-color", "hexcolor", "Text Color"));

    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("text-margin-top", "nnumber", "Top Margin"));
    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("text-margin-bottom", "nnumber", "Bottom Margin"));
    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("text-margin-left", "nnumber", "Left Margin"));
    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("text-margin-right", "nnumber", "Right Margin"));

    displayConfigRef.current.addEntry(new UIDisplayConfigEntry("text-background-color", "hexcolor", "Text Background Color"));
  }

  const [displayConfig, setDisplayConfig] = useState<ReadonlyUIDisplayConfigType>(displayConfigRef.current.config);


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
        setDisplayConfig([...displayConfigRef.current!.config]);
      }
    );
    window.electron.sendUIDisplayConfigRequest();
    return remover;
  }, [])

  const generalConfigRef = useRef<UIGeneralConfig | null>(null);
  if (generalConfigRef.current === null) {
    generalConfigRef.current = new UIGeneralConfig();
    generalConfigRef.current.addEntry(new UIGeneralConfigEntry("dark-theme", "boolean", "Dark Theme"));
  }

  const [generalConfig, setGeneralConfig] = useState<ReadonlyUIGeneralConfigType>(generalConfigRef.current.config);
  const [generalConfigMap, setGeneralConfigMap] = useState<GeneralConfigMap>(generalConfigRef.current.map);

  useEffect(() => {
    const remover = window.electron.onUIUpdateGeneralConfig(
      (newconfig: SerializedGeneralConfigEntry[]) => {
        // this is safe, right?
        try {
          generalConfigRef.current!.updateFromSerialized(newconfig);
        } catch (err) {
          console.error(err)
          console.log(newconfig)
        }
        setGeneralConfig([...generalConfigRef.current!.config]);
        setGeneralConfigMap(generalConfigRef.current!.map);
      }
    );
    window.electron.sendUIGeneralConfigRequest();
    return remover;
  }, [])

  return <ConfigStateContext.Provider
    value={{ displayConfig, generalConfig, generalConfigMap }}>
    {children}
  </ConfigStateContext.Provider >
};

export const useConfigState = () => {
  const context = useContext(ConfigStateContext);
  if (!context) {
    throw new Error("used useUIDisplayConfigState outside of UIDisplayConfigStateContext");
  }
  return context;
}
