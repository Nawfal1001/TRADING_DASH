from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.signal_service import (
    generate_signal, generate_multi_timeframe,
    get_best_opportunities, add_custom_signal,
    remove_custom_signal, list_custom_signals,
    TIMEFRAME_CONFIG
)

router = APIRouter()

class CustomSignal(BaseModel):
    name: str
    indicator: str          # RSI, MACD, EMA_CROSS, ADX, STOCHASTIC, BOLLINGER, SUPERTREND, OBV, VWAP, VOLUME
    condition: str          # above | below | crosses_above | crosses_below
    threshold: float
    asset_type: str         # stock | crypto | all
    signal_type: str = "BUY"   # BUY | SELL
    weight: int = 1         # 1-5, higher = more influence

# ── Static routes FIRST to avoid /{ticker} swallowing them ──

@router.get("/timeframes")
async def get_timeframes():
    """Returns all available timeframes and their configs."""
    return {
        "timeframes": {k: {"label": v["label"]} for k, v in TIMEFRAME_CONFIG.items()}
    }

@router.get("/opportunities/best")
async def best_opportunities(asset_type: str = "all", limit: int = 10, timeframe: str = "swing"):
    return await get_best_opportunities(asset_type, limit, timeframe)

@router.get("/custom/list")
async def get_custom_signals():
    return await list_custom_signals()

@router.post("/custom")
async def create_custom_signal(signal: CustomSignal):
    return await add_custom_signal(signal.dict())

@router.delete("/custom/{index}")
async def delete_custom_signal(index: int):
    return await remove_custom_signal(index)

# ── Dynamic routes LAST ──

@router.get("/multi/{ticker}")
async def multi_timeframe(ticker: str, asset_type: str = "stock"):
    """Runs signal across all 4 timeframes and returns consensus."""
    return await generate_multi_timeframe(ticker.upper(), asset_type)

@router.get("/{ticker}")
async def get_signal(ticker: str, asset_type: str = "stock", timeframe: str = "swing"):
    """
    Generate a full signal for a ticker.
    timeframe: scalping | intraday | swing | position
    asset_type: stock | crypto
    """
    return await generate_signal(ticker.upper(), asset_type, timeframe)
