import { DISPLAYS } from "./constants.js";
// class DisplayConfig {
//
// }
//
// // we have some "types" like csscolors that require
// // more validation than just type validation on setting
// // this is for that :)
// abstract class DisplayConfigEntryValue<T> {
//   #cur: T;
//   #init: T;
//   // to foce classes to define a constant type value
//   abstract get type(): string;
//   constructor(init: T) {
//     this.#init = this.validateValue(init);
//     this.#cur = this.#init;
//   }
//   /**
//   * validates value that _cur and _init are being set to
//   * for stuff like csscolors that hase more requirements 
//   * than being type T
//   * @throws it sure does
//   * @returns value
//   */
//   abstract validateValue(value: T): T;
//   /**
//   * resets #cur to = #init 
//   */
//   reinit() {
//     this.#cur = this.#init;
//   }
//   get cur(): T {
//     if (typeof (this.#cur) === "object") {
//       return structuredClone(this.#cur);
//     } else {
//       return this.#cur;
//     }
//   }
//   set cur(value: T) {
//     this.#cur = this.validateValue(value);
//   }
// }
//
// class DisplayConfigEntryValueBoolean extends DisplayConfigEntryValue<boolean> {
//   get type() {
//     return "boolean";
//   }
//   validateValue(value: boolean) {
//     return value;
//   }
// }
//
// class DisplayConfigEntryValueHexcolor extends DisplayConfigEntryValue<string> {
//   get type() {
//     return "hexcolor";
//   }
//   validateValue(value: string) {
//     if (!value.match(/^#[0-9A-Fa-f]{6}/))
//       throw new Error("Invalid hexnumber string");
//     return value;
//   }
// }
//
// class DisplayConfigEntryValueNnumber extends DisplayConfigEntryValue<number> {
//   get type() {
//     return "nnumber";
//   }
//   validateValue(value: number) {
//     if (!(value >= 0))
//       throw new Error("Nnumber not >= 0");
//     return value;
//   }
// }


type ConfigTypesKey = keyof DisplayConfigTypeBaseTypeMap;
type ConfigTypePrimitiveType<T extends ConfigTypesKey> = DisplayConfigTypeBaseTypeMap[T];
type Validator<T extends ConfigTypesKey> = (value: unknown) => value is ConfigTypePrimitiveType<T>;
type ConfigType<T extends ConfigTypesKey> = { readonly typeName: T, readonly validator: Validator<T> };
type DisplayConfigTypeBaseTypeMap = {
  // pnumber: number;
  // hexcolor: string
  boolean: boolean;
  hexcolor: string;
};
const configTypes: { [T in ConfigTypesKey]: ConfigType<T> } = {
  boolean: {
    typeName: "boolean",
    validator: (value) => (typeof value === "boolean"),
  },
  // pnumber: {
  //   typeName: "pnumber",
  //   validator: (value): value is number => (typeof value === "number") && isFinite(value) && value > 0
  // },
  hexcolor: {
    typeName: "hexcolor",
    validator: (value): value is string => (typeof value === "string") && (value.match(/#[0-9a-fA-F]{6}/) !== null)
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

class MainDisplayConfigEntry<T extends ConfigTypesKey> extends ConfigEntryBase<T> {
  #init: ConfigTypePrimitiveType<T>;
  #cur: ConfigTypePrimitiveType<T>[];
  constructor(id: string, type: T, init: ConfigTypePrimitiveType<T>) {
    super(id, type);
    this.assertType(init);
    this.#init = init;
    this.#cur = Array.from({ length: DISPLAYS }, () => this.#init);
  }
  get cur(): ConfigTypePrimitiveType<T>[] {
    return [...this.#cur];
  }
  setCurEntry(index: number, value: unknown) {
    this.assertType(value);
    if (index >= DISPLAYS)
      throw new Error(`MainConfigEntry.setCurEntry "${this.id}" > no. of displays`);
    this.#cur[index] = value;
  }
  reinitEntry(index: number) {
    if (index >= DISPLAYS)
      throw new Error(`MainConfigEntry.reinitEntry "${this.id}" > no. of displays`);
    this.#cur[index] = this.#init;
  }
  toSerialized(): SerializedDisplayConfigEntry {
    return {
      id: this.id,
      type: this.type,
      cur: this.#cur,
      isInit: this.#cur.map(x => x === this.#init)
    }
  }
}


type SerializedDisplayConfigEntry = {
  id: string;
  type: string;
  cur: any[];
  isInit: boolean[];
}

export {
  ConfigEntryBase,
  MainDisplayConfigEntry,
  configTypes,
};
export type {
  ConfigTypesKey,
  ConfigTypePrimitiveType,
  SerializedDisplayConfigEntry,
}
