import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import { priceEndpoint } from './endpoint'

export const adapterFactory = (): PriceAdapter<typeof customSettings> => {
  return new PriceAdapter({
    name: 'TWOSIGMA',
    endpoints: [priceEndpoint],
    defaultEndpoint: priceEndpoint.name,
    customSettings,
  })
}

export const adapter = adapterFactory()

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
