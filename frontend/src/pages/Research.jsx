import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { aiAPI } from '@/utils/api'
import { Search, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

const card = { background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '14px 16px' }
const SIGNAL_COLOR = { 'STRONG BUY': '#3fb950', 'BUY': '#3fb950', 'HOLD': '#e3b341', 'SELL': '#f85149', 'STRONG SELL': '#f85149' }

export default function Research() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [ticker, setTicker] = useState('')
  const [assetType, setAssetType] = useState('stock')
  const [result, setResult] = useState(null)
  const [bestTrades, setBestTrades] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingBest, setLoadingBest] = useState(false)
  const [risk, setRisk] = useState('medium')

  async function research() {
    if (!query) return
    setLoading(true)
    try {
      const res = await aiAPI.research(query, ticker || null, assetType)
      setResult(res.data)
    } catch { toast.error('AI research failed') }
    setLoading(false)
  }

  async function loadBest() {
    setLoadingBest(true)
    try {
      const res = await aiAPI.bestTrades('all', risk)
      setBestTrades(res.data.trades || [])
    } catch { toast.error('Failed to load best trades') }
    setLoadingBest(false)
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>
        {t('research')} <span style={{ fontSize: 12, color: '#8b949e', fontWeight: 400 }}>powered by Gemini Flash</span>
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 12, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>AI Research</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="Ticker (optional)"
              style={{ width: 110, background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }} />
            <select value={assetType} onChange={e => setAssetType(e.target.value)}
              style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }}>
              <option value="stock">Stock</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
          <textarea value={query} onChange={e => setQuery(e.target.value)} placeholder={t('ai_research_placeholder')}
            style={{ width: '100%', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '8px 10px', color: '#e2e8f0', fontSize: 13, height: 80, resize: 'vertical', marginBottom: 10 }} />
          <button onClick={research} disabled={loading || !query}
            style={{ width: '100%', background: loading ? '#21262d' : '#1f6feb', border: 'none', color: '#fff', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            {loading ? 'Analyzing...' : t('analyze')}
          </button>
          {result?.analysis && (
            <div style={{ marginTop: 14, padding: 12, background: '#0d1117', borderRadius: 8, border: '1px solid #21262d' }}>
              <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 6, textTransform: 'uppercase' }}>AI Analysis</div>
              <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{result.analysis}</div>
            </div>
          )}
        </div>

        <div style={card}>
          <div style={{ fontSize: 12, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Best Trades Today (AI)</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {['low', 'medium', 'high'].map(r => (
              <button key={r} onClick={() => setRisk(r)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: '1px solid', borderColor: risk === r ? '#e3b341' : '#21262d', background: risk === r ? 'rgba(227,179,65,0.1)' : 'transparent', color: risk === r ? '#e3b341' : '#8b949e', fontSize: 11, cursor: 'pointer' }}>{r}</button>
            ))}
          </div>
          <button onClick={loadBest} disabled={loadingBest}
            style={{ width: '100%', background: '#3fb950', border: 'none', color: '#fff', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginBottom: 12 }}>
            {loadingBest ? 'Finding...' : '🔍 Find Best Trades Now'}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
            {bestTrades.map((tr, i) => (
              <div key={i} style={{ background: '#0d1117', borderRadius: 8, padding: '10px 12px', border: `1px solid ${SIGNAL_COLOR[tr.signal] || '#21262d'}44` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 13 }}>{tr.ticker} <span style={{ fontSize: 10, color: '#8b949e' }}>{tr.type}</span></span>
                  <span style={{ fontSize: 12, color: SIGNAL_COLOR[tr.signal], fontWeight: 600 }}>{tr.signal}</span>
                </div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 6 }}>{tr.reason}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                  <span style={{ color: '#8b949e' }}>Entry: <span style={{ color: '#e2e8f0' }}>{tr.entry}</span></span>
                  <span style={{ color: '#8b949e' }}>Target: <span style={{ color: '#3fb950' }}>{tr.target}</span></span>
                  <span style={{ color: '#8b949e' }}>Stop: <span style={{ color: '#f85149' }}>{tr.stop_loss}</span></span>
                  <span style={{ marginLeft: 'auto', color: '#e3b341' }}>{tr.confidence}%</span>
                </div>
              </div>
            ))}
            {bestTrades.length === 0 && !loadingBest && (
              <div style={{ color: '#8b949e', textAlign: 'center', padding: 20, fontSize: 13 }}>Click "Find Best Trades" to get AI recommendations</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
