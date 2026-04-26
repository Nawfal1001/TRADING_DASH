from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.portfolio_service import get_portfolio, add_position, remove_position, get_pnl

router = APIRouter()

class Position(BaseModel):
    ticker: str
    asset_type: str
    qty: float
    avg_price: float
    broker: Optional[str] = "paper"

@router.get("/")
async def portfolio():
    return await get_portfolio()

@router.post("/position")
async def add(pos: Position):
    return await add_position(pos.dict())

@router.delete("/position/{ticker}")
async def remove(ticker: str):
    return await remove_position(ticker)

@router.get("/pnl")
async def pnl():
    return await get_pnl()

@router.get("/history")
async def history():
    return {"history": []}
