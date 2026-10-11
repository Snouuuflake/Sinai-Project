const ALLOWED_DISPLAY_SEND_CHANNELS: string[] = [
  "alert",

  "ui-state-request",
  "ui-general-config-request",
  "ui-display-config-request",

  "set-open-media",
  "set-live-element",
  "set-logo",
  "ui-port-request",
]

const ALLOWED_DISPLAY_INVOKE_CHANNELS: string[] = [
  "invoke-display-get-init-live-state"
] as const;


export {
  ALLOWED_DISPLAY_INVOKE_CHANNELS,
  ALLOWED_DISPLAY_SEND_CHANNELS
}
