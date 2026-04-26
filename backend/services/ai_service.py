import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def get_model():
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set in environment")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-1.5-flash-latest")

async def research_asset(query: str, ticker: str = None, asset_type: str = "stock"):
    try:
        model = get_model()
        prompt = f"""You are an expert financial analyst and trader.
{'Ticker: ' + ticker if ticker else ''}
Asset type: {asset_type}
Question: {query}

Provide a concise, actionable trading analysis. Include:
1. Key insights
2. Risk factors
3. Short-term outlook (1-2 weeks)
4. Recommendation: BUY / SELL / HOLD with confidence %

Be direct and data-driven. Max 200 words."""
        response = model.generate_content(prompt)
        return {"analysis": response.text, "ticker": ticker, "query": query}
    except Exception as e:
        return {"error": str(e), "analysis": "AI analysis unavailable"}

async def get_ai_signal(ticker: str, asset_type: str, rsi: float, macd: float, price: float):
    try:
        model = get_model()
        prompt = f"""You are a trading AI. Analyze this asset:
Ticker: {ticker} ({asset_type})
Current price: {price}
RSI: {rsi}
MACD: {macd}

Respond ONLY with JSON like this (no markdown):
{{"sentiment": "bullish|bearish|neutral", "reason": "one sentence", "confidence": 0-100}}"""
        response = model.generate_content(prompt)
        text = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(text)
    except:
        return {"sentiment": "neutral", "reason": "AI unavailable", "confidence": 50}

async def find_best_trades(asset_type: str = "all", risk: str = "medium"):
    try:
        model = get_model()
        prompt = f"""You are an expert trader. Today's date context: 2026.
Find the TOP 5 best trading opportunities right now.
Asset type: {asset_type} (stocks, crypto, or both)
Risk level: {risk}

For each opportunity provide:
- Ticker symbol
- Asset type (stock/crypto)
- Signal (BUY/SELL)
- Reason (1 sentence)
- Confidence %
- Entry price range
- Target price
- Stop loss

Respond ONLY with JSON array (no markdown):
[{{"ticker":"...","type":"...","signal":"...","reason":"...","confidence":0,"entry":"...","target":"...","stop_loss":"..."}}]"""
        response = model.generate_content(prompt)
        text = response.text.strip().replace("```json", "").replace("```", "")
        trades = json.loads(text)
        return {"trades": trades, "risk": risk, "asset_type": asset_type}
    except Exception as e:
        return {"error": str(e), "trades": []}

async def analyze_news(ticker: str):
    try:
        model = get_model()
        prompt = f"""Analyze recent market sentiment for {ticker}.
Consider: recent earnings, news, analyst ratings, social media sentiment.

Respond ONLY with JSON (no markdown):
{{"overall_sentiment": "bullish|bearish|neutral", "score": 0-100, "key_events": ["event1","event2"], "summary": "2 sentences"}}"""
        response = model.generate_content(prompt)
        text = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(text)
    except Exception as e:
        return {"error": str(e), "overall_sentiment": "neutral", "score": 50}
