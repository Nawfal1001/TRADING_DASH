import asyncio
import json
import os
from datetime import datetime, timezone

import websockets

STOCK_UNIVERSE = [
    "AAPL","NVDA","MSFT","AMZN","META","GOOGL","TSLA","AMD","NFLX",
    "JPM","PLTR","COIN","MSTR","SMCI","AVGO","MU","QQQ","SPY","IWM"
]

CACHE = {
    "provider": "alpaca_iex",
    "connected": False,
    "updated_at": None,
    "symbols": {}
}

def _update(symbol, payload):
    CACHE["symbols"][symbol] = payload
    CACHE["updated_at"] = datetime.now(timezone.utc).isoformat()

async def _stream():
    key = os.getenv("ALPACA_API_KEY")
    secret = os.getenv("ALPACA_SECRET_KEY")
    if not key or not secret:
        CACHE["provider"] = "not_configured"
        return

    url = "wss://stream.data.alpaca.markets/v2/iex"
    while True:
        try:
            async with websockets.connect(url, ping_interval=20, ping_timeout=20) as ws:
                await ws.send(json.dumps({"action":"auth","key":key,"secret":secret}))
                await ws.send(json.dumps({
                    "action":"subscribe",
                    "bars": STOCK_UNIVERSE,
                    "trades": STOCK_UNIVERSE
                }))
                CACHE["connected"] = True

                async for raw in ws:
                    messages = json.loads(raw)
                    for msg in messages:
                        typ = msg.get("T")
                        symbol = msg.get("S")
                        if not symbol:
                            continue

                        if typ == "b":
                            _update(symbol, {
                                "ticker": symbol,
                                "type": "stock",
                                "timestamp": msg.get("t"),
                                "open": msg.get("o"),
                                "high": msg.get("h"),
                                "low": msg.get("l"),
                                "price": msg.get("c"),
                                "volume": msg.get("v"),
                                "vwap": msg.get("vw"),
                                "source": "Alpaca IEX live bar"
                            })
                        elif typ == "t":
                            existing = CACHE["symbols"].get(symbol, {})
                            existing.update({
                                "ticker": symbol,
                                "type": "stock",
                                "price": msg.get("p"),
                                "trade_size": msg.get("s"),
                                "timestamp": msg.get("t"),
                                "source": "Alpaca IEX live trade"
                            })
                            _update(symbol, existing)
        except Exception as exc:
            CACHE["connected"] = False
            CACHE["last_error"] = str(exc)
            await asyncio.sleep(5)

def start_live_stream():
    asyncio.create_task(_stream())
