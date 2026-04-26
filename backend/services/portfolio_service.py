import yfinance as yf
import ccxt

PORTFOLIO = []

async def get_portfolio():
    enriched = []
    total_value = 0
    total_cost = 0
    for pos in PORTFOLIO:
        try:
            if pos["asset_type"] == "stock":
                info = yf.Ticker(pos["ticker"]).info
                current_price = info.get("regularMarketPrice", pos["avg_price"])
            else:
                exchange = ccxt.binance()
                ticker = exchange.fetch_ticker(f"{pos['ticker']}/USDT")
                current_price = ticker.get("last", pos["avg_price"])
            value = round(current_price * pos["qty"], 2)
            cost = round(pos["avg_price"] * pos["qty"], 2)
            pnl = round(value - cost, 2)
            pnl_pct = round((pnl / cost) * 100, 2) if cost else 0
            total_value += value
            total_cost += cost
            enriched.append({**pos, "current_price": current_price, "value": value, "pnl": pnl, "pnl_pct": pnl_pct})
        except:
            enriched.append({**pos, "current_price": pos["avg_price"], "value": pos["avg_price"] * pos["qty"], "pnl": 0, "pnl_pct": 0})
    total_pnl = round(total_value - total_cost, 2)
    total_pnl_pct = round((total_pnl / total_cost) * 100, 2) if total_cost else 0
    return {"positions": enriched, "total_value": round(total_value, 2), "total_cost": round(total_cost, 2), "total_pnl": total_pnl, "total_pnl_pct": total_pnl_pct}

async def add_position(pos: dict):
    for p in PORTFOLIO:
        if p["ticker"] == pos["ticker"]:
            total_qty = p["qty"] + pos["qty"]
            p["avg_price"] = round((p["avg_price"] * p["qty"] + pos["avg_price"] * pos["qty"]) / total_qty, 4)
            p["qty"] = total_qty
            return {"status": "updated", "position": p}
    PORTFOLIO.append(pos)
    return {"status": "added", "position": pos}

async def remove_position(ticker: str):
    global PORTFOLIO
    PORTFOLIO = [p for p in PORTFOLIO if p["ticker"] != ticker.upper()]
    return {"status": "removed", "ticker": ticker}

async def get_pnl():
    portfolio = await get_portfolio()
    return {"total_pnl": portfolio["total_pnl"], "total_pnl_pct": portfolio["total_pnl_pct"], "total_value": portfolio["total_value"]}
