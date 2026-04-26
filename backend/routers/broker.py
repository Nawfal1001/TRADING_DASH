from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.broker_service import connect_broker, place_order, get_positions, get_broker_status

router = APIRouter()

class BrokerConfig(BaseModel):
    broker: str
    api_key: str
    secret_key: Optional[str] = None
    extra: Optional[dict] = None

class OrderRequest(BaseModel):
    broker: str
    ticker: str
    side: str
    qty: float
    order_type: str = "market"
    limit_price: Optional[float] = None
    paper: bool = True

@router.post("/connect")
async def connect(config: BrokerConfig):
    return await connect_broker(config.broker, config.api_key, config.secret_key, config.extra)

@router.get("/status")
async def status():
    return await get_broker_status()

@router.post("/order")
async def order(req: OrderRequest):
    return await place_order(req.dict())

@router.get("/positions/{broker}")
async def positions(broker: str):
    return await get_positions(broker)

@router.get("/brokers/available")
async def available_brokers():
    return {
        "brokers": [
            {"id": "alpaca", "name": "Alpaca", "type": "stocks", "paper": True},
            {"id": "ibkr", "name": "Interactive Brokers", "type": "stocks+options", "paper": True},
            {"id": "tda", "name": "TD Ameritrade", "type": "stocks+options", "paper": False},
            {"id": "binance", "name": "Binance", "type": "crypto", "paper": False},
            {"id": "coinbase", "name": "Coinbase", "type": "crypto", "paper": False},
            {"id": "kraken", "name": "Kraken", "type": "crypto", "paper": False},
            {"id": "custom", "name": "Custom API", "type": "any", "paper": False},
        ]
    }
