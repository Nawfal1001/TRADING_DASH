from fastapi import APIRouter
from pydantic import BaseModel
from services.ai_service import research_asset, find_best_trades, analyze_news

router = APIRouter()

class ResearchRequest(BaseModel):
    query: str
    ticker: Optional[str] = None
    asset_type: str = "stock"

from typing import Optional

@router.post("/research")
async def research(req: ResearchRequest):
    return await research_asset(req.query, req.ticker, req.asset_type)

@router.get("/best-trades")
async def best_trades(asset_type: str = "all", risk: str = "medium"):
    return await find_best_trades(asset_type, risk)

@router.get("/news-analysis/{ticker}")
async def news_analysis(ticker: str):
    return await analyze_news(ticker)
