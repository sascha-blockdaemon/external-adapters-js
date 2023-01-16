import {
  EndpointContext,
  PriceEndpoint,
  PriceEndpointParams,
  priceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { EmptyObject, ProviderResult, makeLogger } from '@chainlink/external-adapter-framework/util'

import { customSettings } from '../config'

// Schema of message sent to TwoSigma to start streaming symbols
type WebSocketRequest = {
  api_key: string
  symbols: string[] // e.g. ["AAPL/USD"]
}

// Schema of message sent from TwoSigma containing symbol prices
type WebSocketMessage = {
  timestamp: number // e.g. 1666705053.713266
  symbol_price_dict: Record<
    string, // e.g. AAPL/USD
    {
      quote_currency: string // e.g. USD
      session_status_flag: 'premarket' | 'open' | 'postmarket' | 'closed'
      asset_status_flag: string // e.g. active
      confidence_interval: number // e.g. 0.16416514635149188
      price: number // e.g. 379.64
    }
  >
}

type EndpointTypes = {
  Request: {
    // i.e. { base, quote }
    // base is the symbol to query, e.g. AAPL
    // quote is the currency to conver to, e.g. USD
    Params: PriceEndpointParams
  }
  Response: {
    Data: EmptyObject
    Result: number
  }
  CustomSettings: typeof customSettings
}

type WebSocketEndpointTypes = EndpointTypes & {
  Provider: {
    WsMessage: WebSocketMessage
  }
}

const logger = makeLogger('TwoSigmaEquityWebsocketEndpoint')

class WebSocketHandler {
  apiKey: string
  subscribedSymbols: Set<string>

  constructor() {
    this.apiKey = ''
    this.subscribedSymbols = new Set()
  }

  url({
    adapterConfig: { WS_API_ENDPOINT, WS_API_KEY },
  }: EndpointContext<WebSocketEndpointTypes>): string {
    this.apiKey = WS_API_KEY
    return WS_API_ENDPOINT
  }

  message(message: WebSocketMessage): ProviderResult<WebSocketEndpointTypes>[] {
    logger.trace(message, 'received message from websocket')

    const results: ProviderResult<WebSocketEndpointTypes>[] = []
    for (const symbol in message.symbol_price_dict) {
      const priceData = message.symbol_price_dict[symbol]
      const { base, quote } = parseBaseQuote(symbol)
      results.push({
        params: { base, quote },
        response: {
          result: priceData.price,
          data: priceData,
          timestamps: {
            providerIndicatedTime: message.timestamp,
          },
        },
      })
    }

    return results
  }

  subscribeMessage(params: PriceEndpointParams): WebSocketRequest {
    const symbol = buildSymbol(params)
    this.subscribedSymbols.add(symbol)
    return this.buildRequest()
  }

  unsubscribeMessage(params: PriceEndpointParams): WebSocketRequest {
    const symbol = buildSymbol(params)
    this.subscribedSymbols.delete(symbol)
    return this.buildRequest()
  }

  buildRequest(): WebSocketRequest {
    return {
      api_key: this.apiKey,
      symbols: Array.from(this.subscribedSymbols).sort(),
    }
  }
}

const makeWebSocketTransport = (): WebSocketTransport<WebSocketEndpointTypes> => {
  const handler = new WebSocketHandler()
  return new WebSocketTransport({
    url: handler.url,
    handlers: {
      message: handler.message,
    },
    builders: {
      subscribeMessage: handler.subscribeMessage,
      unsubscribeMessage: handler.unsubscribeMessage,
    },
  })
}

const parseBaseQuote = (symbol: string): PriceEndpointParams => {
  // "AAPL/USD" -> { base: AAPL, quote: USD }
  const splits = symbol.split('/')
  if (splits.length !== 2) {
    // TODO throw error
  }
  const [base, quote] = splits
  return { base, quote }
}

const buildSymbol = ({ base, quote }: PriceEndpointParams): string => {
  return `${base}/${quote}`
}

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'price',
  transport: makeWebSocketTransport(),
  inputParameters: priceEndpointInputParameters,
})
