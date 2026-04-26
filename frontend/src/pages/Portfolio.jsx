import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { portfolioAPI } from '@/utils/api'
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'

const card = { background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '14px 16px' }

export default function Portfolio() {
  const { t } = useTranslation()
  const [portfolio, setPortfolio] = useState({ positions: [], total_value: 0, total_pnl: 0, total_pnl_pct: 0 })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ticker: '', asset_type: 'stock', qty: 1, avg_price: 0, broker: 'paper' })
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await portfolioAPI.get()
      setPortfolio(res.data)
    } catch { toast.error('Failed to load portfolio') }
    setLoading(false)
  }

  async function addPosition() {
    try {
      await portfolioAPI.add(form)
      toast.success(`${form.ticker} added!`)
      setShowForm(false)
      load()
    } catch { toast.error('Failed to add position') }
  }

  async function removePosition(ticker) {
    try {
      await portfolioAPI.remove(ticker)
      toast.success(`${ticker} removed`)
      load()
    } catch { toast.error('Failed to remove') }
  }

  const isPnlUp = portfolio.total_pnl >= 0

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{t('portfolio')}</h1>
        <button onClick={() => setShowForm(true)} style={{ background: '#1f6feb', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <Plus size={14} /> {t('add_position')}
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', marginBottom: 4 }}>{t('total_value')}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>${portfolio.total_value?.toLocaleString()}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', marginBottom: 4 }}>{t('total_pnl')}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: isPnlUp ? '#3fb950' : '#f85149' }}>
            {isPnlUp ? '+' : ''}${portfolio.total_pnl?.toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: isPnlUp ? '#3fb950' : '#f85149' }}>{isPnlUp ? '+' : ''}{portfolio.total_pnl_pct?.toFixed(2)}%</div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', marginBottom: 4 }}>Positions</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>{portfolio.positions?.length || 0}</div>
        </div>
      </div>

      {/* Positions table */}
      <div style={card}>
        <div style={{ fontSize: 12, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Open Positions</div>
        {loading ? (
          <div style={{ color: '#8b949e', textAlign: 'center', padding: 30 }}>{t('loading')}</div>
        ) : portfolio.positions?.length === 0 ? (
          <div style={{ color: '#8b949e', textAlign: 'center', padding: 30, fontSize: 13 }}>No positions yet. Add your first one!</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Ticker', 'Type', 'Qty', 'Avg Price', 'Current', 'Value', 'P&L', 'P&L %', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 11, color: '#8b949e', padding: '6px 8px', borderBottom: '1px solid #21262d', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolio.positions.map((pos, i) => {
                const up = pos.pnl >= 0
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #21262d' }}>
                    <td style={{ padding: '10px 8px', fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{pos.ticker}</td>
                    <td style={{ padding: '10px 8px', fontSize: 11, color: '#8b949e' }}>{pos.asset_type}</td>
                    <td style={{ padding: '10px 8px', fontSize: 13, color: '#e2e8f0' }}>{pos.qty}</td>
                    <td style={{ padding: '10px 8px', fontSize: 13, color: '#e2e8f0' }}>${pos.avg_price?.toFixed(2)}</td>
                    <td style={{ padding: '10px 8px', fontSize: 13, color: '#e2e8f0' }}>${pos.current_price?.toFixed(2)}</td>
                    <td style={{ padding: '10px 8px', fontSize: 13, color: '#e2e8f0' }}>${pos.value?.toFixed(2)}</td>
                    <td style={{ padding: '10px 8px', fontSize: 13, color: up ? '#3fb950' : '#f85149' }}>{up ? '+' : ''}${pos.pnl?.toFixed(2)}</td>
                    <td style={{ padding: '10px 8px', fontSize: 13, color: up ? '#3fb950' : '#f85149' }}>{up ? '+' : ''}{pos.pnl_pct?.toFixed(2)}%</td>
                    <td style={{ padding: '10px 8px' }}>
                      <button onClick={() => removePosition(pos.ticker)} style={{ background: 'none', border: 'none', color: '#f85149', cursor: 'pointer' }}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add position modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...card, width: 360 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>{t('add_position')}</h3>
            {[
              { label: 'Ticker', key: 'ticker', type: 'text', placeholder: 'AAPL or BTC' },
              { label: 'Quantity', key: 'qty', type: 'number', placeholder: '10' },
              { label: 'Average Price ($)', key: 'avg_price', type: 'number', placeholder: '180.00' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: f.type === 'number' ? parseFloat(e.target.value) : e.target.value.toUpperCase() })}
                  style={{ width: '100%', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Asset Type</label>
              <select value={form.asset_type} onChange={e => setForm({ ...form, asset_type: e.target.value })}
                style={{ width: '100%', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }}>
                <option value="stock">Stock</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addPosition} style={{ flex: 1, background: '#1f6feb', border: 'none', color: '#fff', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>{t('save')}</button>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: '#21262d', border: 'none', color: '#8b949e', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
