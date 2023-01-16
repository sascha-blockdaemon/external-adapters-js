import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { priceEndpoint } from './endpoint'

export const adapter = new PriceAdapter({
  name: 'TWOSIGMA',
  endpoints: [priceEndpoint],
  defaultEndpoint: priceEndpoint.name,
  customSettings,
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
