import request, { SuperTest, Test } from 'supertest'
import { AddressInfo } from 'net'
import * as process from 'process'
import * as nock from 'nock'
import { ServerInstance } from '@chainlink/external-adapter-framework'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { customSettings } from '../../src/config'
import { forex, stock, crypto } from '../../src/endpoint'
import { Server, WebSocket } from 'mock-socket'

export type SuiteContext = {
  req: SuperTest<Test> | null
  server: () => Promise<ServerInstance>
  fastify?: ServerInstance
}

export type EnvVariables = { [key: string]: string }

export type TestOptions = { cleanNock?: boolean; fastify?: boolean }

export const setupExternalAdapterTest = (
  envVariables: NodeJS.ProcessEnv,
  context: SuiteContext,
  options: TestOptions = { cleanNock: true, fastify: false },
): void => {
  let fastify: ServerInstance

  beforeAll(async () => {
    process.env['METRICS_ENABLED'] = 'false'
    for (const key in envVariables) {
      process.env[key] = envVariables[key]
    }

    if (process.env['RECORD']) {
      nock.recorder.rec()
    }
    fastify = await context.server()

    // eslint-disable-next-line require-atomic-updates
    context.req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)

    // Only for edge cases when someone needs to use the fastify instance outside this function
    if (options.fastify) {
      // eslint-disable-next-line require-atomic-updates
      context.fastify = fastify
    }
  })

  afterAll(async () => {
    if (process.env['RECORD']) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()

    await fastify.close()
  })
}

export const mockWebSocketProvider = (provider: typeof WebSocketClassProvider): void => {
  // Extend mock WebSocket class to bypass protocol headers error
  class MockWebSocket extends WebSocket {
    constructor(url: string, protocol: string | string[] | Record<string, string> | undefined) {
      super(url, protocol instanceof Object ? undefined : protocol)
    }
    // Mock WebSocket does not come with built on function which adapter handlers could be using for ws
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    on(_: Event) {
      return
    }
  }

  // Need to disable typing, the mock-socket impl does not implement the ws interface fully
  provider.set(MockWebSocket as any) // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const mockStockWebSocketServer = (URL: string): Server => {
  const wsResponse = [
    {
      message: 'Authorizing...',
    },
    {
      status_code: 200,
      message: 'Connected to the U.S Market source.',
    },
    {
      s: 'AAPL',
      p: 163.58,
      c: [37],
      v: 50,
      dp: false,
      t: 1646154954689,
    },
  ]
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    wsResponse.forEach((message) => {
      socket.send(JSON.stringify(message))
    })
  })

  return mockWsServer
}

export const mockForexWebSocketServer = (URL: string): Server => {
  const wsResponse = [
    {
      message: 'Authorizing...',
    },
    {
      status_code: 200,
      message: 'Connected to the Forex Market source.',
    },
    {
      s: 'GBP/USD',
      a: 1.33139,
      b: 1.3313,
      dd: '-0.0108',
      dc: '-0.8082',
      ppms: false,
      t: 1646157588000,
    },
  ]
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    wsResponse.forEach((message) => {
      socket.send(JSON.stringify(message))
    })
  })

  return mockWsServer
}

export const mockCryptoWebSocketServer = (URL: string): Server => {
  const mockWsServer = new Server(URL, { mock: false })
  mockWsServer.on('connection', (socket) => {
    let counter = 0
    const parseMessage = () => {
      if (counter++ === 0) {
        socket.send(
          JSON.stringify({
            s: 'BTCUSD',
            p: '43682.66306523',
            q: '0.04582000',
            dex: false,
            src: 'A',
            t: 1646151298290,
          }),
        )
      }
    }
    socket.on('message', parseMessage)
  })

  return mockWsServer
}

export const createAdapter = (): Adapter<typeof customSettings> => {
  return new Adapter({
    name: 'test',
    defaultEndpoint: stock.name,
    endpoints: [stock, forex, crypto],
    customSettings,
  })
}

export function setEnvVariables(envVariables: NodeJS.ProcessEnv): void {
  for (const key in envVariables) {
    process.env[key] = envVariables[key]
  }
}
