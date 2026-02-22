import { DISPLAYS } from "./constants.js";

type ConfigTypesKey = keyof DisplayConfigTypeBaseTypeMap;
type ConfigTypePrimitiveType<T extends ConfigTypesKey> = DisplayConfigTypeBaseTypeMap[T];
type Validator<T extends ConfigTypesKey> = (value: unknown) => value is ConfigTypePrimitiveType<T>;
type ConfigType<T extends ConfigTypesKey> = { readonly typeName: T, readonly validator: Validator<T> };
type DisplayConfigTypeBaseTypeMap = {
  // pnumber: number;
  // hexcolor: string
  boolean: boolean;
  hexcolor: string;
  nnumber: number;
  string: string;
  path: string
};
const configTypes: { [T in ConfigTypesKey]: ConfigType<T> } = {
  boolean: {
    typeName: "boolean",
    validator: (value) => (typeof value === "boolean"),
  },
  hexcolor: {
    typeName: "hexcolor",
    validator: (value): value is string => (typeof value === "string") && (value.match(/#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/) !== null)
  },
  nnumber: {
    typeName: "nnumber",
    validator: (value): value is number => (typeof value === "number") && (value >= 0)
  },
  string: {
    typeName: "string",
    validator: (value): value is string => (typeof value === "string")
  },
  path: {
    typeName: "path",
    validator: (value): value is string => (typeof value === "string")
  }
} as const;

class ConfigEntryBase<T extends ConfigTypesKey> {
  readonly id: string;
  #configType: ConfigType<T>;
  constructor(id: string, type: T) {
    this.id = id;
    this.#configType = configTypes[type];
  }
  get type() {
    return this.#configType.typeName;
  }
  protected assertType(value: unknown): asserts value is ConfigTypePrimitiveType<T> {
    if (!this.#configType.validator(value))
      throw new Error(
        `ConfigEntry "${this.id}": invalid value ${JSON.stringify(value)} for type "${this.#configType.typeName}".`
      )
  }
}




type SerializedDisplayConfigEntry = {
  id: string;
  type: string;
  cur: any[];
  isInit: boolean[];
}

type SerializedGeneralConfigEntry = {
  id: string;
  type: string;
  cur: any;
  isInit: boolean;
}

export {
  ConfigEntryBase,
  configTypes,
};
export type {
  ConfigTypesKey,
  ConfigTypePrimitiveType,
  SerializedDisplayConfigEntry,
  SerializedGeneralConfigEntry,
}
