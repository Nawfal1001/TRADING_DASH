"""
TradeAI — Professional Signal Engine
=====================================
Supports:
  - Multi-timeframe analysis (scalping → position trading)
  - 12 built-in indicators with weighted scoring
  - Trend + Momentum + Mean-Reversion combined strategy
  - Custom formula builder (user-defined rules)
  - AI confirmation layer (Gemini Flash)
  - Entry / Stop-Loss / Take-Profit calculator
"""

import pandas as pd
import numpy as np
import yfinance as yf
import ccxt
import ta
import asyncio
from functools import partial
from services.ai_service import get_ai_signal

# ─────────────────────────────────────────────
# CUSTOM SIGNALS STORE (in-memory)
# ─────────────────────────────────────────────
CUSTOM_SIGNALS = []

# ─────────────────────────────────────────────
# TIMEFRAME CONFIG
# ─────────────────────────────────────────────
TIMEFRAME_CONFIG = {
    "scalping":  {"label":"Scalping (5m)","yf_period":"5d","yf_interval":"5m","ccxt_tf":"5m","ccxt_limit":200,"min_bars":50,"atr_period":14,"sl_atr_mult":1.0,"tp_atr_mult":1.5},
    "intraday":  {"label":"Day Trading (1h)","yf_period":"60d","yf_interval":"1h","ccxt_tf":"1h","ccxt_limit":200,"min_bars":50,"atr_period":14,"sl_atr_mult":1.5,"tp_atr_mult":2.5},
    "swing":     {"label":"Swing Trading (1d)","yf_period":"6mo","yf_interval":"1d","ccxt_tf":"1d","ccxt_limit":180,"min_bars":60,"atr_period":14,"sl_atr_mult":2.0,"tp_atr_mult":3.0},
    "position":  {"label":"Position Trading (1w)","yf_period":"2y","yf_interval":"1wk","ccxt_tf":"1w","ccxt_limit":100,"min_bars":40,"atr_period":14,"sl_atr_mult":3.0,"tp_atr_mult":6.0},
}

# ─────────────────────────────────────────────
# INDICATOR WEIGHTS (sum = 100)
# ─────────────────────────────────────────────
INDICATOR_WEIGHTS = {
    "RSI":12,"MACD":12,"EMA_CROSS":10,"BOLLINGER":8,
    "STOCHASTIC":8,"ADX":8,"VWAP":8,"OBV":7,
    "SUPERTREND":10,"ICHIMOKU":8,"VOLUME":5,"ATR_VOLATILITY":4,
}

# ─────────────────────────────────────────────
# DATA FETCHING
# ─────────────────────────────────────────────
def _fetch_stock(ticker, period, interval):
    return yf.Ticker(ticker).history(period=period, interval=interval)

def _fetch_crypto(ticker, tf, limit):
    return ccxt.binance().fetch_ohlcv(f"{ticker}/USDT", tf, limit=limit)

async def fetch_ohlcv(ticker, asset_type, tf_config):
    loop = asyncio.get_event_loop()
    if asset_type == "stock":
        hist = await loop.run_in_executor(None, partial(_fetch_stock, ticker, tf_config["yf_period"], tf_config["yf_interval"]))
        if hist.empty or len(hist) < tf_config["min_bars"]:
            return pd.DataFrame()
        df = hist[["Open","High","Low","Close","Volume"]].copy()
        df.columns = ["open","high","low","close","volume"]
        return df.dropna()
    else:
        raw = await loop.run_in_executor(None, partial(_fetch_crypto, ticker, tf_config["ccxt_tf"], tf_config["ccxt_limit"]))
        if not raw or len(raw) < tf_config["min_bars"]:
            return pd.DataFrame()
        df = pd.DataFrame(raw, columns=["ts","open","high","low","close","volume"])
        return df[["open","high","low","close","volume"]].dropna()

def safe_last(series, default=0.0):
    s = series.dropna()
    return float(s.iloc[-1]) if not s.empty else default

