const ALLOWED_DISPLAY_SEND_CHANNELS: string[] = [
  "alert",
  "ui-display-config-request"
] as const;

const ALLOWED_DISPLAY_INVOKE_CHANNELS: string[] = [
  "invoke-display-get-init-live-state"
] as const;


export {
  ALLOWED_DISPLAY_INVOKE_CHANNELS,
  ALLOWED_DISPLAY_SEND_CHANNELS
}
