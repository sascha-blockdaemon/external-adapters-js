export const mockSubscribeResponse = {
  jsonrpc: '2.0',
  method: 'vwap',
  params: {
    updates: [
      {
        ticker: 'ETHEUR',
        price: 2400.209999999564,
        size: 0.06804130000001375,
        volume: 163.31340867300332,
      },
    ],
  },
}

export const mockLoginResponse = {
  jsonrpc: '2.0',
  id: 0,
  result: {
    user_id: 'ABCD',
  },
}
