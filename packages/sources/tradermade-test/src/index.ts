import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from './config'
import includes from './config/includes.json'
import overrides from './config/overrides.json'
import { forex, live } from './endpoint'

export const adapter = new PriceAdapter({
  defaultEndpoint: forex.name,
  name: 'TRADERMADE',
  customSettings,
  endpoints: [forex, live],
  includes,
  overrides: overrides.tradermade,
  rateLimiting: {
    tiers: {
      basic: {
        rateLimit1h: 1.369,
      },
      professional: {
        rateLimit1h: 13.69,
      },
      business: {
        rateLimit1h: 68.49,
      },
      advanced: {
        rateLimit1h: 342.46,
      },
      enterprise: {
        rateLimit1h: 833.33,
      },
      'enterprise-xl': {
        rateLimit1h: 1736.11,
      },
    },
  },
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
