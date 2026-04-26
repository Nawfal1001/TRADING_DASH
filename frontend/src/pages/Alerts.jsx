import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { alertAPI } from '@/utils/api'
import toast from 'react-hot-toast'

const card = { background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '14px 16px' }

export default function Alerts() {
  const { t } = useTranslation()
  const [alerts, setAlerts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ticker: '', condition: 'price_above', value: 0, channels: ['in_app'] })

  useEffect(() => { load() }, [])

  async function load() {
    try { const res = await alertAPI.list(); setAlerts(res.data.alerts || []) } catch {}
  }

  async function create() {
    try { await alertAPI.create(form); toast.success('Alert created!'); setShowForm(false); load() }
    catch { toast.error('Failed') }
  }

  async function testTelegram() {
    try { await alertAPI.testTelegram(); toast.success('Test sent to Telegram!') }
    catch { toast.error('Telegram not configured. Check backend .env') }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{t('alerts')}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={testTelegram} style={{ background: '#21262d', border: '1px solid #30363d', color: '#8b949e', padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>Test Telegram</button>
          <button onClick={() => setShowForm(true)} style={{ background: '#1f6feb', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>+ {t('add_alert')}</button>
        </div>
      </div>
      <div style={card}>
        {alerts.length === 0
          ? <div style={{ color: '#8b949e', textAlign: 'center', padding: 40, fontSize: 13 }}>No alerts yet.</div>
          : alerts.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #21262d' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{a.ticker} — {a.condition.replace('_', ' ')} ${a.value}</div>
                <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>Channels: {a.channels?.join(', ')}</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3fb950' }} />
            </div>
          ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...card, width: 380 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>{t('add_alert')}</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Ticker</label>
              <input value={form.ticker} onChange={e => setForm({ ...form, ticker: e.target.value.toUpperCase() })} placeholder="AAPL"
                style={{ width: '100%', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }} />
            </div>
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
              <div style={{ display: 'flex', gap: 10 }}>
                {['in_app', 'telegram', 'email'].map(ch => (
                  <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#8b949e', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.channels.includes(ch)}
                      onChange={e => setForm({ ...form, channels: e.target.checked ? [...form.channels, ch] : form.channels.filter(c => c !== ch) })} />
                    {ch}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={create} style={{ flex: 1, background: '#1f6feb', border: 'none', color: '#fff', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>{t('save')}</button>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: '#21262d', border: 'none', color: '#8b949e', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
