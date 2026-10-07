from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List

from services.backtest_service import run_backtest

router = APIRouter()

class BacktestRequest(BaseModel):
    symbols: List[str] = Field(default=["AAPL","NVDA","MSFT","AMZN","META","TSLA","AMD","PLTR","COIN","MSTR"])
    period: str = "60d"
    interval: str = "5m"
    initial_cash: float = 10000

@router.post("/run")
async def backtest(req: BacktestRequest):
    return await run_backtest(req.symbols, req.period, req.interval, req.initial_cash)
