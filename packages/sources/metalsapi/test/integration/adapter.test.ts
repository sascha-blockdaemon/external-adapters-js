import { AdapterRequest } from '@chainlink/ea-bootstrap'
import * as process from 'process'
import { server as startServer } from '../../src'
import {
  mockResponseSuccessConvertEndpoint,
  mockResponseSuccessLatestEndpoint,
  mockResponseSuccessLatestBtcEndpoint,
  mockResponseSuccessLatestUsdInverseEndpoint,
} from './fixtures'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'
import { SuperTest, Test } from 'supertest'

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    API_KEY: process.env.API_KEY || 'fake-api-key',
  }

  setupExternalAdapterTest(envVariables, context)
  describe('convert api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'convert',
        base: 'XAU',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockResponseSuccessConvertEndpoint()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('latest api', () => {
    it('returns success with single base/quote pair', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          endpoint: 'latest',
          base: 'XAU',
          quote: 'USD',
        },
      }

      mockResponseSuccessLatestEndpoint()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    it('returns success with batched quote symbols', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          endpoint: 'latest',
          base: 'BTC',
          quote: ['USD', 'XAU'],
        },
      }

      mockResponseSuccessLatestBtcEndpoint()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    it('should succeed with batched base symbols (inverted quote)', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          endpoint: 'latest',
          base: ['XAU', 'GBP'], //Batching happens in order, so expect "XAU,GBP" to appear in the query (not "GBP,XAU")
          quote: 'USD',
        },
      }
      //The EA should inverse the base and quote. I.e, the above would result in a  {base: USD, quote: [XAU, GBP]
      mockResponseSuccessLatestUsdInverseEndpoint()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      console.log(response.body)
      expect(response.body).toMatchSnapshot()
    })
  })
})
