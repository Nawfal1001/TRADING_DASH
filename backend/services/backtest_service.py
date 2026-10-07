import math
from typing import Dict, List

import pandas as pd
import yfinance as yf


def _indicators(df: pd.DataFrame) -> pd.DataFrame:
    x = df.copy()
    close = x["Close"]
    high = x["High"]
    low = x["Low"]
    volume = x["Volume"]

    x["ema20"] = close.ewm(span=20, adjust=False).mean()
    x["ema50"] = close.ewm(span=50, adjust=False).mean()

    delta = close.diff()
    gain = delta.clip(lower=0).rolling(14).mean()
    loss = (-delta.clip(upper=0)).rolling(14).mean()
    rs = gain / loss.replace(0, pd.NA)
    x["rsi"] = 100 - (100 / (1 + rs.astype(float)))

    ema12 = close.ewm(span=12, adjust=False).mean()
    ema26 = close.ewm(span=26, adjust=False).mean()
    x["macd"] = ema12 - ema26
    x["macd_signal"] = x["macd"].ewm(span=9, adjust=False).mean()
    x["macd_hist"] = x["macd"] - x["macd_signal"]

    prev_close = close.shift(1)
    tr = pd.concat([
        high - low,
        (high - prev_close).abs(),
        (low - prev_close).abs()
    ], axis=1).max(axis=1)
    x["atr"] = tr.rolling(14).mean()
    x["vol_avg20"] = volume.rolling(20).mean()
    return x.dropna()


def backtest_symbol(symbol: str, period="60d", interval="5m", initial_cash=10000):
    df = yf.Ticker(symbol).history(period=period, interval=interval, auto_adjust=False)
    if df.empty or len(df) < 100:
        return {"ticker": symbol, "error": "Insufficient historical data"}

    df = _indicators(df)
    cash = float(initial_cash)
    equity_peak = cash
    max_drawdown = 0.0
    position = None
    trades: List[Dict] = []

    for i in range(1, len(df) - 1):
        row = df.iloc[i]
        next_row = df.iloc[i + 1]

        if position:
            stop = position["stop"]
            target = position["target"]
            exit_price = None
            reason = None

            # Conservative intrabar assumption: if both are touched, stop wins.
            if float(row["Low"]) <= stop:
                exit_price, reason = stop, "stop"
            elif float(row["High"]) >= target:
                exit_price, reason = target, "target"

            if exit_price is not None:
                pnl = (exit_price - position["entry"]) * position["qty"]
                cash += pnl
                trades.append({
                    "entry_time": position["time"],
                    "exit_time": row.name.isoformat(),
                    "entry": round(position["entry"], 4),
                    "exit": round(exit_price, 4),
                    "qty": position["qty"],
                    "pnl": round(pnl, 2),
                    "reason": reason
                })
                position = None

        if position is None:
            bullish = (
                row["ema20"] > row["ema50"]
                and row["rsi"] >= 52
                and row["rsi"] <= 72
                and row["macd_hist"] > 0
                and row["Close"] > row["ema20"]
                and row["Volume"] > row["vol_avg20"] * 1.10
            )

            if bullish and float(row["atr"]) > 0:
                entry = float(next_row["Open"])
                stop = entry - 1.0 * float(row["atr"])
                target = entry + 2.0 * float(row["atr"])
                risk_per_share = max(entry - stop, 0.01)

                # Risk 0.5% of current equity per trade, capped at available cash.
                risk_cash = cash * 0.005
                qty = math.floor(risk_cash / risk_per_share)
                if qty > 0:
                    position = {
                        "time": row.name.isoformat(),
                        "entry": entry,
                        "stop": stop,
                        "target": target,
                        "qty": qty
                    }

        mark = cash
        if position:
            mark += (float(row["Close"]) - position["entry"]) * position["qty"]
        equity_peak = max(equity_peak, mark)
        max_drawdown = max(max_drawdown, (equity_peak - mark) / equity_peak)

    if position:
        final_price = float(df.iloc[-1]["Close"])
        pnl = (final_price - position["entry"]) * position["qty"]
        cash += pnl
        trades.append({
            "entry_time": position["time"],
            "exit_time": df.iloc[-1].name.isoformat(),
            "entry": round(position["entry"], 4),
            "exit": round(final_price, 4),
            "qty": position["qty"],
            "pnl": round(pnl, 2),
            "reason": "end_of_test"
        })

    pnls = [t["pnl"] for t in trades]
    wins = [p for p in pnls if p > 0]
    losses = [p for p in pnls if p <= 0]
    gross_profit = sum(wins)
    gross_loss = abs(sum(losses))

    return {
        "ticker": symbol,
        "period": period,
        "interval": interval,
        "initial_cash": initial_cash,
        "final_cash": round(cash, 2),
        "return_pct": round((cash / initial_cash - 1) * 100, 2),
        "trades": len(trades),
        "wins": len(wins),
        "losses": len(losses),
        "win_rate_pct": round(len(wins) / len(trades) * 100, 2) if trades else 0,
        "profit_factor": round(gross_profit / gross_loss, 2) if gross_loss else None,
        "max_drawdown_pct": round(max_drawdown * 100, 2),
        "avg_trade": round(sum(pnls) / len(pnls), 2) if pnls else 0,
        "trade_log": trades[-100:]
    }


async def run_backtest(symbols: List[str], period="60d", interval="5m", initial_cash=10000):
    results = []
    for symbol in symbols:
        try:
            results.append(backtest_symbol(symbol.upper(), period, interval, initial_cash))
        except Exception as exc:
            results.append({"ticker": symbol.upper(), "error": str(exc)})

    valid = [r for r in results if "error" not in r]
    return {
        "strategy": "EMA20/EMA50 + RSI + MACD histogram + volume, 1 ATR stop / 2 ATR target",
        "results": sorted(valid, key=lambda x: x.get("return_pct", -999), reverse=True),
        "errors": [r for r in results if "error" in r]
    }
