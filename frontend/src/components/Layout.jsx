import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useStore } from '@/store'
import {
  LayoutDashboard, Briefcase, Zap, Search, Link2,
  Bell, Settings, ChevronRight, Globe, AlertCircle, TrendingUp
} from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/portfolio', icon: Briefcase, key: 'portfolio' },
  { to: '/signals', icon: Zap, key: 'signals' },
  { to: '/research', icon: Search, key: 'research' },
  { to: '/brokers', icon: Link2, key: 'brokers' },
  { to: '/alerts', icon: Bell, key: 'alerts' },
  { to: '/settings', icon: Settings, key: 'settings' },
]

export default function Layout() {
  const { t, i18n } = useTranslation()
  const { tradingMode, setTradingMode, notifications, connectedBrokers } = useStore()
  const [collapsed, setCollapsed] = useState(false)
  const unread = notifications.filter(n => !n.read).length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d1117', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 60 : 220, transition: 'width 0.2s', background: '#161b22',
        borderRight: '1px solid #21262d', display: 'flex', flexDirection: 'column', flexShrink: 0
      }}>
        <div style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #21262d' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} color="#3fb950" />
              <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0', letterSpacing: -0.5 }}>trade<span style={{ color: '#3fb950' }}>AI</span></span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', padding: 4 }}>
            <ChevronRight size={16} style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: '0.2s' }} />
          </button>
        </div>

        {/* Trading mode toggle */}
        {!collapsed && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #21262d' }}>
            <div style={{ display: 'flex', background: '#0d1117', borderRadius: 8, padding: 2, gap: 2 }}>
              <button onClick={() => setTradingMode('paper')} style={{
                flex: 1, padding: '4px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500,
                background: tradingMode === 'paper' ? '#1f6feb' : 'transparent',
                color: tradingMode === 'paper' ? '#fff' : '#8b949e'
              }}>{t('paper_mode')}</button>
              <button onClick={() => setTradingMode('live')} style={{
                flex: 1, padding: '4px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 500,
                background: tradingMode === 'live' ? '#da3633' : 'transparent',
                color: tradingMode === 'live' ? '#fff' : '#8b949e'
              }}>{t('live_mode')}</button>
            </div>
          </div>
        )}

        <nav style={{ flex: 1, padding: '8px 8px' }}>
          {NAV.map(({ to, icon: Icon, key }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8,
              marginBottom: 2, textDecoration: 'none', fontSize: 13, fontWeight: 500,
              background: isActive ? '#21262d' : 'transparent',
              color: isActive ? '#e2e8f0' : '#8b949e',
              transition: '0.15s'
            })}>
              <Icon size={16} />
              {!collapsed && <span>{t(key)}</span>}
              {key === 'alerts' && unread > 0 && !collapsed && (
                <span style={{ marginLeft: 'auto', background: '#da3633', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Language toggle */}
        {!collapsed && (
          <div style={{ padding: '10px 12px', borderTop: '1px solid #21262d' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['en', 'fr'].map(lang => (
                <button key={lang} onClick={() => { i18n.changeLanguage(lang); localStorage.setItem('lang', lang) }} style={{
                  flex: 1, padding: '4px 0', borderRadius: 6, border: '1px solid #21262d', cursor: 'pointer', fontSize: 11,
                  background: i18n.language === lang ? '#21262d' : 'transparent',
                  color: i18n.language === lang ? '#e2e8f0' : '#8b949e'
                }}>{lang.toUpperCase()}</button>
              ))}
            </div>
            {connectedBrokers.length > 0 && (
              <div style={{ marginTop: 8, fontSize: 10, color: '#3fb950', display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3fb950' }} />
                {connectedBrokers.length} broker{connectedBrokers.length > 1 ? 's' : ''} connected
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        <Outlet />
      </main>
    </div>
  )
}
