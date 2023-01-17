import {
  EndpointContext,
  PriceEndpoint,
  PriceEndpointParams,
  priceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult, makeLogger } from '@chainlink/external-adapter-framework/util'

import { customSettings } from '../config'

// Schema of message sent to TwoSigma to start streaming symbols
export type WebSocketRequest = {
  api_key: string
  symbols: string[] // e.g. ["AAPL/USD"]
}

export type SymbolPriceData = {
  quote_currency: string // e.g. USD
  session_status_flag: 'premarket' | 'open' | 'postmarket' | 'closed'
  asset_status_flag: string // e.g. active
  confidence_interval: number // e.g. 0.16416514635149188
  price: number // e.g. 379.64
}

// Schema of message sent from TwoSigma containing symbol prices
export type WebSocketMessage = {
  timestamp: number // e.g. 1666705053.713266
  symbol_price_dict: Record<
    string, // e.g. AAPL/USD
    SymbolPriceData
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
    Data: SymbolPriceData
    Result: number
  }
  CustomSettings: typeof customSettings
}

export type WebSocketEndpointTypes = EndpointTypes & {
  Provider: {
    WsMessage: WebSocketMessage
  }
}

const logger = makeLogger('TwoSigmaPriceWebsocketEndpoint')

export class WebSocketHandler {
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

  message(message: WebSocketMessage): ProviderResult<WebSocketEndpointTypes>[] | undefined {
    if (!message.timestamp || !message.symbol_price_dict) {
      return undefined
    }

    const results: ProviderResult<WebSocketEndpointTypes>[] = []
    for (const symbol in message.symbol_price_dict) {
      const priceData = message.symbol_price_dict[symbol]
      const params = parseBaseQuote(symbol)
      if (params === undefined) {
        continue
      }

      results.push({
        params,
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
    logger.trace(`subscribing to ${symbol}, subscribed set is ${this.subscribedSymbols}`)
    return this.buildRequest()
  }

  unsubscribeMessage(params: PriceEndpointParams): WebSocketRequest {
    const symbol = buildSymbol(params)
    this.subscribedSymbols.delete(symbol)
    logger.trace(`unsubscribing from ${symbol}, subscribed set is ${this.subscribedSymbols}`)
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
    url: handler.url.bind(handler),
    handlers: {
      message: handler.message.bind(handler),
    },
    builders: {
      subscribeMessage: handler.subscribeMessage.bind(handler),
      unsubscribeMessage: handler.unsubscribeMessage.bind(handler),
    },
  })
}

export const parseBaseQuote = (symbol: string): PriceEndpointParams | undefined => {
  // "AAPL/USD" -> { base: AAPL, quote: USD }
  const splits = symbol.split('/')
  if (splits.length !== 2) {
    return
  }
  const [base, quote] = splits
  return { base, quote }
}

export const buildSymbol = ({ base, quote }: PriceEndpointParams): string => {
  return `${base}/${quote}`
}

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'price',
  transport: makeWebSocketTransport(),
  inputParameters: priceEndpointInputParameters,
})
