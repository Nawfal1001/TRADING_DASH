# 🚀 TradeAI Platform

An AI-powered trading research platform with stocks, crypto, multi-broker support, and Gemini Flash signals.

## ✨ Features

- 📊 **Live stock & crypto charts** (yfinance + CCXT)
- 🤖 **AI signals** — RSI + MACD + Gemini Flash combined
- 🔌 **Multi-broker support** — Alpaca, IBKR, TD Ameritrade, Binance, Coinbase, Kraken + Custom API
- 💼 **Portfolio tracker** with real P&L
- 🔔 **Alerts** — In-app, Telegram, Email
- 📄 **Paper trading** mode (switch to live when ready)
- 🌐 **English + French** support
- 🔍 **AI best trades finder** powered by Gemini Flash

---

## 🛠️ Setup

### 1. Clone the repo
```bash
git clone https://github.com/Nawfal1001/tradeai-platform.git
cd tradeai-platform
```

### 2. Backend setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your API keys
uvicorn main:app --reload
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## 🔑 Required API Keys

| Service | Where to get | Required? |
|---|---|---|
| **Gemini Flash** | [aistudio.google.com](https://aistudio.google.com) | ✅ For AI features |
| **Alpaca** | [alpaca.markets](https://alpaca.markets) | For stock trading |
| **Binance** | [binance.com/api](https://binance.com/api) | For crypto trading |
| **Telegram Bot** | @BotFather on Telegram | For alerts |

---

## 📁 Project Structure

```
tradeai-platform/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── requirements.txt
│   ├── .env.example
│   ├── routers/             # API routes
│   │   ├── market.py
│   │   ├── signals.py
│   │   ├── broker.py
│   │   ├── portfolio.py
│   │   ├── alerts.py
│   │   └── ai_research.py
│   └── services/            # Business logic
│       ├── market_service.py
│       ├── signal_service.py
│       ├── broker_service.py
│       ├── portfolio_service.py
│       ├── alert_service.py
│       └── ai_service.py
└── frontend/
    ├── src/
    │   ├── pages/           # Dashboard, Portfolio, Signals, Research, Brokers, Alerts, Settings
    │   ├── components/      # Layout, shared components
    │   ├── utils/api.js     # API client
    │   ├── store.js         # Zustand global state
    │   └── i18n/            # EN + FR translations
    └── package.json
```

---

## 🚦 Trading Modes

- **Paper Trading** (default) — Simulates trades, no real money
- **Live Trading** — Executes real orders via broker APIs (switch in Settings)

---

## ⚠️ Disclaimer

This platform is for educational and research purposes only. Always do your own research before making any trading decisions. Never trade with money you cannot afford to lose.
