import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Line, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { marketAPI, signalAPI } from '@/utils/api'
import { useStore } from '@/store'
import { RefreshCw } from 'lucide-react'
import TradingViewWidget from '@/components/TradingViewWidget'
import toast from 'react-hot-toast'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const SIGNAL_COLOR = { 'STRONG BUY': '#3fb950', 'BUY': '#3fb950', 'HOLD': '#e3b341', 'SELL': '#f85149', 'STRONG SELL': '#f85149' }
const card = { background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '14px 16px' }
const levelBox = { background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '8px 10px' }

function fmt(value) {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 })}`
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { selectedTicker, selectedType, setSelected, watchlist } = useStore()
  const [range, setRange] = useState('1W')
  const [marketData, setMarketData] = useState(null)
  const [signal, setSignal] = useState(null)
  const [movers, setMovers] = useState([])
  const [loading, setLoading] = useState(true)
  const [useTV, setUseTV] = useState(true)

  useEffect(() => { loadData() }, [selectedTicker, selectedType, range])
  useEffect(() => { loadMovers() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [mRes, sRes] = await Promise.all([
        selectedType === 'stock' ? marketAPI.getStock(selectedTicker, range) : marketAPI.getCrypto(selectedTicker, range),
        signalAPI.get(selectedTicker, selectedType)
      ])
      setMarketData(mRes.data)
      setSignal(sRes.data)
    } catch {
      toast.error('Failed to load market data')
    }
    setLoading(false)
  }

  async function loadMovers() {
    try {
      const res = await marketAPI.topMovers('all')
      setMovers(res.data.movers || [])
    } catch {}
  }

  const prices = marketData?.prices || []
  const labels = marketData?.labels || []
  const volumes = marketData?.volumes || []
  const isUp = (marketData?.change || 0) >= 0
  const levels = signal?.trade_levels || {}
  const signalColor = SIGNAL_COLOR[signal?.signal] || '#8b949e'

  const chartData = { labels, datasets: [{ label: 'Price', data: prices, borderColor: isUp ? '#3fb950' : '#f85149', backgroundColor: isUp ? 'rgba(63,185,80,0.08)' : 'rgba(248,81,73,0.08)', fill: true, tension: .4, pointRadius: 0, borderWidth: 2 }] }
  const volData = { labels, datasets: [{ label: 'Volume', data: volumes, backgroundColor: 'rgba(63,185,80,0.4)', borderRadius: 2 }] }
  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{t('market_overview')}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setUseTV(!useTV)} style={{ background: '#21262d', border: '1px solid #30363d', color: '#8b949e', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>{useTV ? 'TradingView' : 'Basic Chart'}</button>
          <button onClick={loadData} style={{ background: '#21262d', border: '1px solid #30363d', color: '#8b949e', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}><RefreshCw size={13}/> Refresh</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {watchlist.map(w => <button key={w.ticker} onClick={() => setSelected(w.ticker, w.type)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid #21262d', background: selectedTicker === w.ticker ? 'rgba(31,111,235,0.1)' : '#161b22', color: selectedTicker === w.ticker ? '#58a6ff' : '#8b949e', fontSize: 12, cursor: 'pointer' }}>{w.ticker}</button>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 12, color: '#8b949e', textTransform: 'uppercase', letterSpacing: .5 }}>Chart — {selectedTicker}</span>
              <span style={{ marginLeft: 8, fontSize: 12, color: signalColor, fontWeight: 700 }}>{signal?.signal || 'LOADING'}</span>
            </div>
            <div style={{ fontSize: 12, color: '#8b949e' }}>{signal?.confidence ? `${signal.confidence}% confidence` : ''}</div>
          </div>

          {useTV ? <TradingViewWidget ticker={selectedTicker} type={selectedType} height={420}/> : <div style={{ height: 420 }}>{prices.length > 0 ? <Line data={chartData} options={chartOpts}/> : null}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginTop: 10 }}>
            <div style={levelBox}><div style={{ fontSize: 10, color: '#8b949e' }}>ENTRY</div><div style={{ color: '#e2e8f0', fontWeight: 700 }}>{fmt(levels.entry)}</div></div>
            <div style={levelBox}><div style={{ fontSize: 10, color: '#8b949e' }}>STOP LOSS</div><div style={{ color: '#f85149', fontWeight: 700 }}>{fmt(levels.stop_loss)}</div></div>
            <div style={levelBox}><div style={{ fontSize: 10, color: '#8b949e' }}>TP1</div><div style={{ color: '#3fb950', fontWeight: 700 }}>{fmt(levels.take_profit_1)}</div></div>
            <div style={levelBox}><div style={{ fontSize: 10, color: '#8b949e' }}>TP2</div><div style={{ color: '#3fb950', fontWeight: 700 }}>{fmt(levels.take_profit_2)}</div></div>
            <div style={levelBox}><div style={{ fontSize: 10, color: '#8b949e' }}>TP3</div><div style={{ color: '#3fb950', fontWeight: 700 }}>{fmt(levels.take_profit_3)}</div></div>
            <div style={levelBox}><div style={{ fontSize: 10, color: '#8b949e' }}>R/R</div><div style={{ color: '#e3b341', fontWeight: 700 }}>{levels.risk_reward || '—'}</div></div>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 12 }}>AI Signal Breakdown</div>
          {signal?.indicators ? signal.indicators.slice(0, 7).map((ind, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #21262d', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#8b949e' }}>{ind.indicator}</span>
              <span style={{ fontSize: 12, color: SIGNAL_COLOR[ind.signal] || '#8b949e', fontWeight: 600 }}>{ind.signal}</span>
            </div>
          )) : <div style={{ color: '#8b949e', fontSize: 13 }}>{loading ? 'Loading signal...' : 'No signal data'}</div>}
        </div>
      </div>

      <div style={{ ...card, marginBottom: 10 }}><div style={{ height: 100 }}>{volumes.length > 0 ? <Bar data={volData} options={chartOpts}/> : null}</div></div>
    </div>
  )
}
