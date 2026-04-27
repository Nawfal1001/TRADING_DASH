import React, { useEffect, useRef } from 'react'

const SYMBOL_MAP = {
  stock: (ticker) => `NASDAQ:${ticker}`,
  crypto: (ticker) => `BINANCE:${ticker}USDT`,
}

export default function TradingViewWidget({ ticker = 'BTC', type = 'crypto', height = 420 }) {
  const containerRef = useRef(null)
  const widgetId = `tradingview_${ticker}_${type}`.replace(/[^a-zA-Z0-9_]/g, '_')
  const symbol = (SYMBOL_MAP[type] || SYMBOL_MAP.stock)(ticker)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: '60',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      studies: ['STD;RSI', 'STD;MACD'],
      hide_side_toolbar: false,
      withdateranges: true,
      details: true,
      hotlist: false,
    })

    containerRef.current.appendChild(script)
  }, [symbol])

  return (
    <div style={{ height, width: '100%', background: '#0d1117', borderRadius: 10, overflow: 'hidden' }}>
      <div className="tradingview-widget-container" ref={containerRef} style={{ height: '100%', width: '100%' }}>
        <div id={widgetId} className="tradingview-widget-container__widget" style={{ height: 'calc(100% - 32px)', width: '100%' }} />
      </div>
    </div>
  )
}
