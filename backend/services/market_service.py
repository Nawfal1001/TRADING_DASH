import yfinance as yf
import ccxt
import pandas as pd
from datetime import datetime, timedelta

RANGE_MAP = {
    "1D": ("1d", "5m"),
    "1W": ("5d", "1h"),
    "1M": ("1mo", "1d"),
    "3M": ("3mo", "1d"),
    "1Y": ("1y", "1wk"),
}

async def get_stock_data(ticker: str, range: str = "1W"):
    try:
        period, interval = RANGE_MAP.get(range, ("5d", "1h"))
        t = yf.Ticker(ticker)
        hist = t.history(period=period, interval=interval)
        info = t.info
        prices = [round(p, 2) for p in hist["Close"].tolist()]
        labels = [str(d.date()) for d in hist.index]
        volumes = [int(v) for v in hist["Volume"].tolist()]
        price = prices[-1] if prices else 0
        prev = prices[-2] if len(prices) > 1 else price
        change = round(price - prev, 2)
        change_pct = round((change / prev) * 100, 2) if prev else 0
        return {
            "ticker": ticker,
            "type": "stock",
            "price": price,
            "change": change,
            "change_pct": change_pct,
            "volume": volumes[-1] if volumes else 0,
            "market_cap": info.get("marketCap", 0),
            "pe_ratio": info.get("trailingPE", None),
            "prices": prices,
            "volumes": volumes,
            "labels": labels,
        }
    except Exception as e:
        return {"error": str(e), "ticker": ticker}

async def get_crypto_data(symbol: str, range: str = "1W"):
    try:
        exchange = ccxt.binance()
        tf_map = {"1D": "5m", "1W": "1h", "1M": "1d", "3M": "1d", "1Y": "1w"}
        limit_map = {"1D": 288, "1W": 168, "1M": 30, "3M": 90, "1Y": 52}
        tf = tf_map.get(range, "1h")
        limit = limit_map.get(range, 168)
        pair = f"{symbol}/USDT"
        ohlcv = exchange.fetch_ohlcv(pair, tf, limit=limit)
        prices = [round(c[4], 4) for c in ohlcv]
        volumes = [round(c[5], 2) for c in ohlcv]
        labels = [datetime.fromtimestamp(c[0]/1000).strftime("%m/%d %H:%M") for c in ohlcv]
        price = prices[-1] if prices else 0
        prev = prices[-2] if len(prices) > 1 else price
        change = round(price - prev, 4)
        change_pct = round((change / prev) * 100, 2) if prev else 0
        ticker = exchange.fetch_ticker(pair)
        return {
            "ticker": symbol,
            "type": "crypto",
            "price": price,
            "change": change,
            "change_pct": change_pct,
            "volume": ticker.get("quoteVolume", 0),
            "market_cap": ticker.get("info", {}).get("marketCap", 0),
            "prices": prices,
            "volumes": volumes,
            "labels": labels,
        }
    except Exception as e:
        return {"error": str(e), "ticker": symbol}

async def search_assets(query: str):
    try:
        tickers = yf.Tickers(query)
        results = []
        for t in query.upper().split():
            try:
                info = yf.Ticker(t).info
                if info.get("regularMarketPrice"):
                    results.append({
                        "ticker": t,
                        "name": info.get("longName", t),
                        "type": "stock",
                        "price": info.get("regularMarketPrice"),
                    })
            except:
                pass
        crypto_symbols = ["BTC", "ETH", "BNB", "SOL", "ADA", "XRP"]
        for s in crypto_symbols:
            if query.upper() in s:
                results.append({"ticker": s, "name": s + "/USDT", "type": "crypto"})
        return {"results": results}
    except Exception as e:
        return {"results": [], "error": str(e)}

async def get_top_movers(asset_type: str = "all"):
    results = []
    if asset_type in ["all", "stocks"]:
        top_stocks = ["AAPL", "NVDA", "MSFT", "GOOGL", "TSLA", "META", "AMZN"]
        for t in top_stocks:
            try:
                info = yf.Ticker(t).info
                results.append({
                    "ticker": t,
                    "type": "stock",
                    "name": info.get("shortName", t),
                    "price": info.get("regularMarketPrice", 0),
                    "change_pct": info.get("regularMarketChangePercent", 0),
                })
            except:
                pass
    if asset_type in ["all", "crypto"]:
        try:
            exchange = ccxt.binance()
            tickers = exchange.fetch_tickers(["BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT", "ADA/USDT"])
            for sym, data in tickers.items():
                results.append({
                    "ticker": sym.replace("/USDT", ""),
                    "type": "crypto",
                    "name": sym,
                    "price": data.get("last", 0),
                    "change_pct": data.get("percentage", 0),
                })
        except:
            pass
    return {"movers": sorted(results, key=lambda x: abs(x.get("change_pct", 0)), reverse=True)}
