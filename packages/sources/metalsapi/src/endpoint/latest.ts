import { Requester, Validator, CacheKey, Logger } from '@chainlink/ea-bootstrap'
import type {
  ExecuteWithConfig,
  Config,
  InputParameters,
  AdapterRequest,
  AxiosResponse,
  AdapterBatchResponse,
} from '@chainlink/ea-bootstrap'
import { NAME as AdapterName } from '../config'

export const supportedEndpoints = ['latest']
export const batchablePropertyPath = [{ name: 'quote' }]

export const description =
  'Returns a batched price comparison from one currency to a list of other currencies.'

export type TInputParameters = { base: string | string[]; quote: string | string[] }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    required: true,
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
  },
  quote: {
    required: true,
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
  },
}
export interface ResponseSchema {
  success: true
  timestamp: string
  date: string
  base: string
  rates: {
    [key: string]: number
  }
  unit: string
}

//If baseSymbols and toSymbols are both arrays, then error
//If baseSymbols is array, then swap base and to, then invert
//If toSymbols is array, then behave as normal
//If both are strings behave as normal

const handleBatchedRequest = (
  jobRunID: string,
  request: AdapterRequest,
  response: AxiosResponse<ResponseSchema>,
  resultPath: string,
  base: string,
  quote: string,
  invert: boolean,
) => {
  const payload: AdapterBatchResponse = []

  const symbols = quote.split(',')
  for (const symbol of symbols) {
    const individualRequest = {
      ...request,
      data: { ...request.data, base, quote: symbol },
    }

    let result = Requester.validateResultNumber(response.data, [resultPath, symbol])

    //If user passed {base: string[], quote: string}, undo swapping base and quote (since only quote can be a list) and cache the inverse
    //If result is 0 there's nothing to invert, and would create a divide by zero error if we tried
    console.log('Important params: ', invert, result)
    if (invert && result != 0) {
      console.log('Received instruction to invert number')
      console.log(`${base}:${symbol} = ${result}`)
      console.log(`${symbol}:${base} = ${1 / result}`)
      individualRequest.data.base = symbol
      individualRequest.data.quote = base
      result = 1 / result
    }
    console.log(individualRequest)
    payload.push([
      CacheKey.getCacheKey(individualRequest, Object.keys(inputParameters)),
      individualRequest,
      result,
    ])
  }

  return Requester.success(
    jobRunID,
    Requester.withResult(response, undefined, payload),
    true,
    batchablePropertyPath,
  )
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  console.log('In latest')
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  const from = validator.overrideSymbol(AdapterName, validator.validated.data.base)
  const to = validator.overrideSymbol(AdapterName, validator.validated.data.quote)
  // const to = validator.validated.data.quote
  console.log('Validating...')
  console.log(from)
  console.log(to)
  if (Array.isArray(from) && from.length > 1 && Array.isArray(to) && to.length > 1) {
    Logger.warn('Processing request where')
  }

  //The api only accepts a list in its "symbols" (quote) field.
  //If we receive a list for base and a string for quote, we swap base (the list) and quote (the string) for the "symbols" and "base fields to meet the API's validation,
  //then reverse the swap (i.e. calculate the inverse) in handleBatchRequest.
  const invert = Array.isArray(from)
  let base: string, quote: string | string[]
  if (Array.isArray(from)) {
    //Base is an array, so swap base and quote
    base = to.toString()
    quote = from.join(',')
  } else if (Array.isArray(to)) {
    //Quote is an array, so make it a string and proceed as normal
    base = from.toString()
    quote = to.join(',')
  } else {
    //Both base and quote are strings, no manipulation required
    base = from
    quote = to
  }

  const url = `latest`

  const params = {
    access_key: config.apiKey,
    base,
    symbols: quote,
  }

  const reqConfig = { ...config.api, params, url }
  console.log(reqConfig)
  const response = await Requester.request<ResponseSchema>(reqConfig)
  if (Array.isArray(to) || Array.isArray(from)) {
    //If we received an array as our from i
    console.log('batch')
    return handleBatchedRequest(jobRunID, request, response, 'rates', base, quote, invert)
  }

  const result = Requester.validateResultNumber(response.data, ['rates', to])
  return Requester.success(
    jobRunID,
    Requester.withResult(response, result),
    config.verbose,
    batchablePropertyPath,
  )
}
