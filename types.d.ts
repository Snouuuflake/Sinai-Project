import * as mc from "./src/shared/media-classes.js";

// class Verse {
//   lines: Array<string>;
//   constructor(lines: string[]) {
//     this.lines = lines;
//   }
// }
//
// class Section {
//   name: string;
//   verses: Array<Verse>;
//   constructor(name: string, verses: Verse[]) {
//     this.name = name;
//     this.verses = verses;
//   }
// }
//
// class Note {
//   name: string;
//   text: string;
//   constructor(name: string, text: string) {
//     this.name = name;
//     this.text = text;
//   }
// }
//
// class SongElementIdentifier {
//   type: "section" | "note" | "repeat";
//   name: string;
//   constructor(type: "section" | "note" | "repeat", name: string) {
//     this.type = type;
//     this.name = name;
//   }
// }
//
// class SongProperties {
//   title: string;
//   author: string;
//   constructor(title: string, author: string) {
//     this.title = title;
//     this.author = author;
//   }
// }
//
// class Song {
//   properties: SongProperties;
//   sections: Array<Section>;
//   notes: Note[];
//   sectionOrder: Array<SongElementIdentifier>;
//   constructor(
//     properties: SongProperties,
//     sections: Section[],
//     notes: Note[],
//     sectionOrder: SongElementIdentifier[],
//   ) {
//     this.properties = properties;
//     this.sections = sections;
//     this.notes = notes;
//     this.sectionOrder = sectionOrder;
//   }
// }

declare global {
  interface Window {
    electron: {
      onUIStateUpdate: (callback: (state: UIState) => void) => () => void;
      sendUIStateRequest: () => void;
    };
  }
}
