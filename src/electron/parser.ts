import {
  SongVerse,
  SongSection,
  SongElementIdentifier,
  SongElementTypeType,
  SongPropertiesType,
  Song,
} from "../shared/media-classes.js";

const ATTRIBUTE_COMMANDS = {
  title: "T",
  author: "A"
} as const;

const ELEMENT_COMMANDS = {
  "S": "section",
  "R": "repeat",
}

function normalizeLineEndings(text: string): string {
  return text.replaceAll(/\r?\n/g, "\n");
}

function removeBlankLines(text: string): string {
  return text.split("\n")
    .map(l => l.trim())
    .flatMap(l => l === "" ? [] : l)
    .join("\n")
}

function trimLines(text: string): string {
  return text.split("\n")
    .map(l => l.trim())
    .join("\n")
}

function getMatchingLineIndexes(text: string, criteria: RegExp): number[] {
  const lines = text.split("\n");
  return lines.flatMap((l, i) => l.match(criteria) !== null ? [i] : []);
}

function getAndRemoveAllMatchingLines(text: string, criteria: RegExp): { newText: string; matchingLines: string[] } {
  const lines = text.split("\n");
  const indexes = getMatchingLineIndexes(text, criteria);
  const matchingLines = indexes.map(i => lines[i]);
  indexes.toReversed().forEach(i => lines.splice(i, 1));
  return {
    newText: lines.join("\n"),
    matchingLines
  }
}

function getCommandValue(line: string): string {
  return line.replace(/^!-[A-Za-z] /, "");
}

/**
  * @returns value is null if nothing was found 
  */
function findAttributeCommandValue(text: string, command: string): { newText: string; value: string | null } {
  const { newText, matchingLines } = getAndRemoveAllMatchingLines(text, RegExp(`^!-${command}`));
  return { newText, value: matchingLines.length == 0 ? null : getCommandValue(matchingLines[0]) }
}

function logSong(song: Song) {
  console.log("Title:", song.properties.title);
  console.log("Author:", song.properties.author);
  console.log("Element Order:");
  song.elementOrder.forEach(i => {
    console.log(" ", i, song.sections.find(s => s.id == i)?.name ?? "NOT FOUND")
  });
  console.log("Sections:")
  song.sections.forEach(s => {
    console.log(" ", `s${s.id}`, s.name);
    s.verses.forEach((v, vi) => {
      v.lines.forEach((l, li) => {
        console.log("   ", `v${vi}l${li}`, l);
      })
      console.log();
    })
  })
}

function parseSectionLines(lines: string[]): SongVerse[] {
  const verseLiness: string[][] = lines.reduce<string[][]>((p, c) => {
    if (c === "") {
      p.push([]);
    } else if (p.length == 0) {
      p.push([c]);
    } else {
      p[p.length - 1].push(c);
    }
    return p;
  }, [])
    .reduce<string[][]>((p, c) => {
      if (c.length != 0) p.push(c);
      return p;
    }, []);
  return verseLiness.map((v, i) => ({ lines: v, id: i }));
}

function parseSong(rawText: string): Song {
  const ALL_ELEMENT_COMMAND_REGEXP = /^!-(S|R)/;

  let text: string = rawText;
  text = normalizeLineEndings(text);
  text = trimLines(text);
  // text = removeBlankLines(text);

  const titleResults = findAttributeCommandValue(text, "T");
  const title = titleResults.value;
  if (title === null) throw new Error("Song has no title!");
  text = titleResults.newText;

  const authorResults = findAttributeCommandValue(text, "A");
  const author = authorResults.value;
  text = authorResults.newText;

  const lines = text.split("\n");
  lines.push(""); // important to avoid edge case in sectionRanges- "padding"

  const elementCommandIndexes = getMatchingLineIndexes(text, ALL_ELEMENT_COMMAND_REGEXP);
  const sectionIndexes = getMatchingLineIndexes(text, /^!-S/);
  const repeatIndexes = getMatchingLineIndexes(text, /^!-R/);
  // const noteIndexes = getMatchingLineIndexes(text, /^!-N/);

  const sectionNames = sectionIndexes.map(i => getCommandValue(lines[i]));
  /** [x,y) */
  const sectionRanges: [number, number][] = sectionIndexes.map(i => [i + 1, elementCommandIndexes.find(eci => eci > i) ?? (lines.length - 1)])
  const sectionLines = sectionRanges.map(x => lines.slice(...x));

  // validating no duplicate section names 
  if ((new Set(sectionNames)).size !== sectionNames.length)
    throw new Error("Duplicate section names");

  const sections: SongSection[] = sectionNames.map((x, i) => ({ name: x, id: i, verses: parseSectionLines(sectionLines[i]) }));

  function makeSongElementIdentifier(line: string): SongElementIdentifier {
    const command = line.charAt(2);
    switch (command) {
      case "S":
        return {
          type: "section",
          name: getCommandValue(line),
        }
      case "R":
        return {
          type: "repeat",
          name: getCommandValue(line),
        }
      default:
        throw new Error(`Tried to get song element type from command ${command} but it doesnt exist`);
    }
  }

  const elementOrder: number[] = elementCommandIndexes.map(i => {
    const sei = makeSongElementIdentifier(lines[i]);
    if (sei.type === "section") {
      return sections.find(s => s.name === sei.name)!.id; // this has to exist
    } else if (sei.type === "repeat") {
      const elementId = sections.find(s => s.name === sei.name)?.id; // this has to exist
      if (elementId === undefined) {
        throw new Error(`Repeat ${sei.name} has no corresponding defined section`);
      }
      return elementId;
    }
    throw new Error("how");
  })

  // old
  // const elementOrder: SongElementIdentifier[] = elementCommandIndexes.map(i => makeSongElementIdentifier(lines[i]));
  //
  // // validating no empty section or repeat names
  // elementOrder.forEach(sei => {
  //   if (sei.name === "") {
  //     throw new Error("Song section or repeat has no name");
  //   }
  // })
  // console.log(elementOrder);
  // elementOrder.forEach(sei => {
  //   if (sei.type === "repeat" && !(sections.find(s => s.name === sei.name) ?? false)) {
  //     throw new Error(`Song repeat with name ${sei.name} has no corresponding defined section`);
  //   }
  // })

  return {
    properties: {
      title: title,
      author: author ?? ""
    },
    sections,
    elementOrder
  }
}

/**
  * @throws Error
  */
function stringifySong(song: Song): string {
  type sectionWithWrittenFlag = SongSection & { isWritten: boolean };
  let buffer: string = ""
  const sectionsWithWrittenFlag = song.sections.map<sectionWithWrittenFlag>(
    s => ({ ...s, isWritten: false })
  );
  buffer += `!-T ${song.properties.title}\n`;
  buffer += `!-A ${song.properties.author}\n`;
  song.elementOrder.forEach(id => {
    const referencedSection = sectionsWithWrittenFlag.find(s => s.id === id) ?? null;
    try {
      if (referencedSection === null)
        throw new Error("stringifySong: referencedSection is null");
      if (referencedSection.isWritten) {
        buffer += `!-R ${referencedSection.name}\n`;
      } else {
        referencedSection.isWritten = true;
        buffer += `!-S ${referencedSection.name}\n`;
        buffer += referencedSection.verses.reduce<string>(
          (p, c) => p + c.lines.reduce<string>((p, c) => p + c + "\n", "") + "\n", ""
        );
      }
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(`Song ${song.properties.title} is corrupted, @writing section ${id}: ${e.message}`);
      }
    }
  });
  return buffer;
}

export { parseSong, logSong, stringifySong };
