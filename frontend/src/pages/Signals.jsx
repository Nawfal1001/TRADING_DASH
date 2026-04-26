import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { signalAPI } from '@/utils/api'
import { useStore } from '@/store'
import { Zap, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const card = { background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '14px 16px' }
const SIGNAL_COLOR = { 'STRONG BUY': '#3fb950', 'BUY': '#3fb950', 'HOLD': '#e3b341', 'SELL': '#f85149', 'STRONG SELL': '#f85149' }

export default function Signals() {
  const { t } = useTranslation()
  const { customSignals, addCustomSignal, removeCustomSignal } = useStore()
  const [opportunities, setOpportunities] = useState([])
  const [assetType, setAssetType] = useState('all')
  const [risk, setRisk] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customForm, setCustomForm] = useState({ name: '', indicator: 'RSI', condition: 'below', threshold: 30, asset_type: 'stock' })

  useEffect(() => { loadOpportunities() }, [assetType])

  async function loadOpportunities() {
    setLoading(true)
    try {
      const res = await signalAPI.opportunities(assetType, 12)
      setOpportunities(res.data.opportunities || [])
    } catch { toast.error('Failed to load signals') }
    setLoading(false)
  }

  async function saveCustomSignal() {
    try {
      await signalAPI.addCustom(customForm)
      addCustomSignal(customForm)
      setShowCustomForm(false)
      toast.success('Custom signal added!')
    } catch { toast.error('Failed to add signal') }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{t('signals')}</h1>
        <button onClick={() => setShowCustomForm(true)} style={{ background: '#1f6feb', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Plus size={14} /> {t('custom_signal')}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'stocks', 'crypto'].map(t2 => (
          <button key={t2} onClick={() => setAssetType(t2)} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid', borderColor: assetType === t2 ? '#1f6feb' : '#21262d', background: assetType === t2 ? 'rgba(31,111,235,0.1)' : 'transparent', color: assetType === t2 ? '#1f6feb' : '#8b949e', fontSize: 12, cursor: 'pointer' }}>
            {t2.charAt(0).toUpperCase() + t2.slice(1)}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {['low', 'medium', 'high'].map(r => (
            <button key={r} onClick={() => setRisk(r)} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid', borderColor: risk === r ? '#e3b341' : '#21262d', background: risk === r ? 'rgba(227,179,65,0.1)' : 'transparent', color: risk === r ? '#e3b341' : '#8b949e', fontSize: 12, cursor: 'pointer' }}>
              {r.charAt(0).toUpperCase() + r.slice(1)} Risk
            </button>
          ))}
        </div>
      </div>

      {/* Opportunities grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, marginBottom: 20 }}>
        {loading ? (
          <div style={{ color: '#8b949e', fontSize: 13, gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>{t('loading')}</div>
        ) : opportunities.map((opp, i) => (
          <div key={i} style={{ ...card, borderLeft: `3px solid ${SIGNAL_COLOR[opp.signal] || '#8b949e'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{opp.ticker}</span>
                <span style={{ fontSize: 11, color: '#8b949e', marginLeft: 6 }}>{opp.type || 'stock'}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: SIGNAL_COLOR[opp.signal] || '#8b949e', background: `${SIGNAL_COLOR[opp.signal]}22`, padding: '3px 10px', borderRadius: 20 }}>{opp.signal}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div><div style={{ fontSize: 10, color: '#8b949e' }}>PRICE</div><div style={{ fontSize: 14, color: '#e2e8f0' }}>${opp.price?.toLocaleString()}</div></div>
              <div><div style={{ fontSize: 10, color: '#8b949e' }}>RSI</div><div style={{ fontSize: 14, color: '#e2e8f0' }}>{opp.rsi}</div></div>
              <div><div style={{ fontSize: 10, color: '#8b949e' }}>MACD</div><div style={{ fontSize: 14, color: '#e2e8f0' }}>{opp.macd}</div></div>
              <div><div style={{ fontSize: 10, color: '#8b949e' }}>CONFIDENCE</div><div style={{ fontSize: 14, color: SIGNAL_COLOR[opp.signal] }}>{opp.confidence}%</div></div>
            </div>
            {/* Confidence bar */}
            <div style={{ height: 4, background: '#21262d', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${opp.confidence}%`, background: SIGNAL_COLOR[opp.signal] || '#8b949e', borderRadius: 2 }} />
            </div>
            {opp.ai_analysis?.reason && (
              <div style={{ fontSize: 11, color: '#8b949e', marginTop: 8, fontStyle: 'italic' }}>AI: {opp.ai_analysis.reason}</div>
            )}
          </div>
        ))}
      </div>

      {/* Custom signals */}
      {customSignals.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 12, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Custom Signals</div>
          {customSignals.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #21262d' }}>
              <div>
                <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#8b949e' }}>{s.indicator} {s.condition} {s.threshold} — {s.asset_type}</div>
              </div>
              <button onClick={() => removeCustomSignal(i)} style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer' }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Custom signal modal */}
      {showCustomForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...card, width: 380, maxWidth: '90vw' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>Add Custom Signal</h3>
            {[
              { label: 'Name', key: 'name', type: 'text', placeholder: 'My RSI Signal' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input type={f.type} value={customForm[f.key]} onChange={e => setCustomForm({ ...customForm, [f.key]: e.target.value })}
                  placeholder={f.placeholder} style={{ width: '100%', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }} />
              </div>
            ))}
            {[
              { label: 'Indicator', key: 'indicator', options: ['RSI', 'MACD', 'SMA', 'EMA', 'Bollinger', 'Volume'] },
              { label: 'Condition', key: 'condition', options: ['above', 'below', 'crosses_above', 'crosses_below'] },
              { label: 'Asset Type', key: 'asset_type', options: ['stock', 'crypto', 'all'] },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <select value={customForm[f.key]} onChange={e => setCustomForm({ ...customForm, [f.key]: e.target.value })}
                  style={{ width: '100%', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }}>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Threshold</label>
              <input type="number" value={customForm.threshold} onChange={e => setCustomForm({ ...customForm, threshold: parseFloat(e.target.value) })}
                style={{ width: '100%', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveCustomSignal} style={{ flex: 1, background: '#1f6feb', border: 'none', color: '#fff', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>{t('save')}</button>
              <button onClick={() => setShowCustomForm(false)} style={{ flex: 1, background: '#21262d', border: 'none', color: '#8b949e', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
