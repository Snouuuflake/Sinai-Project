class DisplayConfig {

}

// we have some "types" like csscolors that require
// more validation than just type validation on setting
// this is for that :)
abstract class DisplayConfigEntryValue<T> {
  abstract readonly _value: T;
  abstract readonly _init: T;
  // to foce classes to define a constant type value
  abstract get type(): string;
  abstract get value(): T;
  /*
   * @throws maybe
   */
  abstract set value(value: T);
  abstract reinit(): void;
}

class DisplayConfigEntryValueBoolean extends DisplayConfigEntryValue<boolean> {
  _value: boolean;
  _init: boolean;
  get type() {
    return "boolean";
  }
  constructor(init: boolean) {
    super();
    this._value = init;
    this._init = init;
  }
  get value() {
    return this._value;
  }
  set value(value: boolean) {
    this._value = value;
  }
  reinit() {
    this.value = this._init; // works
  }
}



class DisplayConfigEntry<T extends DisplayConfigEntryValue<any>> {
  id: string;
  name: string;
  value: T;
  constructor(id: string, name: string, value: T) {
    this.id = id;
    this.name = name;
    this.value = value;
  }
  toSerializedDisplayConfigEntry() {
    return {
      id: this.id,
      name: this.name,
      value: this.value,
    }
  }
}

