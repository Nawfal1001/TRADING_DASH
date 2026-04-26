import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { brokerAPI } from '@/utils/api'
import { useStore } from '@/store'
import { Link2, CheckCircle, XCircle, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const card = { background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '14px 16px' }

const BROKER_INFO = {
  alpaca: { name: 'Alpaca', desc: 'Commission-free stock trading API', color: '#FFCE00', paper: true },
  ibkr: { name: 'Interactive Brokers', desc: 'Professional stock & options trading', color: '#EF4444', paper: true },
  tda: { name: 'TD Ameritrade', desc: 'Full-service stock broker', color: '#009A44', paper: false },
  binance: { name: 'Binance', desc: 'World\'s largest crypto exchange', color: '#F0B90B', paper: false },
  coinbase: { name: 'Coinbase', desc: 'Most trusted crypto exchange', color: '#0052FF', paper: false },
  kraken: { name: 'Kraken', desc: 'Secure crypto exchange', color: '#5741D9', paper: false },
  custom: { name: 'Custom API', desc: 'Connect any broker with custom API', color: '#8b949e', paper: false },
}

export default function Brokers() {
  const { t } = useTranslation()
  const { connectedBrokers, addBroker, removeBroker } = useStore()
  const [available, setAvailable] = useState([])
  const [showForm, setShowForm] = useState(null)
  const [form, setForm] = useState({ api_key: '', secret_key: '', extra: '' })
  const [connecting, setConnecting] = useState(false)

  useEffect(() => { loadAvailable() }, [])

  async function loadAvailable() {
    try {
      const res = await brokerAPI.available()
      setAvailable(res.data.brokers || [])
    } catch {}
  }

  async function connect(brokerId) {
    setConnecting(true)
    try {
      const res = await brokerAPI.connect({
        broker: brokerId,
        api_key: form.api_key,
        secret_key: form.secret_key,
        extra: form.extra ? JSON.parse(form.extra) : null
      })
      if (res.data.status === 'connected') {
        addBroker(brokerId)
        setShowForm(null)
        toast.success(`${BROKER_INFO[brokerId]?.name} connected!`)
      } else {
        toast.error(res.data.message || 'Connection failed')
      }
    } catch (e) {
      toast.error('Connection failed: ' + (e.response?.data?.message || e.message))
    }
    setConnecting(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{t('brokers')}</h1>
        <p style={{ fontSize: 13, color: '#8b949e' }}>Connect your trading accounts. All credentials are stored locally.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {Object.entries(BROKER_INFO).map(([id, info]) => {
          const isConnected = connectedBrokers.includes(id)
          return (
            <div key={id} style={{ ...card, borderLeft: `3px solid ${info.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{info.name}</div>
                  <div style={{ fontSize: 11, color: '#8b949e', marginTop: 2 }}>{info.desc}</div>
                </div>
                {isConnected ? <CheckCircle size={18} color="#3fb950" /> : <XCircle size={18} color="#8b949e" />}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
                {info.paper && <span style={{ fontSize: 10, background: 'rgba(31,111,235,0.2)', color: '#79c0ff', padding: '2px 8px', borderRadius: 10 }}>Paper Trading</span>}
                <span style={{ fontSize: 10, background: '#21262d', color: '#8b949e', padding: '2px 8px', borderRadius: 10 }}>{id === 'binance' || id === 'coinbase' || id === 'kraken' ? 'Crypto' : id === 'custom' ? 'Any' : 'Stocks'}</span>
              </div>
              {isConnected ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 12, color: '#3fb950', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3fb950', animation: 'pulse 1.5s infinite' }} />
                    {t('connected')}
                  </div>
                  <button onClick={() => removeBroker(id)} style={{ fontSize: 12, color: '#f85149', background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>
                    {t('disconnect')}
                  </button>
                </div>
              ) : (
                <button onClick={() => { setShowForm(id); setForm({ api_key: '', secret_key: '', extra: '' }) }} style={{ width: '100%', background: '#1f6feb', border: 'none', color: '#fff', padding: '7px', borderRadius: 8, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Plus size={13} /> {t('connect_broker')}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Connect modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...card, width: 400, maxWidth: '90vw' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>Connect {BROKER_INFO[showForm]?.name}</h3>
            <p style={{ fontSize: 12, color: '#8b949e', marginBottom: 16 }}>Your API keys are sent directly to the backend and never stored in plain text.</p>
            {[
              { label: 'API Key', key: 'api_key', placeholder: 'Enter your API key' },
              { label: 'Secret Key', key: 'secret_key', placeholder: 'Enter your secret key' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input type="password" placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  style={{ width: '100%', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }} />
              </div>
            ))}
            {showForm === 'custom' && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Extra Config (JSON)</label>
                <textarea value={form.extra} onChange={e => setForm({ ...form, extra: e.target.value })}
                  placeholder='{"base_url": "https://...", "endpoints": {...}}'
                  style={{ width: '100%', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 12, height: 80, resize: 'vertical' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={() => connect(showForm)} disabled={connecting} style={{ flex: 1, background: '#1f6feb', border: 'none', color: '#fff', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
              <button onClick={() => setShowForm(null)} style={{ flex: 1, background: '#21262d', border: 'none', color: '#8b949e', padding: '8px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
