type SongVerse = {
  lines: Array<string>;
}

type SongSection = {
  name: string;
  verses: Array<SongVerse>;
}

// type SongNote = {
//   name: string;
//   text: string;
// }

type SongElementTypeType = "section" | /*"note" |*/ "repeat";

type SongElementIdentifier = {
  type: SongElementTypeType;
  name: string;
}

type SongPropertiesType = {
  title: string;
  author: string;
}

type Song = {
  properties: SongPropertiesType;
  sections: Array<SongSection>;
  // notes: SongNote[];
  elementOrder: Array<SongElementIdentifier>;
}



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
  toSerializedLiveElement(id: number, element: number): SerializedLiveElement {
    return {
      id: id,
      element: element,
      type: this.type,
      value: this.getSerializedLiveElementValue(id, element),
    }
  }
  abstract getSerializedLiveElementValue(id: number, element: number): any;
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

type LiveElementImageValueType = {
  id: number;
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
  /**
   * @returns this.id
  */
  getSerializedLiveElementValue(id: number, element: number): LiveElementImageValueType {
    return { id: id };
  }
}

type LiveElementIdentifier = {
  id: number;
  element: number;
}

type LiveElementTypeType = "image";

type SerializedLiveElement = {
  id: number;
  element: number;
  type: LiveElementTypeType;
  value: any;
}

type UIStateContextType = {
  setlist: SerializedMediaIdentifier[];
  openMedia: SerializedMediaWithId | null;
  liveElements: Array<LiveElementIdentifier | null>;
}

export { Media, MediaImage };
export type {
  MediaImageValueType,
  SerializedMediaIdentifier,
  SerializedMediaWithId,
  SerializedImageMediaWithId,
  LiveElementIdentifier,
  SerializedLiveElement,
  UIStateContextType,

  SongVerse,
  SongSection,
  SongElementIdentifier,
  SongElementTypeType,
  SongPropertiesType,
  Song,
};
