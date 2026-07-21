export const FILTERS = {
  "Images": {
    name: "Images",
    extensions: [
      "apng", "gif", "ico", "cur", "jpg", "jpeg", "jfif", "pjpeg", "pjp", "png", "svg",
    ]
  },
  "Songs": {
    name: "Songs",
    extensions: [
      "sinai", "txt", "mss"
    ]
  }
} as const;

export function matchFilter(str: string, filter: keyof typeof FILTERS): boolean {
  const regexp = new RegExp("\." + (FILTERS[filter].extensions.join("|")) + "$");
  return !!str.match(regexp);
}