# ─────────────────────────────────────────────
# INDICATORS
# ─────────────────────────────────────────────
def calc_rsi(closes):
    v = safe_last(ta.momentum.RSIIndicator(closes).rsi(), 50.0)
    if v < 30:   s,sig,r = +2,"BUY",f"Oversold (RSI={v:.1f})"
    elif v < 40: s,sig,r = +1,"WEAK BUY",f"Near oversold (RSI={v:.1f})"
    elif v > 70: s,sig,r = -2,"SELL",f"Overbought (RSI={v:.1f})"
    elif v > 60: s,sig,r = -1,"WEAK SELL",f"Near overbought (RSI={v:.1f})"
    else:        s,sig,r = 0,"NEUTRAL",f"Neutral (RSI={v:.1f})"
    return {"indicator":"RSI","value":round(v,2),"signal":sig,"reason":r,"score":s}

def calc_macd(closes):
    obj = ta.trend.MACD(closes)
    macd = safe_last(obj.macd()); sig_line = safe_last(obj.macd_signal()); hist = safe_last(obj.macd_diff())
    if macd > sig_line and hist > 0:   s,sig,r = +2,"BUY","Bullish MACD crossover"
    elif macd > sig_line:              s,sig,r = +1,"WEAK BUY","MACD above signal"
    elif macd < sig_line and hist < 0: s,sig,r = -2,"SELL","Bearish MACD crossover"
    elif macd < sig_line:              s,sig,r = -1,"WEAK SELL","MACD below signal"
    else:                              s,sig,r = 0,"NEUTRAL","No MACD signal"
    return {"indicator":"MACD","value":round(macd,4),"signal":sig,"reason":r,"score":s}

def calc_ema_cross(closes):
    e9  = safe_last(ta.trend.EMAIndicator(closes,9).ema_indicator())
    e21 = safe_last(ta.trend.EMAIndicator(closes,21).ema_indicator())
    e50 = safe_last(ta.trend.EMAIndicator(closes,50).ema_indicator())
    price = float(closes.iloc[-1])
    if e9 > e21 > e50 and price > e9:   s,sig,r = +2,"BUY","Golden EMA stack 9>21>50"
    elif e9 > e21 and price > e21:       s,sig,r = +1,"WEAK BUY","EMA9 above EMA21"
    elif e9 < e21 < e50 and price < e9: s,sig,r = -2,"SELL","Death EMA stack 9<21<50"
    elif e9 < e21 and price < e21:       s,sig,r = -1,"WEAK SELL","EMA9 below EMA21"
    else:                                s,sig,r = 0,"NEUTRAL","Mixed EMA signals"
    return {"indicator":"EMA_CROSS","value":round(e9,4),"signal":sig,"reason":r,"score":s}

def calc_bollinger(closes, highs, lows):
    bb = ta.volatility.BollingerBands(closes)
    upper = safe_last(bb.bollinger_hband()); lower = safe_last(bb.bollinger_lband()); mid = safe_last(bb.bollinger_mavg())
    price = float(closes.iloc[-1])
    pct_b = (price-lower)/(upper-lower) if (upper-lower)>0 else 0.5
    width = (upper-lower)/mid if mid>0 else 0
    if price < lower:   s,sig,r = +2,"BUY",f"Below lower band (%B={pct_b:.2f})"
    elif pct_b < 0.2:   s,sig,r = +1,"WEAK BUY",f"Near lower band (%B={pct_b:.2f})"
    elif price > upper: s,sig,r = -2,"SELL",f"Above upper band (%B={pct_b:.2f})"
    elif pct_b > 0.8:   s,sig,r = -1,"WEAK SELL",f"Near upper band (%B={pct_b:.2f})"
    else:               s,sig,r = 0,"NEUTRAL",f"Inside bands (%B={pct_b:.2f})"
    return {"indicator":"BOLLINGER","value":round(pct_b,3),"signal":sig,"reason":r,"score":s,"bb_width":round(width,4)}

def calc_stochastic(highs, lows, closes):
    stoch = ta.momentum.StochasticOscillator(highs,lows,closes)
    k = safe_last(stoch.stoch(),50.0); d = safe_last(stoch.stoch_signal(),50.0)
    if k<20 and d<20 and k>d:   s,sig,r = +2,"BUY",f"Stoch oversold+K>D ({k:.1f})"
    elif k<20:                   s,sig,r = +1,"WEAK BUY",f"Stoch oversold ({k:.1f})"
    elif k>80 and d>80 and k<d: s,sig,r = -2,"SELL",f"Stoch overbought+K<D ({k:.1f})"
    elif k>80:                   s,sig,r = -1,"WEAK SELL",f"Stoch overbought ({k:.1f})"
    else:                        s,sig,r = 0,"NEUTRAL",f"Stoch neutral ({k:.1f})"
    return {"indicator":"STOCHASTIC","value":round(k,2),"signal":sig,"reason":r,"score":s}

