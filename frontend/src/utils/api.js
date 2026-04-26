import axios from 'axios'
const api = axios.create({ baseURL: '/api' })
export const marketAPI={getStock:(t,r)=>api.get(`/market/stock/${t}?range=${r}`),getCrypto:(s,r)=>api.get(`/market/crypto/${s}?range=${r}`),search:(q)=>api.get(`/market/search?q=${q}`),topMovers:(type='all')=>api.get(`/market/top-movers?asset_type=${type}`),overview:()=>api.get('/market/overview')}
export const signalAPI={get:(t,type)=>api.get(`/signals/${t}?asset_type=${type}`),opportunities:(type,limit)=>api.get(`/signals/opportunities/best?asset_type=${type}&limit=${limit}`),addCustom:(signal)=>api.post('/signals/custom',signal),listCustom:()=>api.get('/signals/custom/list')}
export const scannerAPI={list:(limit=20)=>api.get(`/scanner/?limit=${limit}`),refresh:()=>api.post('/scanner/refresh')}
export default api