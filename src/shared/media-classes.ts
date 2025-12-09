abstract class Media {
  readonly name: string;
  abstract readonly type: string;
  abstract value: any;
  constructor(name: string) {
    this.name = name;
  }
  toSerializedMediaWithId(id: number): SerializedMediaWithId {
    return {
      id: id,
      name: this.name,
      type: this.type,
      value: this.value
    }
  }
}

type SerializedMediaWithId = {
  id: number;
  name: string;
  type: string;
  value: any;
}

type UIState = {
  setlist: SerializedMediaWithId[];
}

type MediaImageValueType = {
  path: string;
}

class MediaImage extends Media {
  type = "";
  value: MediaImageValueType;
  constructor(name: string, value: MediaImageValueType) {
    super(name);
    this.value = value;
  }
}

export { Media, MediaImage };
export type { MediaImageValueType, UIState, SerializedMediaWithId };
