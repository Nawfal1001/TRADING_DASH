import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import '@/i18n'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Portfolio from '@/pages/Portfolio'
import Signals from '@/pages/Signals'
import Research from '@/pages/Research'
import Brokers from '@/pages/Brokers'
import Alerts from '@/pages/Alerts'
import Settings from '@/pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e2130', color: '#e2e8f0', border: '1px solid #2d3748' } }} />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="signals" element={<Signals />} />
          <Route path="research" element={<Research />} />
          <Route path="brokers" element={<Brokers />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
