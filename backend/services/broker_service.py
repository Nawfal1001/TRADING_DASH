import os
from dotenv import load_dotenv

load_dotenv()

CONNECTED_BROKERS = {}

async def connect_broker(broker: str, api_key: str, secret_key: str = None, extra: dict = None):
    try:
        if broker == "alpaca":
            from alpaca.trading.client import TradingClient
            client = TradingClient(api_key, secret_key, paper=os.getenv("ALPACA_PAPER", "true") == "true")
            account = client.get_account()
            CONNECTED_BROKERS["alpaca"] = {"client": client, "type": "alpaca"}
            return {"status": "connected", "broker": "alpaca", "account": str(account.id), "buying_power": str(account.buying_power)}

        elif broker == "binance":
            import ccxt
            exchange = ccxt.binance({"apiKey": api_key, "secret": secret_key})
            balance = exchange.fetch_balance()
            CONNECTED_BROKERS["binance"] = {"client": exchange, "type": "binance"}
            return {"status": "connected", "broker": "binance", "usdt_balance": balance.get("USDT", {}).get("free", 0)}

        elif broker == "coinbase":
            import ccxt
            exchange = ccxt.coinbase({"apiKey": api_key, "secret": secret_key})
            CONNECTED_BROKERS["coinbase"] = {"client": exchange, "type": "coinbase"}
            return {"status": "connected", "broker": "coinbase"}

        elif broker == "kraken":
            import ccxt
            exchange = ccxt.kraken({"apiKey": api_key, "secret": secret_key})
            CONNECTED_BROKERS["kraken"] = {"client": exchange, "type": "kraken"}
            return {"status": "connected", "broker": "kraken"}

        elif broker == "custom":
            CONNECTED_BROKERS["custom"] = {"config": extra, "type": "custom"}
            return {"status": "connected", "broker": "custom", "config": extra}

        return {"status": "error", "message": f"Broker {broker} not supported"}
    except Exception as e:
        return {"status": "error", "broker": broker, "message": str(e)}

async def place_order(order: dict):
    broker = order.get("broker")
    paper = order.get("paper", True)
    ticker = order.get("ticker")
    side = order.get("side")
    qty = order.get("qty")

    if paper:
        return {
            "status": "paper_executed",
            "order_id": f"PAPER-{ticker}-{side}-{qty}",
            "ticker": ticker,
            "side": side,
            "qty": qty,
            "mode": "paper"
        }

    if broker not in CONNECTED_BROKERS:
        return {"status": "error", "message": f"Broker {broker} not connected"}

    try:
        b = CONNECTED_BROKERS[broker]
        if b["type"] == "alpaca":
            from alpaca.trading.requests import MarketOrderRequest
            from alpaca.trading.enums import OrderSide, TimeInForce
            req = MarketOrderRequest(
                symbol=ticker,
                qty=qty,
                side=OrderSide.BUY if side == "buy" else OrderSide.SELL,
                time_in_force=TimeInForce.DAY
            )
            result = b["client"].submit_order(req)
            return {"status": "executed", "order_id": str(result.id), "broker": broker}

        elif b["type"] in ["binance", "coinbase", "kraken"]:
            result = b["client"].create_order(f"{ticker}/USDT", "market", side, qty)
            return {"status": "executed", "order_id": result.get("id"), "broker": broker}

    except Exception as e:
        return {"status": "error", "message": str(e)}

async def get_positions(broker: str):
    if broker not in CONNECTED_BROKERS:
        return {"positions": [], "error": f"{broker} not connected"}
    try:
        b = CONNECTED_BROKERS[broker]
        if b["type"] == "alpaca":
            positions = b["client"].get_all_positions()
            return {"positions": [{"ticker": p.symbol, "qty": p.qty, "value": p.market_value} for p in positions]}
        elif b["type"] in ["binance", "coinbase", "kraken"]:
            balance = b["client"].fetch_balance()
            return {"positions": [{"ticker": k, "qty": v["free"]} for k, v in balance.items() if isinstance(v, dict) and v.get("free", 0) > 0]}
    except Exception as e:
        return {"positions": [], "error": str(e)}

async def get_broker_status():
    return {
        "connected": list(CONNECTED_BROKERS.keys()),
        "available": ["alpaca", "ibkr", "tda", "binance", "coinbase", "kraken", "custom"]
    }
