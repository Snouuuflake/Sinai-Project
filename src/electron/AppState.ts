import { dialog } from "electron";
import * as fs from "fs";

import { DISPLAYS, MAX_RESERVED_MEDIA_ID } from "../shared/constants.js";
import { getConfigPath } from "./pathResolver.js";
import {
  SerializedLiveElement,
  LiveElementIdentifier,
  Media,
  SerializedMediaIdentifier,
  SerializedMediaWithId,
  SerializedMedia,
  MediaSong,
  MediaImage,
  Song,
  // encodeVerseId,
  // decodeVerseId,
} from "../shared/media-classes.js";
import {
  ConfigEntryBase,
  ConfigTypePrimitiveType,
  ConfigTypesKey,
  SerializedDisplayConfigEntry,
  SerializedGeneralConfigEntry
} from "../shared/config-classes.js";

type GeneralConfigEntryCallback = (newValue: unknown) => void;
type DisplayConfigEntryCallback = (newValue: unknown[]) => void;

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
  #setlistMedia: Map<number, Media> = new Map();
  // for generating unique id's for each media loaded
  #mediaIdCounter: number = MAX_RESERVED_MEDIA_ID + 1;
  // id of media being viewed in main UI window controls
  #openMedia: number | null = null;
  // currently selected liveElement in ui
  #selectedLiveElementId: number | null = null;
  // elements being projected
  #liveElements: Array<LiveElementIdentifier | null> = Array.from({ length: DISPLAYS }, (_x) => null);
  // logo on or off for each display
  #logoIsVisible: boolean[] = Array.from({ length: DISPLAYS }, (_x) => false);
  // setSelectedLiveElement(liveElementId: number | null) {
  //   this.#selectedLiveElementId = liveElementId;
  // }
  // incrementOpenLiveElement() {
  //   if (this.#selectedLiveElementId === null || this.#openMedia === null)
  //     return;
  //   const openMedia = this.#setlistMedia.get(this.#openMedia);
  //   if (!openMedia)
  //     return;
  //
  //   if (openMedia instanceof MediaSong) {
  //     const decodedVerseId = decodeVerseId(this.#selectedLiveElementId);
  //     const curSectionMaxVerse = openMedia.value.song.sections[decodedVerseId.section].verses.length - 1;
  //     if (decodedVerseId.verse < curSectionMaxVerse) {
  //       this.setSelectedLiveElement(
  //         encodeVerseId(
  //           decodedVerseId.section,
  //           decodedVerseId.verse + 1,
  //         )
  //       )
  //       return;
  //     }
  //   }
  // }
  // decrementOpenLiveElement() {
  //   if (this.#openLiveElement === null || this.#openMedia === null)
  //     return;
  //
  // }
  constructor() {
  }

  // INFO: configs -------------------------
  readConfigFile() {
    fs.readFile(getConfigPath(), { encoding: "utf8" }, (err, data) => {
      if (err) {
        dialog.showErrorBox("Error", err.message);
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

  #writeConfigTimer: ReturnType<typeof setTimeout> | null = null;

  #scheduleWriteConfig() {
    console.log("AppState.#scheduleWriteConfig()")
    const DELAY = 500; //ms
    if (this.#writeConfigTimer !== null) clearTimeout(this.#writeConfigTimer);
    this.#writeConfigTimer = setTimeout(
      () => {
        this.#writeConfigTimer = null;
        this.writeConfigFile();
      },
      DELAY
    );
  }
  writeConfigFile() {
    console.log("AppState.writeConfigFile()")
    const data = JSON.stringify({
      dc: this.#dc.map(entry => entry.toSerialized()),
      gc: this.#gc.map(entry => entry.toSerialized()),
    });
    fs.writeFile(getConfigPath(), data, { encoding: "utf8" }, (err) => {
      if (err)
        dialog.showErrorBox("Error", err.message);
    });
  }

  //       INFO: dc ------------------------------
  #dc: MainDisplayConfigEntry<ConfigTypesKey>[] = [];
  #dcCallbacks: { id: string, callback: DisplayConfigEntryCallback }[] = [];
  addDcCallback(id: string, callback: DisplayConfigEntryCallback) {
    this.#dcCallbacks.push({ id, callback });
  }
  removeDcCallback(id: string, callback: DisplayConfigEntryCallback) {
    const callbackIndex = this.#dcCallbacks.findIndex(value => value.id === id && value.callback === callback);
    if (callbackIndex === -1)
      return;
    this.#dcCallbacks.splice(callbackIndex, 1);
  }
  #runDcCallbacks(id: string) {
    const dcEntry = this.#dc.find(value => value.id === id)
    if (!dcEntry)
      return;
    const dcEntryValue = dcEntry.cur;
    for (const callback of this.#dcCallbacks) {
      if (callback.id === id)
        callback.callback(dcEntryValue);
    }
  }
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
    this.#runDcCallbacks(entry.id);
  }
  updateDcEntry(id: string, index: number, value: unknown) {
    this.#findAssertDcEntry(id).setCurEntry(index, value);
    this.#scheduleWriteConfig();
    this.#runDcCallbacks(id);
  }
  resetDcEntry(id: string, index: number) {
    this.#findAssertDcEntry(id).reinitEntry(index);
    this.#scheduleWriteConfig();
    this.#runDcCallbacks(id);
  }
  getSerializedDc() {
    return this.#dc.map(x => x.toSerialized());
  }

  //       INFO: gc ------------------------------
  #gc: MainGeneralConfigEntry<ConfigTypesKey>[] = [];
  #gcCallbacks: { id: string, callback: GeneralConfigEntryCallback }[] = [];
  addGcCallback(id: string, callback: GeneralConfigEntryCallback) {
    this.#gcCallbacks.push({ id, callback });
  }
  removeGcCallback(id: string, callback: GeneralConfigEntryCallback) {
    const callbackIndex = this.#gcCallbacks.findIndex(value => value.id === id && value.callback === callback);
    if (callbackIndex === -1)
      return;
    this.#gcCallbacks.splice(callbackIndex, 1);
  }
  #runGcCallbacks(id: string) {
    const gcEntry = this.#gc.find(value => value.id === id)
    if (!gcEntry)
      return;
    const gcEntryValue = gcEntry.cur;
    for (const callback of this.#gcCallbacks) {
      if (callback.id === id)
        callback.callback(gcEntryValue);
    }
  }
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
    this.#runGcCallbacks(entry.id)
  }
  updateGcEntry(id: string, value: unknown) {
    this.#findAssertGcEntry(id).cur = value;
    this.#scheduleWriteConfig();
    this.#runGcCallbacks(id)
  }
  resetGcEntry(id: string) {
    this.#findAssertGcEntry(id).reinitEntry();
    this.#scheduleWriteConfig();
    this.#runGcCallbacks(id)
  }
  getSerializedGc() {
    return this.#gc.map(x => x.toSerialized());
  }

  // INFO: media / setlist

  // returns copy of this.#media
  // TODO: UNUSED - can rename
  get setlistMedia(): Map<number, Media> {
    return new Map(this.#setlistMedia);
  }
  // returns setlist as serializable media identiers (no value) for sending to ui browser window
  getUIStateSetlist(): SerializedMediaIdentifier[] {
    return this.#setlist.map(id => this.#setlistMedia.get(id)!.toSerializedMediaIdentifier(id));
  }
  // returns openMedia as serializable media for sending to ui browser window
  getUIStateOpenMedia(): SerializedMediaWithId | null {
    if (this.#openMedia === null) return null;
    return this.#setlistMedia.get(this.#openMedia)!
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
    return this.#setlistMedia.get(le.id)?.toSerializedLiveElement(le.id, le.element) ?? null;
  }
  /**
    * sets song of media song in media
    * song is maybe the only media that will be edited by the user
    * @throws if id doesn't exist or is not MediaSong
    */
  setSetlistMediaSongMediaSong(id: number, song: Song) {
    const targetMedia = this.#setlistMedia.get(id);
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
    if (!this.#setlistMedia.get(id)) {
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
    if (!this.#setlistMedia.get(liveElementIdentifier.id)) {
      throw new Error("setLiveElements: id not in this.#media");
    }
    this.#liveElements[displayIndex] = liveElementIdentifier;
    // console.log("setLiveElement result", this.#liveElements);
    return;
  }
  getLogo(): readonly boolean[] {
    return this.#logoIsVisible as readonly boolean[];
  }
  getLogoEntry(displayIndex: number): boolean {
    if (displayIndex < 0 || displayIndex >= DISPLAYS) {
      throw new Error("getLogo: index is invalid");
    }
    return this.#logoIsVisible[displayIndex];
  }
  setLogo(displayIndex: number, logoIsVisible: boolean) {
    if (displayIndex < 0 || displayIndex >= DISPLAYS) {
      throw new Error("setLogo: index is invalid");
    }
    this.#logoIsVisible[displayIndex] = logoIsVisible
  }
  /**
   * @param id id of media to be moved 
   * @param index index isnide setlist to put it's id 
   * @throws throws if id not in setlist or media or if invalid index
   */
  moveSetlistEntry(id: number, index: number) {
    if (this.#setlist.indexOf(id) == -1) {
      throw new Error("moveSetlistMedia: id not in this.#setlist")
    }
    if (!this.#setlistMedia.get(id)) {
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
  addSetlistMedia(media: Media) {
    this.#setlistMedia.set(this.#mediaIdCounter, media);
    this.#setlist.push(this.#mediaIdCounter);
    this.#mediaIdCounter++;
  }
  /**
   * @param id id of item to remove 
   * @throws throws if id not in setlist or in media
   */
  deleteSetlistMedia(id: number) {
    if (this.#setlist.indexOf(id) == -1) {
      throw new Error("deleteMedia: id not in this.#setlist")
    }
    if (!this.#setlistMedia.get(id)) {
      throw new Error("deleteMedia: id not in this.#media")
    }
    this.#setlist.splice(this.#setlist.indexOf(id), 1);
    this.#setlistMedia.delete(id);

    if (this.#openMedia === id) {
      this.setOpenMedia(null);
    }
  }

  #extraMedia: Map<string, Media> = new Map();
  get extraMedia(): Map<string, Media> {
    return new Map(this.#extraMedia);
  }
  setExtraMedia(id: string, media: Media) {
    this.#extraMedia.set(id, media);
  }
  getSerializedExtraMedia(id: string): SerializedMedia | null {
    this.#extraMedia.get(id);
    return this.#extraMedia.get(id)?.toSerializedMedia() ?? null;
  }
  getSerializedLogoMedia(): SerializedMedia | null {
    return this.#extraMedia.get("logo-media")?.toSerializedMedia() ?? null;
  }

  /**
   * @throws if id > MAX_RESERVED_MEDIA_ID
   */
  setFixedIdMedia(id: number, media: Media | null): void {
    if (id > MAX_RESERVED_MEDIA_ID)
      throw new Error("AppState.getFixedIdMedia(): id > MAX_RESERVED_MEDIA_ID");
    if (media === null) {
      this.#setlistMedia.delete(id);
      return;
    } else {
      this.#setlistMedia.set(id, media);
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
