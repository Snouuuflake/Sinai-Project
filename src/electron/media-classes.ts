import { decodeVerseId, LiveElementB64PNGValue, LiveElementImageValue, LiveElementTextValue, MediaImageValueType, MediaPDFValueType, MediaSongValueType, MediaTypeType, SerializedLiveElement, SerializedMedia, SerializedMediaIdentifier, SerializedMediaWithId, Song } from "../shared/media-types.js";

import * as mupdf from "mupdf"
import * as fs from "fs"

export abstract class Media {
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
  toSerializedMedia(): SerializedMedia {
    return {
      name: this.name,
      type: this.type,
      value: this.value,
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

export class MediaPDF extends Media {
  type = "pdf" as const;
  value: MediaPDFValueType;
  constructor(name: string, path: string) {
    super(name);
    const document = mupdf.PDFDocument.openDocument(fs.readFileSync(path), "application/pdf");

    const pages = Array.from({ length: document.countPages() }, (_v, i) => {
      let page = document.loadPage(0)
      let pixmap = page.toPixmap(mupdf.Matrix.identity, mupdf.ColorSpace.DeviceRGB, false, true)
      let pngImage = pixmap.asPNG()
      return Buffer.from(pngImage, 'binary').toString('base64')
    })

    this.value = {
      path: path,
      b64pages: pages
    }
  }
  toSerializedLiveElement(id: number, element: number): SerializedLiveElement {
    return {
      id,
      element,
      type: "b64png",
      value: {
        image: element < this.value.b64pages.length ?
          this.value.b64pages[element] : ""
      } as LiveElementB64PNGValue,
    };
  }
}

export class MediaImage extends Media {
  type = "image" as const;
  value: MediaImageValueType;
  constructor(name: string, path: string) {
    super(name);
    this.value = {
      path
    };
  }
  toSerializedLiveElement(id: number, element: number): SerializedLiveElement {
    return {
      id,
      element,
      type: "image",
      value: {
        id
      } as LiveElementImageValue,
    };
  }
}

export class MediaSong extends Media {
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
          .find(s => s.id === this.value.song.elementOrder[decodedElement.section])?.
          verses.find(v => v.id === decodedElement.verse)?.
          lines
          ?? []
      } as LiveElementTextValue
    }
  }
}
