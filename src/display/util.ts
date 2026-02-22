function formatSrcPath(path: string) {
  return (path.charAt(0) === "/" ? "" : "/") + path.replaceAll("\\", "/");
}

export {
  formatSrcPath
}
