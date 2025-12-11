type MediaTypeType = "image";
abstract class Media {
  readonly name: string;
  abstract readonly type: MediaTypeType;
  abstract value: any;
  constructor(name: string) {
    this.name = name;
  }
  toSerializedMediaIdentifier(id: number): SerializedMediaIdentifier {
    return {
      id: id,
      name: this.name,
      type: this.type,
    }
  }
  toSerializedMediaWithId(id: number): SerializedMediaWithId {
    return {
      id: id,
      name: this.name,
      type: this.type,
      value: this.value,
    }
  }
}

type SerializedMediaIdentifier = {
  id: number;
  name: string;
  type: MediaTypeType;
}

type SerializedMediaWithId = {
  id: number;
  name: string;
  type: MediaTypeType;
  value: any;
}

type SerializedImageMediaWithId =
  Omit<SerializedMediaWithId, "value" | "type"> & {
    type: "image";
    value: MediaImageValueType;
  }

type MediaImageValueType = {
  path: string;
}

class MediaImage extends Media {
  type = "image" as const;
  value: MediaImageValueType;
  constructor(name: string, path: string) {
    super(name);
    this.value = {
      path: path,
    };
  }
}

type UIStateContextType = {
  setlist: SerializedMediaIdentifier[];
  openMedia: SerializedMediaWithId | null;
}

export { Media, MediaImage };
export type {
  MediaImageValueType,
  SerializedMediaIdentifier,
  SerializedMediaWithId,
  SerializedImageMediaWithId,
  UIStateContextType
};
