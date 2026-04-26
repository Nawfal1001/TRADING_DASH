from fastapi import APIRouter
from services.scanner_service import CACHE, run_scan
router=APIRouter()
@router.get('/')
async def get_scanner(limit:int=20):
 if not CACHE['results']:
  await run_scan()
 return {'updated_at':CACHE['updated_at'],'results':CACHE['results'][:limit]}
@router.post('/refresh')
async def refresh():
 return await run_scan()
