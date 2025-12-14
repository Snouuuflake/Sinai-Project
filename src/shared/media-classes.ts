type SongVerse = {
  lines: Array<string>;
  id: number;
}

type SongSection = {
  name: string;
  id: number; // not saved
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
  elementOrder: number[];
}



type MediaTypeType = "image" | "song";

abstract class Media {
  name: string;
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
  abstract toSerializedLiveElement(id: number, element: number): SerializedLiveElement;
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

type SerializedSongMediaWithId =
  Omit<SerializedMediaWithId, "value" | "type"> & {
    type: "song";
    value: MediaSongValueType;
  }

type MediaImageValueType = {
  path: string;
}

type MediaSongValueType = {
  song: Song;
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
  toSerializedLiveElement(id: number, element: number): SerializedLiveElement {
    return {
      id: id,
      element: element,
      type: "image",
      value: {
        id: id,
      } as LiveElementImageValue,
    };
  }
}

class MediaSong extends Media {
  type = "song" as const;
  value: MediaSongValueType;
  constructor(name: string, song: Song) {
    super(name);
    this.value = { song };
  }
  toSerializedLiveElement(id: number, element: number): SerializedLiveElement {
    const decodedElement = decodeVerseId(element);
    return {
      id: id,
      element: element,
      type: "text",
      value: {
        lines: this.value.song.sections
          .find(s => s.id === decodedElement.section)?.
          verses.find(v => v.id === decodedElement.verse)?.
          lines
          ?? []
      } as LiveElementTextValue
    }
  }
}
const SECTION_MULTIPLIER = 1000000
const encodeVerseId =
  (section: number, verse: number) => (section * SECTION_MULTIPLIER) + verse;
const decodeVerseId =
  (id: number) => ({
    section: Math.floor(id / SECTION_MULTIPLIER),
    verse: id % SECTION_MULTIPLIER
  });

type LiveElementIdentifier = {
  id: number;
  element: number;
}

type LiveElementTypeType = "image" | "text";

type LiveElementImageValue = {
  id: number;
}

type LiveElementTextValue = {
  lines: string[]
}


interface SerializedLiveElement {
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

export {
  Media,
  MediaImage,
  MediaSong,
  encodeVerseId,
  decodeVerseId
};
export type {
  MediaImageValueType,
  SerializedMediaIdentifier,
  SerializedMediaWithId,
  SerializedImageMediaWithId,
  SerializedSongMediaWithId,
  LiveElementIdentifier,
  LiveElementImageValue,
  LiveElementTextValue,
  SerializedLiveElement,
  UIStateContextType,

  SongVerse,
  SongSection,
  SongElementIdentifier,
  SongElementTypeType,
  SongPropertiesType,
  Song,
};
