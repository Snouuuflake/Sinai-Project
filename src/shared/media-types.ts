import * as mupdf from "mupdf";

export type SongVerse = {
  lines: Array<string>;
  id: number;
}

export type SongSection = {
  name: string;
  id: number; // not saved
  verses: Array<SongVerse>;
}

// type SongNote = {
//   name: string;
//   text: string;
// }

export type SongElementTypeType = "section" | /*"note" |*/ "repeat";

export type SongElementIdentifier = {
  type: SongElementTypeType;
  name: string;
}

export type SongPropertiesType = {
  title: string;
  author: string;
}

export type Song = {
  properties: SongPropertiesType;
  sections: Array<SongSection>;
  elementOrder: number[];
}



export type MediaTypeType = "image" | "song" | "pdf";


export type SerializedMediaIdentifier = {
  id: number;
  name: string;
  type: MediaTypeType;
}

export type SerializedMedia = {
  name: string;
  type: MediaTypeType;
  value: any;
}

export type SerializedMediaWithId = {
  id: number;
  name: string;
  type: MediaTypeType;
  value: any;
}

export type SerializedImageMediaWithId =
  Omit<SerializedMediaWithId, "value" | "type"> & {
    type: "image";
    value: MediaImageValueType;
  }

export type SerializedSongMediaWithId =
  Omit<SerializedMediaWithId, "value" | "type"> & {
    type: "song";
    value: MediaSongValueType;
  }

export type SerializedPDFMediaWithId =
  Omit<SerializedMediaWithId, "value" | "type"> & {
    type: "song";
    value: MediaPDFValueType;
  }

export type MediaPDFValueType = {
  path: string;
  b64pages: string[];
}

export type MediaImageValueType = {
  path: string;
}

export type MediaSongValueType = {
  song: Song;
}


// if you have a million verses this breaks, but also 
// if you have a million verses you deserve it
export const SECTION_MULTIPLIER = 1000000;
export const encodeVerseId = (section: number, verse: number) => (section * SECTION_MULTIPLIER) + verse;
export const decodeVerseId = (id: number) => ({
  section: Math.floor(id / SECTION_MULTIPLIER),
  verse: id % SECTION_MULTIPLIER
});
export const encodeOrderedVerseId = (orderedSection: number, verse: number) => (orderedSection * SECTION_MULTIPLIER) + verse;
export const decodeOrderedVerseId = (id: number) => ({
  sectionOrderIndex: Math.floor(id / SECTION_MULTIPLIER),
  verse: id % SECTION_MULTIPLIER
});
export const getSectionFromOrderedSection = (song: Song, orderedSectionId: number) => {
  return song.sections.find(s => s.id === song.elementOrder[orderedSectionId]);
}

// live elements keep the id of the media they come from
// the element value should be unique within the media
// element has an arbitrary value, can encode whatever data
// is needed, such as the above pair of functions
export type LiveElementIdentifier = {
  id: number;
  element: number;
}

export type LiveElementTypeType = "image" | "text" | "b64png";

export type LiveElementB64PNGValue = {
  image: string;
}

export type LiveElementImageValue = {
  id: number;
}

export type LiveElementTextValue = {
  lines: string[]
}


export interface SerializedLiveElement {
  id: number;
  element: number;
  type: LiveElementTypeType;
  value: any;
}

export type SerializedLiveState = {
  liveElement: SerializedLiveElement | null;
  logo: boolean;
}



export type SerializedDisplayConfigEntry = {
  type: string;
  category: string;
  id: string;
  defaultValue: any;
  values: any[];
}


// export {
//   encodeOrderedVerseId,
//   decodeOrderedVerseId,
//   getSectionFromOrderedSection
// };
//
// export type {
//   MediaImageValueType,
//   MediaSongValueType,
//   MediaPDFValueType,
//
//   SerializedMediaIdentifier,
//   SerializedMediaWithId,
//   SerializedMedia,
//   SerializedImageMediaWithId,
//   SerializedSongMediaWithId,
//   LiveElementIdentifier,
//   LiveElementImageValue,
//   LiveElementTextValue,
//   SerializedLiveElement,
//
//   SongVerse,
//   SongSection,
//   SongElementIdentifier,
//   SongElementTypeType,
//   SongPropertiesType,
//   Song,
//
//   SerializedDisplayConfigEntry as SerializedConfigEntry,
//
//   SerializedLiveState,
// };
