import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'TWOSIGMA'

export const DEFAULT_ENDPOINT = 'equity'
// export const DEFAULT_BASE_URL = 'http://localhost:18081'
export const DEFAULT_WS_API_ENDPOINT = 'wss://chainlinkcloud1.twosigma.com:8765'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  // config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