def calc_adx(highs, lows, closes):
    obj = ta.trend.ADXIndicator(highs,lows,closes)
    adx=safe_last(obj.adx(),20.0); dip=safe_last(obj.adx_pos(),20.0); dim=safe_last(obj.adx_neg(),20.0)
    if adx>25 and dip>dim:   s,sig,r = +2,"BUY",f"Strong uptrend (ADX={adx:.1f})"
    elif adx>20 and dip>dim: s,sig,r = +1,"WEAK BUY",f"Moderate uptrend (ADX={adx:.1f})"
    elif adx>25 and dim>dip: s,sig,r = -2,"SELL",f"Strong downtrend (ADX={adx:.1f})"
    elif adx>20 and dim>dip: s,sig,r = -1,"WEAK SELL",f"Moderate downtrend (ADX={adx:.1f})"
    else:                    s,sig,r = 0,"NEUTRAL",f"No trend (ADX={adx:.1f})"
    return {"indicator":"ADX","value":round(adx,2),"signal":sig,"reason":r,"score":s}

def calc_vwap(highs, lows, closes, volumes):
    try:
        vwap = safe_last(ta.volume.VolumeWeightedAveragePrice(highs,lows,closes,volumes).volume_weighted_average_price())
        price = float(closes.iloc[-1]); pct = (price-vwap)/vwap*100 if vwap>0 else 0
        if pct>1:    s,sig,r = -1,"WEAK SELL",f"Price {pct:.1f}% above VWAP"
        elif pct<-1: s,sig,r = +1,"WEAK BUY",f"Price {pct:.1f}% below VWAP"
        elif pct>0:  s,sig,r = +1,"WEAK BUY",f"Just above VWAP ({pct:.1f}%)"
        else:        s,sig,r = -1,"WEAK SELL",f"Just below VWAP ({pct:.1f}%)"
        return {"indicator":"VWAP","value":round(vwap,4),"signal":sig,"reason":r,"score":s}
    except:
        return {"indicator":"VWAP","value":0,"signal":"NEUTRAL","reason":"VWAP unavailable","score":0}

def calc_obv(closes, volumes):
    obv = ta.volume.OnBalanceVolumeIndicator(closes,volumes).on_balance_volume()
    obv_ema = obv.ewm(span=20).mean()
    v = safe_last(obv); v_ema = safe_last(obv_ema)
    s,sig,r = (+1,"BUY","OBV above EMA — buying pressure") if v>v_ema else (-1,"SELL","OBV below EMA — selling pressure")
    return {"indicator":"OBV","value":round(v,0),"signal":sig,"reason":r,"score":s}

def calc_supertrend(highs, lows, closes, period=10, mult=3.0):
    try:
        atr = ta.volatility.AverageTrueRange(highs,lows,closes,window=period).average_true_range()
        hl2 = (highs+lows)/2
        ub = hl2+mult*atr; lb = hl2-mult*atr
        direction = pd.Series(index=closes.index,dtype=float)
        supertrend = pd.Series(index=closes.index,dtype=float)
        for i in range(1,len(closes)):
            if closes.iloc[i]>ub.iloc[i-1]: direction.iloc[i]=1
            elif closes.iloc[i]<lb.iloc[i-1]: direction.iloc[i]=-1
            else: direction.iloc[i] = direction.iloc[i-1] if not pd.isna(direction.iloc[i-1]) else 1
            supertrend.iloc[i] = lb.iloc[i] if direction.iloc[i]==1 else ub.iloc[i]
        d = int(direction.dropna().iloc[-1]) if not direction.dropna().empty else 0
        sv = safe_last(supertrend)
        s,sig,r = (+2,"BUY",f"SuperTrend bullish (support={sv:.2f})") if d==1 else (-2,"SELL",f"SuperTrend bearish (resistance={sv:.2f})")
        return {"indicator":"SUPERTREND","value":round(sv,4),"signal":sig,"reason":r,"score":s}
    except:
        return {"indicator":"SUPERTREND","value":0,"signal":"NEUTRAL","reason":"SuperTrend error","score":0}

