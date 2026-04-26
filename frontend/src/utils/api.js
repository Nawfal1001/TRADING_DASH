import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const marketAPI = {
  getStock: (ticker, range) => api.get(`/market/stock/${ticker}?range=${range}`),
  getCrypto: (symbol, range) => api.get(`/market/crypto/${symbol}?range=${range}`),
  search: (q) => api.get(`/market/search?q=${q}`),
  topMovers: (type = 'all') => api.get(`/market/top-movers?asset_type=${type}`),
  overview: () => api.get('/market/overview'),
}

export const signalAPI = {
  get: (ticker, type) => api.get(`/signals/${ticker}?asset_type=${type}`),
  opportunities: (type, limit) => api.get(`/signals/opportunities/best?asset_type=${type}&limit=${limit}`),
  addCustom: (signal) => api.post('/signals/custom', signal),
  listCustom: () => api.get('/signals/custom/list'),
}

export const brokerAPI = {
  connect: (config) => api.post('/broker/connect', config),
  status: () => api.get('/broker/status'),
  order: (req) => api.post('/broker/order', req),
  positions: (broker) => api.get(`/broker/positions/${broker}`),
  available: () => api.get('/broker/brokers/available'),
}

export const portfolioAPI = {
  get: () => api.get('/portfolio/'),
  add: (pos) => api.post('/portfolio/position', pos),
  remove: (ticker) => api.delete(`/portfolio/position/${ticker}`),
  pnl: () => api.get('/portfolio/pnl'),
}

export const alertAPI = {
  create: (alert) => api.post('/alerts/create', alert),
  list: () => api.get('/alerts/list'),
  testTelegram: () => api.post('/alerts/test/telegram'),
  testEmail: (to) => api.post(`/alerts/test/email?to=${to}`),
}

export const aiAPI = {
  research: (query, ticker, type) => api.post('/ai/research', { query, ticker, asset_type: type }),
  bestTrades: (type, risk) => api.get(`/ai/best-trades?asset_type=${type}&risk=${risk}`),
  newsAnalysis: (ticker) => api.get(`/ai/news-analysis/${ticker}`),
}

export default api
