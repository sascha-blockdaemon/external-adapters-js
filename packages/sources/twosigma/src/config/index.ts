export const customSettings = {
  WS_API_ENDPOINT: {
    description: 'The default WebSocket API base url',
    type: 'string',
    required: true,
    default: 'wss://chainlinkcloud1.twosigma.com:8765',
  },
  WS_API_KEY: {
    description: 'The API key used to authenticate requests',
    type: 'string',
    required: true,
    sensitive: true,
  },
} as const