def calc_ichimoku(highs, lows, closes):
    try:
        ich = ta.trend.IchimokuIndicator(highs,lows)
        tk=safe_last(ich.ichimoku_conversion_line()); kj=safe_last(ich.ichimoku_base_line())
        sa=safe_last(ich.ichimoku_a()); sb=safe_last(ich.ichimoku_b())
        price=float(closes.iloc[-1]); top=max(sa,sb); bot=min(sa,sb)
        if price>top and tk>kj:   s,sig,r = +2,"BUY","Above cloud + TK bullish"
        elif price>top:            s,sig,r = +1,"WEAK BUY","Above Ichimoku cloud"
        elif price<bot and tk<kj: s,sig,r = -2,"SELL","Below cloud + TK bearish"
        elif price<bot:            s,sig,r = -1,"WEAK SELL","Below Ichimoku cloud"
        else:                      s,sig,r = 0,"NEUTRAL","Inside Ichimoku cloud"
        return {"indicator":"ICHIMOKU","value":round(tk,4),"signal":sig,"reason":r,"score":s}
    except:
        return {"indicator":"ICHIMOKU","value":0,"signal":"NEUTRAL","reason":"Ichimoku error","score":0}

def calc_volume(closes, volumes):
    avg = float(volumes.rolling(20).mean().iloc[-1]) if len(volumes)>=20 else float(volumes.mean())
    now = float(volumes.iloc[-1]); chg = float(closes.pct_change().iloc[-1]) if len(closes)>1 else 0
    ratio = now/avg if avg>0 else 1
    if ratio>2.0 and chg>0:   s,sig,r = +1,"ALERT",f"High volume breakout ({ratio:.1f}x)"
    elif ratio>2.0 and chg<0: s,sig,r = -1,"ALERT",f"High volume selloff ({ratio:.1f}x)"
    else:                      s,sig,r = 0,"NEUTRAL",f"Normal volume ({ratio:.1f}x)"
    return {"indicator":"VOLUME","value":round(ratio,2),"signal":sig,"reason":r,"score":s}

def calc_atr(highs, lows, closes, period=14):
    atr = safe_last(ta.volatility.AverageTrueRange(highs,lows,closes,window=period).average_true_range())
    price = float(closes.iloc[-1]); pct = atr/price*100 if price>0 else 0
    r = f"High volatility (ATR={pct:.1f}%)" if pct>3 else f"Low volatility (ATR={pct:.1f}%)"
    return {"indicator":"ATR_VOLATILITY","value":round(atr,4),"signal":"INFO","reason":r,"score":0,"atr_pct":round(pct,2)}

# ─────────────────────────────────────────────
# CUSTOM FORMULA EVALUATOR
# ─────────────────────────────────────────────
def evaluate_custom_signals(results_map):
    fired = []
    vals = {r["indicator"]: r["value"] for r in results_map.values()}
    for cs in CUSTOM_SIGNALS:
        try:
            ind=cs.get("indicator",""); cond=cs.get("condition",""); thresh=float(cs.get("threshold",0))
            weight=int(cs.get("weight",1)); val=vals.get(ind)
            if val is None: continue
            triggered = (cond=="above" and val>thresh) or (cond=="below" and val<thresh) or \
                        (cond=="crosses_above" and val>thresh) or (cond=="crosses_below" and val<thresh)
            if triggered:
                stype = cs.get("signal_type","BUY")
                fired.append({"indicator":cs["name"],"value":val,"signal":stype,
                              "reason":f"Custom: {ind} {cond} {thresh}",
                              "score":weight if stype=="BUY" else -weight,"weight":weight})
        except: pass
    return fired

