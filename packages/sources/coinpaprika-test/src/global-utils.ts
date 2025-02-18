import { customSettings, getApiEndpoint, getApiHeaders } from './config'
import { makeLogger } from '@chainlink/external-adapter-framework/util/logger'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

const logger = makeLogger('CoinPaprika Global Batched')

export const inputParameters: InputParameters = {
  market: {
    aliases: ['to', 'quote'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
}

export interface GlobalRequestParams {
  market: string
}

export interface GlobalResponseBody {
  market_cap_usd: number
  volume_24h_usd: number
  bitcoin_dominance_percentage: number
  cryptocurrencies_number: number
  market_cap_ath_value: number
  market_cap_ath_date: string
  volume_24h_ath_value: number
  volume_24h_ath_date: string
  market_cap_change_24h: number
  volume_24h_change_24h: number
  last_updated: number
}

export type GlobalEndpointTypes = {
  Request: {
    Params: GlobalRequestParams
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    RequestBody: never
    ResponseBody: GlobalResponseBody
  }
}

export const buildGlobalRequestBody = (
  params: GlobalRequestParams[],
  config: AdapterConfig<typeof customSettings>,
) => {
  return {
    params,
    request: {
      baseURL: getApiEndpoint(config),
      url: '/v1/global',
      method: 'GET',
      headers: getApiHeaders(config),
    },
  }
}

export const constructEntry = (
  res: GlobalResponseBody,
  requestPayload: GlobalRequestParams,
  resultPath: '_dominance_percentage' | 'market_cap_',
) => {
  if (!res) {
    logger.warn(`Data not found`)
    return
  }

  const marketMap: { [key: string]: string } = {
    BTC: 'bitcoin',
  }

  const propertyPath =
    resultPath === '_dominance_percentage'
      ? `${marketMap[requestPayload.market.toUpperCase()]}${resultPath}`
      : `${resultPath}${requestPayload.market.toLowerCase()}`

  const result = Number(res[propertyPath as keyof GlobalResponseBody])

  if (!result) {
    return {
      params: requestPayload,
      response: {
        errorMessage: `Data for "${requestPayload.market}" is not found`,
        statusCode: 400,
      },
    }
  }

  return {
    params: requestPayload,
    response: {
      data: {
        result,
      },
      result,
    },
  }
}
