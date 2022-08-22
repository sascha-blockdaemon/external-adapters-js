import nock from 'nock'

export const mockResponseSuccessConvertEndpoint = (): nock.Scope =>
  nock('https://metals-api.com/api/', {
    encodedQueryParams: true,
  })
    .get('/convert')
    .query({ access_key: 'fake-api-key', from: 'XAU', to: 'USD', amount: 1 })
    .reply(
      200,
      () => ({
        success: true,
        query: { from: 'XAU', to: 'USD', amount: 1 },
        info: { timestamp: 1637949420, rate: 1785.0181286441143 },
        historical: false,
        date: '2021-11-26',
        result: 1785.0181286441143,
        unit: 'per ounce',
      }),
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )

export const mockResponseSuccessLatestEndpoint = (): nock.Scope =>
  nock('https://metals-api.com/api/', { encodedQueryParams: true })
    .get('/latest')
    .query({
      access_key: 'fake-api-key',
      base: 'XAU',
      symbols: 'USD',
    })
    .reply(
      200,
      {
        success: true,
        timestamp: 1641990900,
        date: '2022-01-12',
        base: 'XAU',
        rates: {
          USD: 1817.0552439305814,
        },
        unit: 'per ounce',
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )

export const mockResponseSuccessLatestBtcEndpoint = () =>
  nock('https://metals-api.com/api', { encodedQueryParams: true })
    .get('/latest')
    .query({ access_key: 'fake-api-key', base: 'BTC', symbols: 'USD,XAU' })
    .reply(
      200,
      {
        success: true,
        timestamp: 1641990180,
        date: '2022-01-12',
        base: 'BTC',
        rates: {
          XAU: 0.04228229144046888,
          USD: 42968.36778447169,
        },
        unit: 'per ounce',
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )

export const mockResponseSuccessLatestUsdInverseEndpoint = () =>
  nock('https://metals-api.com/api', { encodedQueryParams: true })
    .get('/latest')
    .query({ access_key: 'fake-api-key', base: 'USD', symbols: 'XAU,GBP' })
    .reply(
      200,
      {
        success: true,
        timestamp: 1641990180,
        date: '2022-01-12',
        base: 'USD',
        rates: {
          XAU: 0.04228229144046888,
          GBP: 42968.36778447169,
        },
        unit: 'per ounce',
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
