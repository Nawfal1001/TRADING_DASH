import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '@/store'
import toast from 'react-hot-toast'

const card = { background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '16px', marginBottom: 12 }

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { tradingMode, setTradingMode } = useStore()
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_key') || '')
  const [telegramToken, setTelegramToken] = useState(localStorage.getItem('tg_token') || '')
  const [telegramChat, setTelegramChat] = useState(localStorage.getItem('tg_chat') || '')

  function save(key, val, label) {
    localStorage.setItem(key, val)
    toast.success(`${label} saved!`)
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>{t('settings')}</h1>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>🤖 AI Configuration</div>
        <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>Gemini Flash API Key</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="AIza..."
            style={{ flex: 1, background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }} />
          <button onClick={() => save('gemini_key', geminiKey, 'Gemini key')} style={{ background: '#1f6feb', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>{t('save')}</button>
        </div>
        <p style={{ fontSize: 11, color: '#8b949e' }}>Get free key at <a href="https://aistudio.google.com" target="_blank" style={{ color: '#1f6feb' }}>aistudio.google.com</a></p>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>📱 Telegram Alerts</div>
        {[
          { label: 'Bot Token', key: 'tg_token', val: telegramToken, set: setTelegramToken, ph: '123456:ABC-...' },
          { label: 'Chat ID', key: 'tg_chat', val: telegramChat, set: setTelegramChat, ph: '-1001234567890' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: '#8b949e', display: 'block', marginBottom: 4 }}>{f.label}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="password" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                style={{ flex: 1, background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '7px 10px', color: '#e2e8f0', fontSize: 13 }} />
              <button onClick={() => save(f.key, f.val, f.label)} style={{ background: '#21262d', border: '1px solid #30363d', color: '#8b949e', padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>{t('save')}</button>
            </div>
          </div>
        ))}
        <p style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>Create a bot at @BotFather on Telegram, then add it to a group/channel to get the Chat ID.</p>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>💹 Trading Mode</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['paper', '📄 Paper Trading', '#1f6feb'], ['live', '⚡ Live Trading', '#da3633']].map(([mode, label, color]) => (
            <button key={mode} onClick={() => { if (mode === 'live') { if (!confirm('Switch to LIVE trading? Real money will be used!')) return } setTradingMode(mode) }}
              style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid', borderColor: tradingMode === mode ? color : '#21262d', background: tradingMode === mode ? `${color}22` : 'transparent', color: tradingMode === mode ? color : '#8b949e', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              {label}
            </button>
          ))}
        </div>
        {tradingMode === 'live' && <p style={{ fontSize: 11, color: '#f85149', marginTop: 8 }}>⚠️ Live mode is active. Real trades will be executed via connected brokers.</p>}
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>🌐 Language</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['en', '🇬🇧 English'], ['fr', '🇫🇷 Français']].map(([code, label]) => (
            <button key={code} onClick={() => { i18n.changeLanguage(code); localStorage.setItem('lang', code) }}
              style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid', borderColor: i18n.language === code ? '#1f6feb' : '#21262d', background: i18n.language === code ? 'rgba(31,111,235,0.1)' : 'transparent', color: i18n.language === code ? '#79c0ff' : '#8b949e', cursor: 'pointer', fontSize: 13 }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
