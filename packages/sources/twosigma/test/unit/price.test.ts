import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import * as price from '../../src/endpoint/price'

describe('WebSocketHandler', () => {
  let handler: price.WebSocketHandler

  beforeEach(() => {
    handler = new price.WebSocketHandler()
  })

  describe('url', () => {
    const context = {
      adapterConfig: {
        WS_API_ENDPOINT: 'wss://chainlink.twosigma.com',
        WS_API_KEY: 'abc',
      },
      endpointName: 'price',
      inputParameters: {},
    } as EndpointContext<price.WebSocketEndpointTypes>

    it('returns the endpoint URL from the config', () => {
      expect(handler.url(context)).toEqual(context.adapterConfig.WS_API_ENDPOINT)
    })

    it('sets the api key', () => {
      expect(handler.apiKey).toEqual('')
      handler.url(context)
      expect(handler.apiKey).toEqual(context.adapterConfig.WS_API_KEY)
    })
  })

  describe('message', () => {
    it('returns empty undefined for invalid messages', () => {
      expect(handler.message({} as price.WebSocketMessage)).toEqual(undefined)
      expect(handler.message({ timestamp: 1672491600 } as price.WebSocketMessage)).toEqual(
        undefined,
      )
      expect(handler.message({ symbol_price_dict: {} } as price.WebSocketMessage)).toEqual(
        undefined,
      )
    })

    it('returns a result for each symbol', () => {
      const message = {
        timestamp: 1672491600,
        symbol_price_dict: {
          'AAPL/USD': {
            quote_currency: 'USD',
            session_status_flag: 'open' as const,
            asset_status_flag: 'active',
            confidence_interval: 0.5,
            price: 100,
          },
          'AMZN/USD': {
            quote_currency: 'USD',
            session_status_flag: 'open' as const,
            asset_status_flag: 'active',
            confidence_interval: 0.6,
            price: 200,
          },
        },
      }

      expect(handler.message(message)).toEqual([
        {
          params: {
            base: 'AAPL',
            quote: 'USD',
          },
          response: {
            result: 100,
            data: {
              quote_currency: 'USD',
              session_status_flag: 'open' as const,
              asset_status_flag: 'active',
              confidence_interval: 0.5,
              price: 100,
            },
            timestamps: {
              providerIndicatedTime: 1672491600,
            },
          },
        },
        {
          params: {
            base: 'AMZN',
            quote: 'USD',
          },
          response: {
            result: 200,
            data: {
              quote_currency: 'USD',
              session_status_flag: 'open' as const,
              asset_status_flag: 'active',
              confidence_interval: 0.6,
              price: 200,
            },
            timestamps: {
              providerIndicatedTime: 1672491600,
            },
          },
        },
      ])
    })
  })

  describe('subscribe & unsubscribe', () => {
    const expectModifySubscription = (
      op: 'subscribe' | 'unsubscribe',
      base: string,
      subscribed: string[],
    ) => {
      const func = op === 'subscribe' ? handler.subscribeMessage : handler.unsubscribeMessage
      const req = func.bind(handler)({ base, quote: 'USD' })
      expect(req).toEqual({
        api_key: '',
        symbols: subscribed.map((base) => `${base}/USD`),
      })
    }

    it('subscribe works', () => {
      const req = handler.subscribeMessage({ base: 'A', quote: 'USD' })
      expect(req).toEqual({
        api_key: '',
        symbols: ['A/USD'],
      })
    })

    it('unsubscribe works', () => {
      handler.subscribeMessage({ base: 'A', quote: 'USD' })
      const req = handler.unsubscribeMessage({ base: 'A', quote: 'USD' })
      expect(req).toEqual({
        api_key: '',
        symbols: [],
      })
    })

    it('unsubscribe works with unsubscribed symbols', () => {
      const req = handler.unsubscribeMessage({ base: 'Z', quote: 'USD' })
      expect(req).toEqual({
        api_key: '',
        symbols: [],
      })
    })

    it('works with a chain of operations', () => {
      expectModifySubscription('subscribe', 'A', ['A'])
      expectModifySubscription('subscribe', 'B', ['A', 'B'])
      expectModifySubscription('subscribe', 'C', ['A', 'B', 'C'])

      expectModifySubscription('unsubscribe', 'A', ['B', 'C'])
      expectModifySubscription('unsubscribe', 'B', ['C'])
      expectModifySubscription('unsubscribe', 'C', [])

      expectModifySubscription('subscribe', 'A', ['A'])
      expectModifySubscription('subscribe', 'D', ['A', 'D'])

      expectModifySubscription('unsubscribe', 'D', ['A'])
      expectModifySubscription('unsubscribe', 'A', [])
    })
  })
})

describe('parseBaseQuote', () => {
  const symbol = 'AAPL/USD'
  const params = {
    base: 'AAPL',
    quote: 'USD',
  }

  it('parses the symbol', () => {
    expect(price.parseBaseQuote(symbol)).toEqual(params)
  })

  it('returns null for invalid symbols', () => {
    expect(price.parseBaseQuote('')).toEqual(null)
    expect(price.parseBaseQuote('AAPL')).toEqual(null)
    expect(price.parseBaseQuote('AAPL//USD')).toEqual(null)
    expect(price.parseBaseQuote('AAPL/USD/USD')).toEqual(null)
  })
})

describe('buildSymbol', () => {
  const symbol = 'AAPL/USD'
  const params = {
    base: 'AAPL',
    quote: 'USD',
  }

  it('builds the symbol ticker', () => {
    expect(price.buildSymbol(params)).toEqual(symbol)
  })
})
