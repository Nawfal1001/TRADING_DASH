from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import market, signals, broker, portfolio, alerts, ai_research

app = FastAPI(title="TradeAI Platform API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market.router, prefix="/api/market", tags=["Market Data"])
app.include_router(signals.router, prefix="/api/signals", tags=["Signals"])
app.include_router(broker.router, prefix="/api/broker", tags=["Brokers"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["Portfolio"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(ai_research.router, prefix="/api/ai", tags=["AI Research"])

@app.get("/")
def root():
    return {"status": "TradeAI Platform running"}
