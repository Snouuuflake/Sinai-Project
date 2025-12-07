import { readFile, writeFile } from "fs";

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

type IndexedLine = {
  index: number;
  content: string;
};

//const argLines = lines.filter((l) => l.match(/^!-[a-zA-Z]/));
//returns {index: -1} if command doesnt exist && !required
function readCommand(
  commandLines: IndexedLine[],
  char: string,
  required: boolean,
): IndexedLine {
  if (char.length != 1)
    throw new Error(`readCommand arg char ${char} not single character`);
  const filtered = commandLines.filter((il) => il.content[2] === char);
  let res: IndexedLine;
  switch (filtered.length) {
    case 0:
      if (required) {
        throw new Error(`Command ${char} not found`);
      } else {
        return { index: -1, content: "" };
      }
      break;
    case 1:
      res = {
        index: filtered[0].index,
        content: filtered[0].content.substring(3).trim(),
      };
      break;
    default:
      throw new Error(`Command ${char} used more than once`);
      break;
  }
  if (!res && required) {
    throw new Error(`Command ${char} has no value`);
  }
  return res;
}

function parseMSS(multilineStr: string) {
  const properties = new SongProperties("", "");
  const order: SongElementIdentifier[] = [];
  const notes: Note[] = [];
  const sections: Section[] = [];
  let noteCounter: number = 0;

  const PROPERTIES = [
    {
      char: "T",
      name: "title",
      required: true,
    },
    {
      char: "A",
      name: "author",
      required: false,
    },
  ] as const;

  const indexedPropertyCommandLines: IndexedLine[] = [];

  const lines: IndexedLine[] = multilineStr
    .split("\n")
    .map((l, i) => ({ index: i, content: l.trim() }));

  // reading title & author
  let commandLines: IndexedLine[] = lines.filter((il) =>
    il.content.match(/^!\-[a-zA-Z]/),
  );

  try {
    for (const prop of PROPERTIES) {
      const val = readCommand(commandLines, prop.char, prop.required);
      indexedPropertyCommandLines.push(val);
      properties[prop.name] = val.content;
    }
  } catch (error) {
    throw error;
  }
  let offset: number = 0;
  for (const il of indexedPropertyCommandLines) {
    if (il.index >= 0) {
      lines.splice(il.index - offset, 1);
    }
    lines.forEach((il, i) => (il.index = i));
    offset++;
  }
  commandLines = lines.filter((il) => il.content.match(/^!\-[a-zA-Z]/));

  //const indexedSLines: PlainSection[] = [];
  // getting the lines that belong to each section
  for (let i = 0; i < commandLines.length; i++) {
    const lastLineIndex =
      i != commandLines.length - 1
        ? commandLines[i + 1].index
        : lines[lines.length - 1].index;

    if (commandLines[i].content.match(/^!-S/)) {
      const name: string = commandLines[i].content.substring(3).trim();
      let stringContent: string = "";

      if (commandLines[i].index < lastLineIndex) {
        stringContent = lines
          .slice(commandLines[i].index + 1, lastLineIndex)
          .reduce((p, c) => p + "\n" + c.content, "")
          .trim();
      }
      // else used to have an error

      //if (stringContent === "") {
      //  throw new Error(`Section ${name} is empty`);
      //}
      if (
        order.filter((sei) => sei.type === "section" && sei.name === name)
          .length != 0
      ) {
        throw new Error(`Section ${name} is defined multiple times`);
      }

      sections.push(
        new Section(
          name,
          stringContent
            ? stringContent.split("\n\n").map((x) => new Verse(x.split("\n")))
            : [],
        ),
      );
      order.push(new SongElementIdentifier("section", name));
    }

    if (commandLines[i].content.match(/^!-N/)) {
      noteCounter++;
      const name = `note${noteCounter}`;
      const content = commandLines[i].content.substring(3).trim();

      if (content === "") {
        throw new Error(`Note ${noteCounter} is empty`);
      }

      order.push(new SongElementIdentifier("note", name));
      notes.push(new Note(name, content));
    }

    if (commandLines[i].content.match(/^!-R/)) {
      const name = commandLines[i].content.substring(3).trim();
      if (
        order.filter((sei) => sei.type === "section" && sei.name === name)
          .length == 0
      ) {
        throw new Error(`Section ${name} is repeated but not yet defined`);
      }
      order.push(new SongElementIdentifier("repeat", name));
    }
  }
  return new Song(properties, sections, notes, order);
}

function readMSSFile(path: string): Promise<Song> {
  return new Promise((resolve, reject) => {
    readFile(path, (err, data) => {
      if (err) {
        reject(err);
      }

      try {
        resolve(parseMSS(data.toString()));
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  });
}

function sortSectionOrder(song: Song): void {
  for (const s of song.sections) {
    const filtered = song.sectionOrder.filter((sei) => sei.name === s.name);
    filtered.forEach((sei) => {
      sei.type = "repeat";
    });
    filtered[0]!.type = "section";
  }
}

function sectionContentToString(section: Section): string {
  return section.verses
    .map<string>((v) => v.lines.reduce((p, c) => p + c + "\n", ""))
    .reduce((p, c) => (p ? p + "\n" + c : p));
}

function mssToString(song: Song): string {
  sortSectionOrder(song);
  try {
    return [
      `!-T ${song.properties.title}\n`,
      song.properties.author ? `!-A ${song.properties.author}\n` : "",
      ...song.sectionOrder.map<string>((sei) =>
        sei.type === "section"
          ? `!-S ${sei.name}\n${sectionContentToString(song.sections.find((s) => s.name === sei.name)!)}\n`
          : sei.type === "repeat"
            ? `!-R ${sei.name}\n`
            : sei.type === "note"
              ? `!-N ${song.notes.find((n) => n.name === sei.name)!.text}\n`
              : "",
      ),
    ].reduce((p, c) => p + c + "\n", "");
  } catch (e) {
    throw e;
  }
}

function writeMSSFile(filePath: string, song: Song): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    writeFile(filePath, mssToString(song), { encoding: "utf-8" }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export { readMSSFile, writeMSSFile };
