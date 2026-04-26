from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.alert_service import send_telegram, send_email, create_alert, list_alerts

router = APIRouter()

class AlertConfig(BaseModel):
    ticker: str
    condition: str
    value: float
    channels: list
    message: Optional[str] = None

@router.post("/create")
async def create(alert: AlertConfig):
    return await create_alert(alert.dict())

@router.get("/list")
async def get_alerts():
    return await list_alerts()

@router.post("/test/telegram")
async def test_telegram(message: str = "TradeAI test alert!"):
    return await send_telegram(message)

@router.post("/test/email")
async def test_email(to: str, message: str = "TradeAI test alert!"):
    return await send_email(to, "TradeAI Alert", message)
