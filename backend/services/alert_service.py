import os
import aiosmtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

ALERTS = []

async def send_telegram(message: str):
    try:
        import httpx
        token = os.getenv("TELEGRAM_BOT_TOKEN")
        chat_id = os.getenv("TELEGRAM_CHAT_ID")
        if not token or not chat_id:
            return {"status": "error", "message": "Telegram not configured"}
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json={"chat_id": chat_id, "text": f"🤖 TradeAI Alert\n\n{message}", "parse_mode": "HTML"})
        return {"status": "sent", "channel": "telegram"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

async def send_email(to: str, subject: str, body: str):
    try:
        msg = EmailMessage()
        msg["From"] = os.getenv("SMTP_USER")
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content(body)
        await aiosmtplib.send(
            msg,
            hostname=os.getenv("SMTP_HOST", "smtp.gmail.com"),
            port=int(os.getenv("SMTP_PORT", 587)),
            username=os.getenv("SMTP_USER"),
            password=os.getenv("SMTP_PASS"),
            start_tls=True,
        )
        return {"status": "sent", "channel": "email", "to": to}
    except Exception as e:
        return {"status": "error", "message": str(e)}

async def create_alert(alert: dict):
    alert["id"] = len(ALERTS) + 1
    alert["active"] = True
    ALERTS.append(alert)
    return {"status": "created", "alert": alert}

async def list_alerts():
    return {"alerts": ALERTS}

async def check_and_fire_alerts(ticker: str, price: float):
    fired = []
    for alert in ALERTS:
        if alert.get("ticker") == ticker and alert.get("active"):
            condition = alert.get("condition")
            threshold = alert.get("value", 0)
            triggered = False
            if condition == "price_above" and price > threshold:
                triggered = True
            elif condition == "price_below" and price < threshold:
                triggered = True
            if triggered:
                msg = alert.get("message") or f"{ticker} {condition} {threshold}. Current: {price}"
                channels = alert.get("channels", [])
                if "telegram" in channels:
                    await send_telegram(msg)
                if "email" in channels and alert.get("email_to"):
                    await send_email(alert["email_to"], f"TradeAI: {ticker} Alert", msg)
                fired.append(alert)
    return fired
