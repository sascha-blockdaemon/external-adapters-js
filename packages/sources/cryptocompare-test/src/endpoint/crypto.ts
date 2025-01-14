import { HttpTransport } from '@chainlink/external-adapter-framework/transports'
import { buildBatchedRequestBody, constructEntry, BatchEndpointTypes } from '../crypto-utils'

export const httpTransport = new HttpTransport<BatchEndpointTypes>({
  prepareRequests: (params, config) => {
    return buildBatchedRequestBody(params, config)
  },
  parseResponse: (params, res) => {
    const entries = []
    for (const requestPayload of params) {
      const entry = constructEntry(requestPayload, res.data, 'PRICE')
      if (entry) {
        entries.push(entry)
      }
    }
    return entries
  },
})
