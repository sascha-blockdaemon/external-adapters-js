import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.API_KEY = process.env.API_KEY ?? 'test_api_key'

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'base not supplied',
        testData: { id: jobID, data: { base: '', quote: 'USD' } },
      },
      {
        name: 'quote not supplied',
        testData: { id: jobID, data: { base: 'GBP' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest<TInputParameters>, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error as AdapterError)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })

  describe('successful requests', () => {
    const requests = [
      {
        name: 'single convert',
        testData: { id: jobID, endpoint: 'convert', data: { base: 'GBP', quote: 'BTC' } },
      },
      {
        name: 'single latest',
        testData: { id: jobID, endpoint: 'latest', data: { base: 'GBP', quote: 'BTC' } },
      },
      {
        name: 'batched quote',
        testData: { id: jobID, endpoint: 'latest', data: { base: 'USD', quote: ['XAU', 'GBP'] } },
      },
      {
        name: 'batched base',
        testData: { id: jobID, endpoint: 'latest', data: { base: ['XAU', 'GBP'], quote: 'USD' } },
      },
    ]

    requests.forEach(async (req) => {
      const resp = await execute(req.testData as AdapterRequest<TInputParameters>, {})
      assertSuccess({ expected: 200, actual: resp.statusCode }, resp, jobID)
    })
  })
})
