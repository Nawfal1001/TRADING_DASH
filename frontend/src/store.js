import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // Trading mode
  tradingMode: localStorage.getItem('tradingMode') || 'paper',
  setTradingMode: (mode) => {
    localStorage.setItem('tradingMode', mode)
    set({ tradingMode: mode })
  },

  // Selected asset
  selectedTicker: 'AAPL',
  selectedType: 'stock',
  setSelected: (ticker, type) => set({ selectedTicker: ticker, selectedType: type }),

  // Portfolio
  portfolio: [],
  setPortfolio: (portfolio) => set({ portfolio }),

  // Connected brokers
  connectedBrokers: JSON.parse(localStorage.getItem('connectedBrokers') || '[]'),
  addBroker: (broker) => {
    const brokers = [...get().connectedBrokers, broker]
    localStorage.setItem('connectedBrokers', JSON.stringify(brokers))
    set({ connectedBrokers: brokers })
  },
  removeBroker: (broker) => {
    const brokers = get().connectedBrokers.filter(b => b !== broker)
    localStorage.setItem('connectedBrokers', JSON.stringify(brokers))
    set({ connectedBrokers: brokers })
  },

  // Notifications
  notifications: [],
  addNotification: (notif) => set(s => ({
    notifications: [{ ...notif, id: Date.now(), read: false }, ...s.notifications].slice(0, 50)
  })),
  markRead: (id) => set(s => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  clearNotifications: () => set({ notifications: [] }),

  // Alerts
  alerts: [],
  setAlerts: (alerts) => set({ alerts }),

  // Custom signals
  customSignals: [],
  addCustomSignal: (sig) => set(s => ({ customSignals: [...s.customSignals, sig] })),
  removeCustomSignal: (idx) => set(s => ({ customSignals: s.customSignals.filter((_, i) => i !== idx) })),

  // Watchlist
  watchlist: JSON.parse(localStorage.getItem('watchlist') || '[{"ticker":"AAPL","type":"stock"},{"ticker":"NVDA","type":"stock"},{"ticker":"BTC","type":"crypto"},{"ticker":"ETH","type":"crypto"}]'),
  addToWatchlist: (item) => {
    const wl = [...get().watchlist, item]
    localStorage.setItem('watchlist', JSON.stringify(wl))
    set({ watchlist: wl })
  },
  removeFromWatchlist: (ticker) => {
    const wl = get().watchlist.filter(w => w.ticker !== ticker)
    localStorage.setItem('watchlist', JSON.stringify(wl))
    set({ watchlist: wl })
  },
}))
