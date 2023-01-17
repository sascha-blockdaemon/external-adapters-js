import { AddressInfo } from 'net'
import * as process from 'process'

import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceEndpointParams } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { AdapterRequestBody, sleep } from '@chainlink/external-adapter-framework/util'
import { Server, WebSocket } from 'mock-socket'
import request, { SuperTest, Test } from 'supertest'

import { adapterFactory } from '../../src'

describe('websocket', () => {
  const oldEnv = { ...process.env }
  const webSocketEndpoint = 'ws://localhost:9090'
  const webSocketApiKey = 'abcdef'
  const data: AdapterRequestBody<PriceEndpointParams> = {
    data: {
      base: 'AAPL',
      quote: 'USD',
    },
  }

  let spy: jest.SpyInstance
  let mockWebSockerServer: Server
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>

  jest.setTimeout(10000)

  beforeAll(async () => {
    process.env['WS_SUBSCRIPTION_TTL'] = '5000'
    process.env['CACHE_MAX_AGE'] = '5000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    process.env['METRICS_ENABLED'] = 'false'
    process.env['WS_API_ENDPOINT'] = webSocketEndpoint
    process.env['WS_API_KEY'] = webSocketApiKey

    const mockDate = new Date('2023-01-01T00:00:00Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    WebSocketClassProvider.set(WebSocket)
    mockWebSockerServer = new Server(webSocketEndpoint, { mock: false })
    mockWebSockerServer.on('connection', (socket) => {
      socket.on('message', (data) => {
        console.log(`received: ${data}`)
        socket.send(
          JSON.stringify({
            timestamp: 1645203822000,
            symbol_price_dict: {
              'AAPL/USD': {
                quote_currency: 'USD',
                session_status_flag: 'open',
                asset_status_flag: 'active',
                confidence_interval: 0.5,
                price: 100,
              },
            },
          }),
        )
      })
    })

    fastify = await expose(adapterFactory())
    req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)

    // Send initial request to start background execute
    await req.post('/').send(data)
    await sleep(5000)
  })

  afterAll((done) => {
    spy.mockRestore()
    for (const key in oldEnv) {
      process.env[key] = oldEnv[key]
    }
    mockWebSockerServer.close()
    fastify?.close(done())
  })

  describe('price endpoint', () => {
    it('should return success', async () => {
      const makeRequest = () =>
        req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
      const response = await makeRequest()
      expect(response.body).toEqual({
        result: 100,
        data: {
          quote_currency: 'USD',
          session_status_flag: 'open',
          asset_status_flag: 'active',
          confidence_interval: 0.5,
          price: 100,
        },
        timestamps: {
          providerDataReceived: 1672531200000, // mocked time
          providerDataStreamEstablished: 1672531200000,
          providerIndicatedTime: 1645203822000, // response.timestamp
        },
        statusCode: 200,
      })
    }, 30000)
  })
})
