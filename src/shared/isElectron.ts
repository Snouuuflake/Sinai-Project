function isElectron(): boolean {
  return typeof window !== "undefined" && !!(window as any).electron;
}

export {
  isElectron
}
