import * as fs from "fs";

import { DISPLAYS } from "../shared/constants.js";
import { getConfigPath } from "./pathResolver.js";
import { alertMessageBox } from "./main.js";
import {
  SerializedLiveElement,
  LiveElementIdentifier,
  Media,
  SerializedMediaIdentifier,
  SerializedMediaWithId,
  MediaSong,
  Song,
} from "../shared/media-classes.js";
import {
  ConfigEntryBase,
  ConfigTypePrimitiveType,
  ConfigTypesKey,
  SerializedDisplayConfigEntry,
  SerializedGeneralConfigEntry
} from "../shared/config-classes.js";


class MainDisplayConfigEntry<T extends ConfigTypesKey> extends ConfigEntryBase<T> {
  #init: ConfigTypePrimitiveType<T>;
  #cur: ConfigTypePrimitiveType<T>[];
  constructor(id: string, type: T, init: ConfigTypePrimitiveType<T>) {
    super(id, type);
    this.assertType(init);
    this.#init = init;
    this.#cur = Array.from({ length: DISPLAYS }, () => this.#init);
  }
  get cur(): ConfigTypePrimitiveType<T>[] {
    return [...this.#cur];
  }
  setCurEntry(displayId: number, value: unknown) {
    this.assertType(value);
    if (displayId >= DISPLAYS)
      throw new Error(`MainConfigEntry.setCurEntry "${this.id}" > no. of displays`);
    this.#cur[displayId] = value;
  }
  reinitEntry(index: number) {
    if (index >= DISPLAYS)
      throw new Error(`MainConfigEntry.reinitEntry "${this.id}" > no. of displays`);
    this.#cur[index] = this.#init;
  }
  toSerialized(): SerializedDisplayConfigEntry {
    return {
      id: this.id,
      type: this.type,
      cur: this.#cur,
      isInit: this.#cur.map(x => x === this.#init)
    }
  }
}

class MainGeneralConfigEntry<T extends ConfigTypesKey> extends ConfigEntryBase<T> {
  #init: ConfigTypePrimitiveType<T>;
  #cur: ConfigTypePrimitiveType<T>;
  constructor(id: string, type: T, init: ConfigTypePrimitiveType<T>) {
    super(id, type);
    this.assertType(init);
    this.#init = init;
    this.#cur = this.#init;
  }
  get cur(): ConfigTypePrimitiveType<T> {
    return this.#cur;
  }
  set cur(value: unknown) {
    this.assertType(value);
    this.#cur = value;
  }
  reinitEntry() {
    this.#cur = this.#init;
  }
  toSerialized(): SerializedGeneralConfigEntry {
    return {
      id: this.id,
      type: this.type,
      cur: this.#cur,
      isInit: this.#cur === this.#init,
    }
  }
}

/**
 * Class that stores all of the state for the app.
 * Stores things like open files (media), the
 * order the user has them in (setlist), what
 * media's controls are being shown (openMedia),
 * what is being projected (liveElements), etc.
 * Has methods for updating this data safely (not
 * updating when invalid data is sent). Does not
 * send IPC state update messages (so as to not
 * have to define this class after the main window
 * is created or have it reference a global
 * variable).
 */
class AppState {
  // order (by id) of media in the UIWindow setlist
  #setlist: number[] = [];
  // set of all media (files, songs, images, etc) loaded by the user
  #media: Map<number, Media> = new Map();
  // for generating unique id's for each media loaded
  #mediaIdCounter: number = 0;
  // id of media being viewed in main UI window controls
  #openMedia: number | null = null;
  // elements being projected
  #liveElements: Array<LiveElementIdentifier | null> = Array.from({ length: DISPLAYS }, (_x) => null);
  // logo on or off for each display
  #logo: boolean[] = Array.from({ length: DISPLAYS }, (_x) => false);
  constructor() {
  }
  // INFO: configs -------------------------
  readConfigFile() {
    fs.readFile(getConfigPath(), { encoding: "utf8" }, (err, data) => {
      if (err) {
        alertMessageBox(err.message);
        return;
      }
      const { dc, gc }: { dc: SerializedDisplayConfigEntry[], gc: SerializedGeneralConfigEntry[] } = JSON.parse(data);
      // console.log(dc, gc);
      dc.forEach(entry => {
        entry.cur.forEach((cur, i) => {
          if (i < DISPLAYS) {
            this.updateDcEntry(entry.id, i, cur);
          }
        });
      });
      gc.forEach(entry => this.updateGcEntry(entry.id, entry.cur));
    });
  }
  writeConfigFile() {
    const data = JSON.stringify({
      dc: this.#dc.map(entry => entry.toSerialized()),
      gc: this.#gc.map(entry => entry.toSerialized()),
    });
    fs.writeFile(getConfigPath(), data, { encoding: "utf8" }, (err) => {
      if (err) {
        alertMessageBox(err.message);
      }
    });
  }
  //       INFO: dc ------------------------------
  #dc: MainDisplayConfigEntry<ConfigTypesKey>[] = [];
  #findAssertDcEntry(id: string) {
    const findRes = this.#dc.find(x => x.id === id);
    if (!findRes)
      throw new Error(`dc entry id ${id} doesn't exist`);
    return findRes;
  }
  addDcEntry(entry: MainDisplayConfigEntry<ConfigTypesKey>) {
    const findRes = this.#dc.find(x => x.id === entry.id);
    if (findRes)
      throw new Error("dc entry id already exists");
    this.#dc.push(entry);
  }
  updateDcEntry(id: string, index: number, value: unknown) {
    this.#findAssertDcEntry(id).setCurEntry(index, value);
    this.writeConfigFile();
  }
  resetDcEntry(id: string, index: number) {
    this.#findAssertDcEntry(id).reinitEntry(index);
    this.writeConfigFile();
  }
  getSerializedDc() {
    return this.#dc.map(x => x.toSerialized());
  }
  //       INFO: gc ------------------------------
  #gc: MainGeneralConfigEntry<ConfigTypesKey>[] = [];
  #findAssertGcEntry(id: string) {
    const findRes = this.#gc.find(x => x.id === id);
    if (!findRes)
      throw new Error(`gc entry id ${id} doesn't exist`);
    return findRes;
  }
  addGcEntry(entry: MainGeneralConfigEntry<ConfigTypesKey>) {
    const findRes = this.#gc.find(x => x.id === entry.id);
    if (findRes)
      throw new Error("addgcEntry: id already exists");
    this.#gc.push(entry);
  }
  updateGcEntry(id: string, value: unknown) {
    this.#findAssertGcEntry(id).cur = value;
    this.writeConfigFile();
  }
  resetGcEntry(id: string) {
    this.#findAssertGcEntry(id).reinitEntry();
    this.writeConfigFile();
  }
  getSerializedGc() {
    return this.#gc.map(x => x.toSerialized());
  }
  // returns copy of this.#media
  get media(): Map<number, Media> {
    return new Map(this.#media);
  }
  // returns setlist as serializable media identiers (no value) for sending to ui browser window
  getUIStateSetlist(): SerializedMediaIdentifier[] {
    return this.#setlist.map(id => this.#media.get(id)!.toSerializedMediaIdentifier(id));
  }
  // returns openMedia as serializable media for sending to ui browser window
  getUIStateOpenMedia(): SerializedMediaWithId | null {
    if (this.#openMedia === null) return null;
    return this.#media.get(this.#openMedia)!
      .toSerializedMediaWithId(this.#openMedia);
  }
  // returns copy of live elements (already serializable)
  getUIStateLiveElements(): Array<LiveElementIdentifier | null> {
    return [...this.#liveElements];
  }
  // returns liveElements as serializable live elements for projection in display windows
  // handles undefined array item by just sending null (which is valid, means project nothing)
  getDisplayStateLiveElement(displayId: number): SerializedLiveElement | null {
    const le = this.#liveElements[displayId] ?? null;
    if (le === null) return null;
    return this.#media.get(le.id)?.toSerializedLiveElement(le.id, le.element) ?? null;
  }
  /**
    * sets song of media song in media
    * song is maybe the only media that will be edited by the user
    * @throws if id doesn't exist or is not MediaSong
    */
  setSongMediaSong(id: number, song: Song) {
    const targetMedia = this.#media.get(id);
    if (targetMedia === undefined) {
      throw new Error("setSongMediaSong: invalid id")
    }
    if (!(targetMedia instanceof MediaSong)) {
      throw new Error("setSongMediaSong: targetMedia not instance of MediaSong")
    }
    targetMedia.value.song = song;
    targetMedia.name = song.properties.title;
  }
  /**
   * sets openMedia
   * @throws if id not in media
   */
  setOpenMedia(id: number | null) {
    if (id == null) {
      this.#openMedia = null;
      return;
    }
    if (!this.#media.get(id)) {
      throw new Error("setOpenMedia: id not in this.media")
    }
    this.#openMedia = id;
  }
  /**
   * @param displayIndex display window index to set 
   * @param id media id of new live media
   * @throws if invalid display index or live element id invalid
   */
  setLiveElement(displayIndex: number, liveElementIdentifier: LiveElementIdentifier | null) {
    if (displayIndex < 0 || displayIndex >= DISPLAYS) {
      throw new Error("setLiveElements: index is invalid");
    }
    if (liveElementIdentifier === null) {
      this.#liveElements[displayIndex] = null;
      return;
    }
    if (!this.#media.get(liveElementIdentifier.id)) {
      throw new Error("setLiveElements: id not in this.#media");
    }
    this.#liveElements[displayIndex] = liveElementIdentifier;
    // console.log("setLiveElement result", this.#liveElements);
    return;
  }
  getLogo(): readonly boolean[] {
    return this.#logo as readonly boolean[];
  }
  getLogoEntry(displayIndex: number): boolean {
    if (displayIndex < 0 || displayIndex >= DISPLAYS) {
      throw new Error("getLogo: index is invalid");
    }
    return this.#logo[displayIndex];
  }
  setLogo(displayIndex: number, logoIsVisible: boolean) {
    if (displayIndex < 0 || displayIndex >= DISPLAYS) {
      throw new Error("setLogo: index is invalid");
    }
    this.#logo[displayIndex] = logoIsVisible
  }
  /**
   * @param id id of media to be moved 
   * @param index index isnide setlist to put it's id 
   * @throws throws if id not in setlist or media or if invalid index
   */
  moveSetlistMedia(id: number, index: number) {
    if (this.#setlist.indexOf(id) == -1) {
      throw new Error("moveSetlistMedia: id not in this.#setlist")
    }
    if (!this.#media.get(id)) {
      throw new Error("moveSetlistMedia: id not in this.#media")
    }
    if (index >= this.#setlist.length) {
      throw new Error(
        "moveSetlistMEdia: index is greater than this.#setlist.length"
      );
    }

    const itemSetlistIndex = this.#setlist.indexOf(id);

    this.#setlist.splice(itemSetlistIndex, 1);
    this.#setlist.splice(index, 0, id);
  }
  addMedia(media: Media) {
    this.#media.set(this.#mediaIdCounter, media);
    this.#setlist.push(this.#mediaIdCounter);
    this.#mediaIdCounter++;
  }
  /**
   * @param id id of item to remove 
   * @throws throws if id not in setlist or in media
   */
  deleteMedia(id: number) {
    if (this.#setlist.indexOf(id) == -1) {
      throw new Error("deleteMedia: id not in this.#setlist")
    }
    if (!this.#media.get(id)) {
      throw new Error("deleteMedia: id not in this.#media")
    }
    this.#setlist.splice(this.#setlist.indexOf(id), 1);
    this.#media.delete(id);

    if (this.#openMedia === id) {
      this.setOpenMedia(null);
    }
  }
  #port: number | null = null;
  setPort(port: number | null) {
    this.#port = port
  }
  getPort() {
    return this.#port;
  }
}

export { AppState, MainDisplayConfigEntry, MainGeneralConfigEntry };