# ─────────────────────────────────────────────
# ENTRY / SL / TP CALCULATOR
# ─────────────────────────────────────────────
def calc_trade_levels(price, atr, signal, sl_mult, tp_mult):
    is_buy = "BUY" in signal
    sl  = round(price - atr*sl_mult,  4) if is_buy else round(price + atr*sl_mult,  4)
    tp1 = round(price + atr*tp_mult,  4) if is_buy else round(price - atr*tp_mult,  4)
    tp2 = round(price + atr*tp_mult*1.5, 4) if is_buy else round(price - atr*tp_mult*1.5, 4)
    tp3 = round(price + atr*tp_mult*2.0, 4) if is_buy else round(price - atr*tp_mult*2.0, 4)
    rr  = round(abs(tp1-price)/abs(price-sl),2) if abs(price-sl)>0 else 0
    return {"entry":round(price,4),"stop_loss":sl,"take_profit_1":tp1,"take_profit_2":tp2,"take_profit_3":tp3,"risk_reward":rr}

# ─────────────────────────────────────────────
# WEIGHTED SCORING ENGINE
# Formula: score = Σ(indicator_score × weight) / Σ(max_score × weight)  × 100
# Result normalized to [-100, +100]
# ─────────────────────────────────────────────
def compute_final_signal(indicator_list, custom_list, ai_score):
    raw = 0; mx = 0
    for r in indicator_list:
        w = INDICATOR_WEIGHTS.get(r["indicator"], 5)
        raw += r["score"] * w
        mx  += 2 * w
    for r in custom_list:
        w = r.get("weight", 1)
        raw += r["score"] * w
        mx  += 2 * w
    raw += ai_score * 10; mx += 10
    norm = max(-100, min(100, (raw/mx*100) if mx>0 else 0))
    if norm>=60:    sig="STRONG BUY"
    elif norm>=25:  sig="BUY"
    elif norm<=-60: sig="STRONG SELL"
    elif norm<=-25: sig="SELL"
    else:           sig="HOLD"
    conf = min(98, int(abs(norm)))
    return sig, conf, round(norm,1)

# ─────────────────────────────────────────────
# MAIN SIGNAL GENERATOR
# ─────────────────────────────────────────────
async def generate_signal(ticker, asset_type="stock", timeframe="swing"):
    tf = TIMEFRAME_CONFIG.get(timeframe, TIMEFRAME_CONFIG["swing"])
    try:
        df = await fetch_ohlcv(ticker, asset_type, tf)
        if df.empty:
            return {"error":"Not enough data","ticker":ticker,"signal":"UNKNOWN","timeframe":timeframe}

        closes=df["close"]; highs=df["high"]; lows=df["low"]; volumes=df["volume"]
        price = float(closes.iloc[-1])

        results_map = {
            "RSI":           calc_rsi(closes),
            "MACD":          calc_macd(closes),
            "EMA_CROSS":     calc_ema_cross(closes),
            "BOLLINGER":     calc_bollinger(closes,highs,lows),
            "STOCHASTIC":    calc_stochastic(highs,lows,closes),
            "ADX":           calc_adx(highs,lows,closes),
            "VWAP":          calc_vwap(highs,lows,closes,volumes),
            "OBV":           calc_obv(closes,volumes),
            "SUPERTREND":    calc_supertrend(highs,lows,closes),
            "ICHIMOKU":      calc_ichimoku(highs,lows,closes),
            "VOLUME":        calc_volume(closes,volumes),
            "ATR_VOLATILITY":calc_atr(highs,lows,closes,tf["atr_period"]),
        }

        custom_results = evaluate_custom_signals(results_map)

        rsi_val = results_map["RSI"]["value"]; macd_val = results_map["MACD"]["value"]
        ai_signal = await get_ai_signal(ticker, asset_type, rsi_val, macd_val, price)
        ai_score = 1 if ai_signal.get("sentiment")=="bullish" else -1 if ai_signal.get("sentiment")=="bearish" else 0

        indicator_list = list(results_map.values())
        final_signal, confidence, norm_score = compute_final_signal(indicator_list, custom_results, ai_score)

        atr_val = results_map["ATR_VOLATILITY"]["value"]
        trade_levels = calc_trade_levels(price, atr_val, final_signal, tf["sl_atr_mult"], tf["tp_atr_mult"])

        # Strategy sub-scores
        def sub(keys):
            s=sum(results_map[k]["score"] for k in keys if k in results_map)
            m=sum(2 for k in keys if k in results_map)
            return round(s/m*100,1) if m>0 else 0

        return {
            "ticker":ticker,"asset_type":asset_type,"timeframe":timeframe,
            "timeframe_label":tf["label"],"signal":final_signal,"confidence":confidence,
            "normalized_score":norm_score,"price":round(price,4),
            "indicators":indicator_list+custom_results,
            "strategy_scores":{"trend":sub(["EMA_CROSS","ADX","SUPERTREND","ICHIMOKU"]),
                               "momentum":sub(["RSI","MACD","STOCHASTIC"]),
                               "reversion":sub(["BOLLINGER","VWAP"]),
                               "volume":sub(["OBV","VOLUME"])},
            "trade_levels":trade_levels,"ai_analysis":ai_signal,
            "custom_signals_fired":len(custom_results),
        }
    except Exception as e:
        return {"error":str(e),"ticker":ticker,"signal":"UNKNOWN","timeframe":timeframe}

