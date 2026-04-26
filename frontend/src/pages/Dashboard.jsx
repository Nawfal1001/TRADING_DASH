import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Line, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { marketAPI, signalAPI } from '@/utils/api'
import { useStore } from '@/store'
import { TrendingUp, TrendingDown, Minus, RefreshCw, Star } from 'lucide-react'
import toast from 'react-hot-toast'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const SIGNAL_COLOR = { 'STRONG BUY': '#3fb950', 'BUY': '#3fb950', 'HOLD': '#e3b341', 'SELL': '#f85149', 'STRONG SELL': '#f85149' }
const card = { background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '14px 16px' }

export default function Dashboard() {
  const { t } = useTranslation()
  const { selectedTicker, selectedType, setSelected, watchlist } = useStore()
  const [range, setRange] = useState('1W')
  const [marketData, setMarketData] = useState(null)
  const [signal, setSignal] = useState(null)
  const [movers, setMovers] = useState([])
  const [loading, setLoading] = useState(true)

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
    } catch { toast.error('Failed to load market data') }
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

  const chartData = {
    labels,
    datasets: [{
      label: 'Price',
      data: prices,
      borderColor: isUp ? '#3fb950' : '#f85149',
      backgroundColor: isUp ? 'rgba(63,185,80,0.08)' : 'rgba(248,81,73,0.08)',
      fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2
    }]
  }
  const volData = {
    labels,
    datasets: [{
      label: 'Volume',
      data: volumes,
      backgroundColor: prices.map((p, i) => i > 0 && p >= prices[i - 1] ? 'rgba(63,185,80,0.5)' : 'rgba(248,81,73,0.5)'),
      borderRadius: 2
    }]
  }
  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#8b949e', font: { size: 10 }, maxTicksLimit: 8 } }, y: { grid: { color: '#21262d' }, ticks: { color: '#8b949e', font: { size: 10 } } } } }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{t('market_overview')}</h1>
        <button onClick={loadData} style={{ background: '#21262d', border: '1px solid #30363d', color: '#8b949e', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Watchlist selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {watchlist.map(w => (
          <button key={w.ticker} onClick={() => setSelected(w.ticker, w.type)} style={{
            padding: '5px 12px', borderRadius: 20, border: '1px solid',
            borderColor: selectedTicker === w.ticker ? '#3fb950' : '#21262d',
            background: selectedTicker === w.ticker ? 'rgba(63,185,80,0.1)' : '#161b22',
            color: selectedTicker === w.ticker ? '#3fb950' : '#8b949e',
            fontSize: 12, cursor: 'pointer', fontWeight: 500
          }}>
            {w.ticker} <span style={{ fontSize: 10, opacity: 0.6 }}>{w.type}</span>
          </button>
        ))}
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: t('price'), value: marketData ? `$${marketData.price?.toLocaleString()}` : '—', sub: marketData ? `${marketData.change >= 0 ? '+' : ''}${marketData.change} (${marketData.change_pct}%)` : '—', color: isUp ? '#3fb950' : '#f85149' },
          { label: t('volume'), value: marketData ? `${(marketData.volume / 1e6).toFixed(1)}M` : '—', sub: 'today', color: '#8b949e' },
          { label: 'Market Cap', value: marketData?.market_cap ? `$${(marketData.market_cap / 1e12).toFixed(2)}T` : '—', sub: 'large cap', color: '#8b949e' },
          { label: t('signal'), value: signal?.signal || '—', sub: signal ? `${t('confidence')}: ${signal.confidence}%` : '—', color: SIGNAL_COLOR[signal?.signal] || '#8b949e' },
        ].map((m, i) => (
          <div key={i} style={card}>
            <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 11, color: m.color, marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 10, marginBottom: 10 }}>
        {/* Price chart */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5 }}>Price Chart — {selectedTicker}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {['1D', '1W', '1M', '3M', '1Y'].map(r => (
                <button key={r} onClick={() => setRange(r)} style={{
                  padding: '3px 8px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 11,
                  background: range === r ? '#3fb950' : '#21262d', color: range === r ? '#fff' : '#8b949e'
                }}>{r}</button>
              ))}
            </div>
          </div>
          <div style={{ height: 180 }}>
            {prices.length > 0 ? <Line data={chartData} options={chartOpts} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8b949e', fontSize: 13 }}>{loading ? t('loading') : 'No data'}</div>}
          </div>
        </div>

        {/* Signal details */}
        <div style={card}>
          <div style={{ fontSize: 12, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>AI Signal Breakdown</div>
          {signal?.indicators ? signal.indicators.slice(0, 5).map((ind, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #21262d' }}>
              <span style={{ fontSize: 12, color: '#8b949e' }}>{ind.indicator}</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 12, color: SIGNAL_COLOR[ind.signal] || '#8b949e', fontWeight: 600 }}>{ind.signal}</span>
                <div style={{ fontSize: 10, color: '#8b949e' }}>{ind.reason}</div>
              </div>
            </div>
          )) : <div style={{ color: '#8b949e', fontSize: 13 }}>{loading ? t('loading') : 'Load signal data'}</div>}
        </div>
      </div>

      {/* Volume chart */}
      <div style={{ ...card, marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Volume & Momentum</div>
        <div style={{ height: 100 }}>
          {volumes.length > 0 ? <Bar data={volData} options={{ ...chartOpts, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, ticks: { ...chartOpts.scales.y.ticks, callback: v => `${(v / 1e6).toFixed(0)}M` } } } }} /> : null}
        </div>
      </div>

      {/* Top movers */}
      <div style={card}>
        <div style={{ fontSize: 12, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Top Movers</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {movers.slice(0, 8).map((m, i) => (
            <div key={i} onClick={() => setSelected(m.ticker, m.type)} style={{ background: '#0d1117', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', border: '1px solid #21262d' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{m.ticker}</span>
                <span style={{ fontSize: 10, color: '#8b949e' }}>{m.type}</span>
              </div>
              <div style={{ fontSize: 12, color: '#e2e8f0' }}>${m.price?.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: m.change_pct >= 0 ? '#3fb950' : '#f85149', marginTop: 2 }}>
                {m.change_pct >= 0 ? '+' : ''}{m.change_pct?.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
