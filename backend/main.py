import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import market, signals, broker, portfolio, alerts, ai_research, scanner, backtest
from services.scanner_service import start_scheduler
from services.live_data_service import start_live_stream

app = FastAPI(title='TradeAI Platform API', version='1.2.0')

origins = ['http://localhost:5173', 'http://localhost:3000']
extra = os.getenv('FRONTEND_URLS', '')
if extra:
    origins.extend([x.strip() for x in extra.split(',') if x.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

app.include_router(market.router,prefix='/api/market',tags=['Market Data'])
app.include_router(signals.router,prefix='/api/signals',tags=['Signals'])
app.include_router(broker.router,prefix='/api/broker',tags=['Brokers'])
app.include_router(portfolio.router,prefix='/api/portfolio',tags=['Portfolio'])
app.include_router(alerts.router,prefix='/api/alerts',tags=['Alerts'])
app.include_router(ai_research.router,prefix='/api/ai',tags=['AI Research'])
app.include_router(scanner.router,prefix='/api/scanner',tags=['Scanner'])
app.include_router(backtest.router,prefix='/api/backtest',tags=['Backtesting'])

@app.on_event('startup')
async def startup():
    start_scheduler()
    start_live_stream()

@app.get('/')
def root():
    return {
        'status':'TradeAI Platform running',
        'live_data': 'Alpaca IEX websocket' if os.getenv('ALPACA_API_KEY') else 'not configured',
        'cors_origins':origins
    }
