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
  song.elementOrder.forEach(sei => {
    console.log(" ", sei.type, sei.name)
  });
  console.log("Sections:")
  song.sections.forEach(s => {
    console.log(" ", s.name);
    s.verses.forEach((v, vi) => {
      v.lines.forEach((l, li) => {
        console.log("   ", `v${vi}l${li}`, l);
      })
      console.log();
    })
  })
}

function parseSectionLines(lines: string[]): SongVerse[] {
  const verseLines: string[][] = lines.reduce<string[][]>((p, c) => {
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
  return verseLines.map(v => ({ lines: v }));
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

  const sections: SongSection[] = sectionNames.map((x, i) => ({ name: x, verses: parseSectionLines(sectionLines[i]) }));

  // sections.forEach(s => {
  //   console.log(s.name);
  //   s.verses.forEach(v => {
  //     v.lines.forEach((l, i) => console.log(`l${i}`, l));
  //     console.log();
  //   })
  // })
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

  const elementOrder: SongElementIdentifier[] = elementCommandIndexes.map(i => makeSongElementIdentifier(lines[i]));

  // validating no empty section or repeat names
  elementOrder.forEach(sei => {
    if (sei.name === "") {
      throw new Error("Song section or repeat has no name");
    }
  })
  console.log(elementOrder);
  elementOrder.forEach(sei => {
    if (sei.type === "repeat" && !(sections.find(s => s.name === sei.name) ?? false)) {
      throw new Error(`Song repeat with name ${sei.name} has no corresponding defined section`);
    }
  })

  return {
    properties: {
      title: title,
      author: author ?? ""
    },
    sections,
    elementOrder
  }
}

export { parseSong, logSong };
