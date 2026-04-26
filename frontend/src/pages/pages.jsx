// Research.jsx
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { aiAPI } from '@/utils/api'
import { Search, Sparkles, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

const card = { background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '14px 16px' }
const SIGNAL_COLOR = { 'STRONG BUY': '#3fb950', 'BUY': '#3fb950', 'HOLD': '#e3b341', 'SELL': '#f85149', 'STRONG SELL': '#f85149' }

export function Research() {
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
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>{t('research')} <span style={{ fontSize: 12, color: '#8b949e', fontWeight: 400 }}>powered by Gemini Flash</span></h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* AI Research */}
        <div style={card}>
          <div style={{ fontSize: 12, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={13} /> AI Research
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="Ticker (optional)" style={{ width: 100, background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }} />
            <select value={assetType} onChange={e => setAssetType(e.target.value)} style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }}>
              <option value="stock">Stock</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
          <textarea value={query} onChange={e => setQuery(e.target.value)} placeholder={t('ai_research_placeholder')}
            style={{ width: '100%', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '8px 10px', color: '#e2e8f0', fontSize: 13, height: 80, resize: 'vertical', marginBottom: 10 }} />
          <button onClick={research} disabled={loading || !query} style={{ width: '100%', background: '#1f6feb', border: 'none', color: '#fff', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            {loading ? 'Analyzing...' : t('analyze')}
          </button>
          {result?.analysis && (
            <div style={{ marginTop: 14, padding: 12, background: '#0d1117', borderRadius: 8, border: '1px solid #21262d' }}>
              <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 6, textTransform: 'uppercase' }}>AI Analysis</div>
              <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{result.analysis}</div>
            </div>
          )}
        </div>

        {/* Best trades */}
        <div style={card}>
          <div style={{ fontSize: 12, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={13} /> {t('best_trades')}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {['low', 'medium', 'high'].map(r => (
              <button key={r} onClick={() => setRisk(r)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: '1px solid', borderColor: risk === r ? '#e3b341' : '#21262d', background: risk === r ? 'rgba(227,179,65,0.1)' : 'transparent', color: risk === r ? '#e3b341' : '#8b949e', fontSize: 11, cursor: 'pointer' }}>{r}</button>
            ))}
          </div>
          <button onClick={loadBest} disabled={loadingBest} style={{ width: '100%', background: '#3fb950', border: 'none', color: '#fff', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13, marginBottom: 12 }}>
            {loadingBest ? 'Finding...' : '🔍 Find Best Trades Now'}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bestTrades.map((t2, i) => (
              <div key={i} style={{ background: '#0d1117', borderRadius: 8, padding: '10px 12px', border: `1px solid ${SIGNAL_COLOR[t2.signal] || '#21262d'}44` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 13 }}>{t2.ticker} <span style={{ fontSize: 10, color: '#8b949e' }}>{t2.type}</span></span>
                  <span style={{ fontSize: 12, color: SIGNAL_COLOR[t2.signal], fontWeight: 600 }}>{t2.signal}</span>
                </div>
                <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>{t2.reason}</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                  <span style={{ color: '#8b949e' }}>Entry: <span style={{ color: '#e2e8f0' }}>{t2.entry}</span></span>
                  <span style={{ color: '#8b949e' }}>Target: <span style={{ color: '#3fb950' }}>{t2.target}</span></span>
                  <span style={{ color: '#8b949e' }}>Stop: <span style={{ color: '#f85149' }}>{t2.stop_loss}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Alerts.jsx
export function Alerts() {
  const { t } = useTranslation()
  const [alerts, setAlerts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ticker: '', condition: 'price_above', value: 0, channels: ['in_app'], email_to: '' })
  const { addNotification } = useStore()

  useEffect(() => { loadAlerts() }, [])

  async function loadAlerts() {
    try {
      const res = await alertAPI.list()
      setAlerts(res.data.alerts || [])
    } catch {}
  }

  async function createAlert() {
    try {
      await alertAPI.create(form)
      toast.success('Alert created!')
      setShowForm(false)
      loadAlerts()
    } catch { toast.error('Failed to create alert') }
  }

  async function testTelegram() {
    try {
      await alertAPI.testTelegram()
      toast.success('Test message sent to Telegram!')
    } catch { toast.error('Telegram not configured. Check your .env') }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{t('alerts')}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={testTelegram} style={{ background: '#21262d', border: '1px solid #30363d', color: '#8b949e', padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
            Test Telegram
          </button>
          <button onClick={() => setShowForm(true)} style={{ background: '#1f6feb', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            + {t('add_alert')}
          </button>
        </div>
      </div>

      <div style={card}>
        {alerts.length === 0 ? (
          <div style={{ color: '#8b949e', textAlign: 'center', padding: 40, fontSize: 13 }}>No alerts configured yet.</div>
        ) : alerts.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #21262d' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{a.ticker} — {a.condition.replace('_', ' ')} ${a.value}</div>
              <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>Channels: {a.channels?.join(', ')}</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.active ? '#3fb950' : '#8b949e' }} />
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...card, width: 380 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>{t('add_alert')}</h3>
            {[{ label: 'Ticker', key: 'ticker', placeholder: 'AAPL' }].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value.toUpperCase() })} placeholder={f.placeholder}
                  style={{ width: '100%', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Condition</label>
              <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}
                style={{ width: '100%', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }}>
                <option value="price_above">Price Above</option>
                <option value="price_below">Price Below</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Value ($)</label>
              <input type="number" value={form.value} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) })}
                style={{ width: '100%', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 6 }}>Channels</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['in_app', 'telegram', 'email'].map(ch => (
                  <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b949e', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.channels.includes(ch)}
                      onChange={e => setForm({ ...form, channels: e.target.checked ? [...form.channels, ch] : form.channels.filter(c => c !== ch) })} />
                    {ch}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={createAlert} style={{ flex: 1, background: '#1f6feb', border: 'none', color: '#fff', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>{t('save')}</button>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: '#21262d', border: 'none', color: '#8b949e', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Settings.jsx
export function Settings() {
  const { t, i18n } = useTranslation()
  const { tradingMode, setTradingMode } = useStore()
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_key') || '')
  const card2 = { ...card, marginBottom: 12 }

  function saveGeminiKey() {
    localStorage.setItem('gemini_key', geminiKey)
    toast.success('Gemini API key saved!')
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>{t('settings')}</h1>

      <div style={card2}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>AI Configuration</div>
        <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Gemini API Key</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="Enter Gemini API key"
            style={{ flex: 1, background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }} />
          <button onClick={saveGeminiKey} style={{ background: '#1f6feb', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>{t('save')}</button>
        </div>
        <p style={{ fontSize: 11, color: '#8b949e', marginTop: 6 }}>Get your free key at <a href="https://aistudio.google.com" target="_blank" style={{ color: '#1f6feb' }}>aistudio.google.com</a></p>
      </div>

      <div style={card2}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>Trading Mode</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['paper', 'live'].map(mode => (
            <button key={mode} onClick={() => setTradingMode(mode)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid', borderColor: tradingMode === mode ? (mode === 'live' ? '#da3633' : '#1f6feb') : '#21262d', background: tradingMode === mode ? (mode === 'live' ? 'rgba(218,54,51,0.1)' : 'rgba(31,111,235,0.1)') : 'transparent', color: tradingMode === mode ? (mode === 'live' ? '#f85149' : '#79c0ff') : '#8b949e', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              {mode === 'paper' ? '📄 ' + t('paper_mode') : '⚡ ' + t('live_mode')}
            </button>
          ))}
        </div>
        {tradingMode === 'live' && <p style={{ fontSize: 11, color: '#f85149', marginTop: 8 }}>⚠️ Live mode will execute real trades. Use with caution.</p>}
      </div>

      <div style={card2}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>Language</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['en', '🇬🇧 English'], ['fr', '🇫🇷 Français']].map(([code, label]) => (
            <button key={code} onClick={() => { i18n.changeLanguage(code); localStorage.setItem('lang', code) }} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid', borderColor: i18n.language === code ? '#1f6feb' : '#21262d', background: i18n.language === code ? 'rgba(31,111,235,0.1)' : 'transparent', color: i18n.language === code ? '#79c0ff' : '#8b949e', cursor: 'pointer', fontSize: 13 }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Add missing imports at top of file
import { useEffect } from 'react'
import { useStore } from '@/store'
import { alertAPI } from '@/utils/api'
import toast from 'react-hot-toast'
