import asyncio
from datetime import datetime
import ccxt, yfinance as yf
from services.signal_service import generate_signal
CACHE={'updated_at':None,'results':[],'running':False}
STOCKS=['AAPL','NVDA','MSFT','GOOGL','TSLA','META','AMZN','AMD','NFLX','JPM','PLTR','SMCI','COIN','MSTR']
async def stock_candidates():
 r=[]
 for t in STOCKS:
  try:
   h=yf.Ticker(t).history(period='5d',interval='1d')
   if len(h)>=2:
    c=float(h['Close'].iloc[-1]); p=float(h['Close'].iloc[-2]); v=float(h['Volume'].iloc[-1]); av=float(h['Volume'].mean());
    score=abs((c-p)/p*100)+(v/max(av,1))*2
    r.append((score,t,'stock'))
  except: pass
 return r
async def crypto_candidates():
 r=[]
 try:
  ex=ccxt.binance(); data=ex.fetch_tickers()
  for sym,d in data.items():
   if sym.endswith('/USDT'):
    score=abs(d.get('percentage') or 0)+(d.get('quoteVolume') or 0)/1e8
    r.append((score,sym.replace('/USDT',''),'crypto'))
  r.sort(reverse=True)
 except: pass
 return r[:25]
async def run_scan():
 if CACHE['running']: return CACHE
 CACHE['running']=True
 try:
  cands=(await stock_candidates())+(await crypto_candidates())
  cands=sorted(cands,reverse=True)[:25]
  tasks=[generate_signal(t,a,'intraday') for _,t,a in cands]
  raw=await asyncio.gather(*tasks,return_exceptions=True)
  out=[]
  for x in raw:
   if isinstance(x,dict) and 'error' not in x:
    tl=x.get('trade_levels',{})
    sig=x.get('signal','HOLD')
    side='LONG' if 'BUY' in sig else 'SHORT' if 'SELL' in sig else 'HOLD'
    reason=', '.join([i['indicator'] for i in x.get('indicators',[])[:3]])
    out.append({'ticker':x['ticker'],'asset_type':x['asset_type'],'signal':sig,'side':side,'confidence':x.get('confidence',0),'entry':tl.get('entry'),'stop_loss':tl.get('stop_loss'),'take_profit_1':tl.get('take_profit_1'),'take_profit_2':tl.get('take_profit_2'),'take_profit_3':tl.get('take_profit_3'),'reason':reason})
  out.sort(key=lambda z:z['confidence'],reverse=True)
  CACHE['results']=out; CACHE['updated_at']=datetime.utcnow().isoformat()
 finally:
  CACHE['running']=False
 return CACHE
async def loop_scanner():
 while True:
  try: await run_scan()
  except: pass
  await asyncio.sleep(3600)
def start_scheduler():
 asyncio.create_task(loop_scanner())
