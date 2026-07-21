import path from "path";
import * as fs from "fs";
import { dialog, ipcMain } from "electron";
import { AppState } from "../AppState.js";
import { WindowManager } from "../WindowManager.js";
import { FILTERS, matchFilter } from "../filters.js";
import { UIUpdaters } from "./UIUpdaters.js";
import { Media, MediaImage, MediaSong, Song } from "../../shared/media-classes.js";
import { logSong, parseSong, stringifySong } from "../parser.js";

export function registerMediaHandlers(
  appState: AppState,
  windowManager: WindowManager
) {
  const uiUpdaters = new UIUpdaters(appState, windowManager);
  ipcMain.on("create-song", (_event, title: string, author: string) => {
    appState.addMedia(new MediaSong(title, {
      properties: {
        title: title,
        author: author,
      },
      sections: [],
      elementOrder: []
    }));
    uiUpdaters.updateUISetlist();
    uiUpdaters.updateUIOpenMedia(); // !!
  })

  ipcMain.on("replace-song", (_event, id: number, song: Song) => {
    try {
      appState.setSongMediaSong(id, song);
    } catch (err) {
      if (err instanceof Error)
        dialog.showErrorBox("Error", `Error replacing song: ${id} ${song.properties.title}\n${err.message}`);
    }
    uiUpdaters.updateUIOpenMedia();
    uiUpdaters.updateUISetlist();
  });

  function writeSong(filePath: string, media: MediaSong) {
    try {
      fs.writeFile(filePath, stringifySong(media.value.song), err => {
        if (err) {
          dialog.showErrorBox("Error", `Error saving song: ${media.name}\n${err.message}`);
        }
      });
    } catch (err) {
      if (err instanceof Error) {
        dialog.showErrorBox("Error", `Error saving song: ${media.name}\n${err.message}`);
      }
    }
  }

  ipcMain.on("save-song", (_event, id: number) => {
    const media = appState.media.get(id);
    if (media?.type !== "song")
      return;

    if (!windowManager.uiWindow) return;

    dialog.showSaveDialog(windowManager.uiWindow, {
      title: "Save song",
      filters: [
        {
          name: "Sinai Project Song",
          extensions: ["sinai"]
        }
      ]
    }).then(result => {
      if (result.canceled)
        return;
      writeSong(result.filePath, media as MediaSong);
    });
  });


  //  INFO: ---------  Setlist Operations ------------

  function readImage(filePath: string): Promise<void | Error> {
    return new Promise<void>(
      (resolve, _reject) => {
        appState.addMedia(
          new MediaImage(filePath.split(path.sep).at(-1) ?? "Image", filePath)
        );
        resolve();
      }
    );
  }

  ipcMain.on("add-images", (_event) => {
    if (!windowManager.uiWindow)
      return;
    dialog.showOpenDialog(windowManager.uiWindow, {
      title: "Add Media Images",
      filters: [
        FILTERS["Images"] as any
      ],
      properties: ["openFile", "multiSelections"]
    }).then(
      result => {
        if (result.canceled) return;
        result.filePaths.forEach(readImage);
        uiUpdaters.updateUISetlist();
      }
    )
  });

  function readSong(filePath: string): Promise<void | Error> {
    return new Promise<void>(
      (resolve, reject) => {
        fs.readFile(filePath, "utf8",
          (err, data) => {
            if (err) {
              console.error(`Error reading song at:\n${filePath}\n${err.message}`);
              reject(new Error(`Error reading song at: ${path.basename(filePath)}`));
            } else {
              try {
                const song = parseSong(data);
                logSong(song);
                appState.addMedia(
                  new MediaSong(
                    song.properties.title, song
                  )
                );
              } catch (e) {
                if (e instanceof Error) {
                  console.error(`Error parsing song at:\n${filePath}\n${e.message}`);
                  reject(new Error(`Error parsing song at: ${path.basename(filePath)}. ${e.message}`));
                }
              }
              resolve();
            }
          }
        );
      }
    )
  }

  ipcMain.on("add-songs", (_event) => {
    if (!windowManager.uiWindow)
      return;
    dialog.showOpenDialog(windowManager.uiWindow, {
      title: "Add Media Songs",
      filters: [
        FILTERS["Songs"] as any
      ],
      properties: ["openFile", "multiSelections"]
    }).then(
      result => {
        if (result.canceled) return;
        Promise.allSettled(
          result.filePaths.map<Promise<void | Error>>(readSong)
        ).then(
          results => {
            const errors = results.filter(
              result => result.status === "rejected"
            );
            if (errors.length > 0)
              dialog.showErrorBox(
                "Error",
                errors.map(result => `${result.reason}`).join("\n")
              );
            uiUpdaters.updateUISetlist();
          }
        );
      }
    )
  });

  ipcMain.on(
    "read-directory",
    (_event) => {
      if (!windowManager.uiWindow)
        return;
      dialog.showOpenDialog(windowManager.uiWindow, {
        title: "Read Folder",
        filters: [],
        properties: ["openDirectory"]
      }).then(
        result => {
          if (result.canceled) return;
          fs.readdir(
            result.filePaths[0],
            async (err, files) => {
              if (err) {
                dialog.showErrorBox("Error", `Error reading folder: ${err.message}`);
                return;
              }
              const filePaths = files.map(file => path.resolve(result.filePaths[0], file)).filter(fp => fs.statSync(fp).isFile()).sort();
              const errors: Error[] = [];

              for (const fp of filePaths) {
                try {
                  if (matchFilter(fp, "Songs")) {
                    await readSong(fp);
                  }
                  else if (matchFilter(fp, "Images")) {
                    await readImage(fp);
                  }
                } catch (err) {
                  if (err instanceof Error)
                    errors.push(err);
                }
              }

              if (errors.length > 0)
                dialog.showErrorBox("Error", "Errores leyendo setlist: \n" + errors.map(err => err.message).join("\n"));

              uiUpdaters.updateUISetlist();
            }
          );
        }
      )
    }
  );



  ipcMain.on(
    "write-setlist",
    (_event) => {
      if (!windowManager.uiWindow)
        return;
      dialog.showSaveDialog(windowManager.uiWindow, {
        title: "Guardar Setlist",
        buttonLabel: "Guardar",
        filters: [],
        properties: ["createDirectory"]
      }).then(
        async result => {
          if (result.canceled) return;

          try {
            fs.mkdirSync(result.filePath, { recursive: true })
          } catch (err) {
            if (err instanceof Error)
              dialog.showErrorBox("Error", "Error writing setlist" + " " + err.message);
            return;
          }

          const errors: Error[] = [];
          const setlistLengthDigits = Math.ceil(Math.log10(appState.getUIStateSetlist().length + 1));
          const setlistDebugName = result.filePath.slice(-30);
          appState.getUIStateSetlist().forEach(
            (smi, i) => {
              const filePrefix = "sp_" + (i).toString().padStart(
                setlistLengthDigits, "0"
              ) + "_"

              try {
                let media: Media | undefined = undefined;
                switch (smi.type) {
                  case "song":
                    media = appState.media.get(smi.id);
                    if (media instanceof MediaSong) {
                      const fileName = path.join(result.filePath, filePrefix + media.name + ".sinai",)
                      writeSong(
                        fileName,
                        media
                      );
                      console.log(`wrote song ${fileName} to setlist ${setlistDebugName}`);
                    } else {
                      throw new Error(`Somehow was unable to get() smi: ${smi} from  appState.media`);
                    }
                    break;
                  case "image":
                    media = appState.media.get(smi.id);
                    if (media instanceof MediaImage) {
                      const basename = path.basename(media.value.path);
                      const replacedName = basename.replace(/^sp_\d+_/, "");
                      console.log(basename, replacedName);
                      const fileName = filePrefix + replacedName;

                      fs.copyFile(
                        media.value.path,
                        path.join(
                          result.filePath,
                          fileName,
                        ),
                        fs.constants.COPYFILE_FICLONE,
                        (err) => {
                          if (err) {
                            dialog.showErrorBox(
                              "Error",
                              ` Error copying image ${(media as MediaImage).value.path.slice(-30)} to setlist ${setlistDebugName}: \n${err.message}`
                            );
                          } else {
                            console.log(`wrote image ${fileName} to setlist ${setlistDebugName}`);
                          }
                        },
                      );
                    } else {
                      throw new Error(`Somehow was unable to get() smi: ${smi} from  appState.media`);
                    }
                    break;
                  default:
                    break;
                }
              } catch (err) {
                if (err instanceof Error) {
                  errors.push(new Error(`Error writing setlist item: ${err.message}`));
                }
              }
            }
          );
          if (errors.length > 0)
            dialog.showErrorBox("Error", errors.join("\n"));
        }
      );
    }
  )

  ipcMain.on("move-media", (_event, id: number, index: number) => {
    try {
      appState.moveSetlistMedia(id, index);
      uiUpdaters.updateUISetlist();
    } catch (e) {
      if (e instanceof Error) dialog.showErrorBox("Error", e.message);
    }
  })

  ipcMain.on("delete-media", (_event, id: number) => {
    let mediaToDelete = appState.media.get(id);
    if (mediaToDelete === undefined)
      throw new Error("delete-media: media id doesn't exist");

    if (!windowManager.uiWindow) return;

    dialog.showMessageBox(windowManager.uiWindow, {
      message: `¿Está seguro que desea eliminar ${mediaToDelete.name}?\n\n Esta acción es irreversible.`,
      buttons: ["Ok", "Cancel"],
      defaultId: 1,
      cancelId: 1,
    }).then(value => {
      if (value.response === 0) {
        try {
          appState.deleteMedia(id);
          uiUpdaters.updateUISetlist();
          uiUpdaters.updateUIOpenMedia(); // !!
        } catch (e) {
          if (e instanceof Error) dialog.showErrorBox("Error", e.message);
        }
      }
    })
  });
}
