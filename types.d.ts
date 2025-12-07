class Verse {
  lines: Array<string>;
  constructor(lines: string[]) {
    this.lines = lines;
  }
}

class Section {
  name: string;
  verses: Array<Verse>;
  constructor(name: string, verses: Verse[]) {
    this.name = name;
    this.verses = verses;
  }
}

class Note {
  name: string;
  text: string;
  constructor(name: string, text: string) {
    this.name = name;
    this.text = text;
  }
}

class SongElementIdentifier {
  type: "section" | "note" | "repeat";
  name: string;
  constructor(type: "section" | "note" | "repeat", name: string) {
    this.type = type;
    this.name = name;
  }
}

class SongProperties {
  title: string;
  author: string;
  constructor(title: string, author: string) {
    this.title = title;
    this.author = author;
  }
}

class Song {
  properties: SongProperties;
  sections: Array<Section>;
  notes: Note[];
  sectionOrder: Array<SongElementIdentifier>;
  constructor(
    properties: SongProperties,
    sections: Section[],
    notes: Note[],
    sectionOrder: SongElementIdentifier[],
  ) {
    this.properties = properties;
    this.sections = sections;
    this.notes = notes;
    this.sectionOrder = sectionOrder;
  }
}

type InvokeJSON = (obj: any) => Promise<any>;

interface Window {
  electron: {
    useIpcListener: (
      channel: string,
      callback: (...args: any[]) => void,
    ) => () => () => void;
    invokeReadElement: (
      callback: (newElement: OpenElementType) => void,
    ) => void;
    invokeSaveSong: (song: Song) => Promise<void>;
    sendSetLiveElement: (index: number, liveElement: LiveElementType) => void;
    sendSetLogo: (value: boolean) => void;
    invokeGetLogo: (index: number, callback: (logo: boolean) => void) => void;
    invokeReadDisplaySetting: InvokeJSON;
    testFunction: () => string;
    sendNewDisplayWindow: (index: number) => void;
    sendAlert: (message: string) => void;
    invokeIndex: () => Promise<any>;
    invokeImagePath: () => Promise<string>;
    sendUpdateCss: (
      index: number,
      arrayName: DisplayConfigArrayName,
      entry: DisplayConfigEntryType,
    ) => void;
    sendGetLiveElement: (index: number) => void;

    sendReqCss: (index: number) => void;
    onResCss: (index: number, callback: (css: string) => void) => void;
    onDisplayLogo: (callback: (logo: boolean) => void) => void;
    onDisplayText: (index: number, callback: (text: string) => void) => void;
    onDisplayNone: (index: number, callback: () => void) => void;
    onDisplayImage: (index: number, callback: (path: string) => void) => void;
  };
}

type DisplayConfigBooleanEntry = {
  type: "boolean";
  key: string;
  special: string;
  css: string;
  default: any;
  value: boolean | null;
  target: string[]; // .class or #id or :root
};

type DisplayConfigCssColorEntry = {
  type: "csscolor";
  key: string;
  special: string;
  css: string;
  default: string;
  value: string | null;
  target: string[];
};

type DisplayConfigFontEntry = {
  type: "font";
  key: string;
  special: string;
  css: string;
  default: string;
  value: string | null;
  target: string[];
};

type DisplayConfigNumberEntry = {
  type: "number";
  key: string;
  special: string;
  css: string;
  default: number;
  value: number | null;
  unit: string;
  target: string[];
};

type DisplayConfigPathEntry = {
  type: "path";
  key: string;
  special: string;
  css: string;
  default: string;
  value: string | null;
  target: string[];
};

//type DisplayConfigEntryValueType =
//  | "boolean"
//  | "csscolor"
//  | "font"
//  | "number"
//  | "path";

type DisplayConfigEntryType =
  | DisplayConfigBooleanEntry
  | DisplayConfigCssColorEntry
  | DisplayConfigFontEntry
  | DisplayConfigNumberEntry
  | DisplayConfigPathEntry;

type DisplayConfigSectionType = {
  name: string;
  entries: DisplayConfigEntryType[];
};

type DisplayConfigType = DisplayConfigSectionType[];
//  {
//  global: DisplayConfigEntryType[];
//  text: DisplayConfigEntryType[];
//};

type FullDisplayConfigType = {
  globalDisplay: DisplayConfigType;
  specificDisplays: DisplayConfigType[];
};

type CssTransmissionType = {
  arrayName: DisplayConfigArrayName;
  css: string;
};

type StateObject<T> = {
  value: T;
  set: (newValue: T) => void;
};

type Image = {
  path: string;
  title: string;
};

/**
 * type: "none" | "song"
 */

type OpenNoneType = {
  type: "none";
};
type OpenSongType = {
  type: "song";
  song: Song;
  selected: LiveSongReference;
};
type OpenImageType = {
  type: "image";
  image: Image;
};
type OpenElementType = OpenNoneType | OpenSongType | OpenImageType;

type OpenElementState = StateObject<OpenElementType>;
type OpenElementsState = StateObject<OpenElementType[]>;

/**
 * sectionID is an index in song.sectionOrder.filter(sei => sei.type === "section" | sei.type === "repeat")
 */
type LiveSongReference = {
  object: any;
  sectionID: number;
  verseID: number;
};

type LiveTextType = {
  type: "text";
  value: string;
  reference: LiveSongReference;
};

type LiveImageReference = {
  object: object;
};
type LiveImageType = {
  type: "image";
  value: string;
  reference: LiveImageReference;
};

type LiveNoneReference = {
  object: null;
};

type LiveNoneType = {
  type: "none";
  value: string;
  reference: LiveNoneReference;
};

/**
 * type: "none" | "text" (for lyrics) | "image"
 */
type LiveElementType = LiveTextType | LiveImageType | LiveNoneType;

type IndexedLiveElement = {
  index: number;
  liveElement: LiveElementType;
};

type LiveElementsState = {
  value: LiveElementType[];
  set: (newLiveElements: IndexedLiveElement[]) => void;
  send: (newLiveElements: IndexedLiveElement[]) => void;
  map: (
    callback: (item: LiveElementType, i?: number) => LiveElementType,
  ) => void;
};

type NullFullDisplayConfigState = StateObject<FullDisplayConfigType | null>;

type GlobalContextType = {
  MAX_LIVE_ELEMENTS: number;
  liveElements: LiveElementsState;
  openElements: OpenElementsState;
  viewElement: OpenElementState;
  logoState: StateObject<boolean>;
  bodyContent: {
    value: "main" | "display";
    set: React.Dispatch<React.SetStateAction<"main" | "display">>;
  };
  displayConfig: NullFullDisplayConfigState;
  canType: React.MutableRefObject<boolean>;
};
