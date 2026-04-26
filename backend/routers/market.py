from fastapi import APIRouter, Query
from services.market_service import get_stock_data, get_crypto_data, search_assets, get_top_movers

router = APIRouter()

@router.get("/stock/{ticker}")
async def stock_data(ticker: str, range: str = "1W"):
    return await get_stock_data(ticker.upper(), range)

@router.get("/crypto/{symbol}")
async def crypto_data(symbol: str, range: str = "1W"):
    return await get_crypto_data(symbol.upper(), range)

@router.get("/search")
async def search(q: str = Query(..., min_length=1)):
    return await search_assets(q)

@router.get("/top-movers")
async def top_movers(asset_type: str = "all"):
    return await get_top_movers(asset_type)

@router.get("/overview")
async def market_overview():
    stocks = await get_top_movers("stocks")
    crypto = await get_top_movers("crypto")
    return {"stocks": stocks, "crypto": crypto}
