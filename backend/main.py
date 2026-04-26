import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import market, signals, broker, portfolio, alerts, ai_research, scanner
from services.scanner_service import start_scheduler

app = FastAPI(title='TradeAI Platform API', version='1.1.1')

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
app.include_router(scanner.router,prefix='/api/scanner',tags=['Hourly Scanner'])

@app.on_event('startup')
async def startup():
    start_scheduler()

@app.get('/')
def root():
    return {'status':'TradeAI Platform running','cors_origins':origins}