# ─────────────────────────────────────────────
# MULTI-TIMEFRAME CONSENSUS
# ─────────────────────────────────────────────
async def generate_multi_timeframe(ticker, asset_type="stock"):
    timeframes = ["scalping","intraday","swing","position"]
    results = await asyncio.gather(*[generate_signal(ticker,asset_type,tf) for tf in timeframes], return_exceptions=True)
    weights = {"scalping":1,"intraday":2,"swing":3,"position":2}
    tf_signals = {}; total_w=0; total_s=0
    for tf,res in zip(timeframes,results):
        if isinstance(res,dict) and "error" not in res:
            tf_signals[tf]={"signal":res["signal"],"confidence":res["confidence"],"score":res["normalized_score"]}
            w=weights.get(tf,1); total_s+=res["normalized_score"]*w; total_w+=w
    cs = total_s/total_w if total_w else 0
    if cs>=50: consensus="STRONG BUY"
    elif cs>=20: consensus="BUY"
    elif cs<=-50: consensus="STRONG SELL"
    elif cs<=-20: consensus="SELL"
    else: consensus="HOLD"
    return {"ticker":ticker,"asset_type":asset_type,"consensus_signal":consensus,"consensus_score":round(cs,1),"timeframes":tf_signals}

# ─────────────────────────────────────────────
# OPPORTUNITY SCANNER
# ─────────────────────────────────────────────
async def get_best_opportunities(asset_type="all", limit=10, timeframe="swing"):
    watchlist=[]
    if asset_type in ["all","stocks"]:
        watchlist+=[("AAPL","stock"),("NVDA","stock"),("MSFT","stock"),("GOOGL","stock"),
                    ("TSLA","stock"),("META","stock"),("AMZN","stock"),("AMD","stock"),
                    ("JPM","stock"),("NFLX","stock")]
    if asset_type in ["all","crypto"]:
        watchlist+=[("BTC","crypto"),("ETH","crypto"),("BNB","crypto"),("SOL","crypto"),
                    ("ADA","crypto"),("XRP","crypto"),("DOGE","crypto"),("AVAX","crypto")]
    results = await asyncio.gather(*[generate_signal(t,a,timeframe) for t,a in watchlist], return_exceptions=True)
    valid = [r for r in results if isinstance(r,dict) and "error" not in r]
    valid.sort(key=lambda x:x.get("confidence",0),reverse=True)
    return {"opportunities":valid[:limit],"timeframe":timeframe}

# ─────────────────────────────────────────────
# CUSTOM SIGNAL CRUD
# ─────────────────────────────────────────────
async def add_custom_signal(signal):
    signal.setdefault("weight",1); signal.setdefault("signal_type","BUY")
    CUSTOM_SIGNALS.append(signal)
    return {"status":"added","signal":signal,"total":len(CUSTOM_SIGNALS)}

async def remove_custom_signal(index):
    if 0<=index<len(CUSTOM_SIGNALS):
        removed=CUSTOM_SIGNALS.pop(index)
        return {"status":"removed","signal":removed}
    return {"status":"error","message":"Index out of range"}

async def list_custom_signals():
    return {"signals":CUSTOM_SIGNALS,"total":len(CUSTOM_SIGNALS)}
