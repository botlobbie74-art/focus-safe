from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import uuid
import jwt
import bcrypt
import resend
import requests
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'change_me')
JWT_ALG = 'HS256'
JWT_EXPIRES_DAYS = 7

RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

app = FastAPI(title="FOCUS SAFE API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ========== MODELS ==========
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    family_code: str
    auth_provider: Literal['password', 'google'] = 'password'
    created_at: datetime


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    family_code: Optional[str] = None  # if joining existing family


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleSessionRequest(BaseModel):
    session_id: str


class Safe(BaseModel):
    safe_id: str
    family_code: str
    name: str
    serial: Optional[str] = None
    wifi_ssid: Optional[str] = None
    # live status (updated by hardware)
    phone_present: bool = False
    door_open: bool = False
    locked: bool = False
    battery: int = 100
    charging: bool = False
    last_seen: Optional[datetime] = None
    created_at: datetime


class SafeCreate(BaseModel):
    name: str
    serial: Optional[str] = None
    wifi_ssid: Optional[str] = None


class SafeStatusUpdate(BaseModel):
    """Endpoint hardware appellera pour pousser son état."""
    phone_present: Optional[bool] = None
    door_open: Optional[bool] = None
    locked: Optional[bool] = None
    battery: Optional[int] = None
    charging: Optional[bool] = None


class Rule(BaseModel):
    rule_id: str
    family_code: str
    safe_id: str
    profile_id: Optional[str] = None
    name: str
    days: List[int]  # 0=Mon..6=Sun
    start_time: str  # "21:00"
    end_time: str    # "07:00"
    require_lock: bool = True
    beep_if_absent: bool = True
    alert_parent: bool = True
    enabled: bool = True
    created_at: datetime


class RuleCreate(BaseModel):
    safe_id: str
    profile_id: Optional[str] = None
    name: str
    days: List[int]
    start_time: str
    end_time: str
    require_lock: bool = True
    beep_if_absent: bool = True
    alert_parent: bool = True
    enabled: bool = True


class Profile(BaseModel):
    profile_id: str
    family_code: str
    name: str
    role: Literal['parent', 'child']
    avatar_color: str = "#1A3636"
    safe_id: Optional[str] = None
    created_at: datetime


class ProfileCreate(BaseModel):
    name: str
    role: Literal['parent', 'child']
    avatar_color: str = "#1A3636"
    safe_id: Optional[str] = None


class Event(BaseModel):
    event_id: str
    family_code: str
    safe_id: str
    type: Literal['placed', 'removed', 'locked', 'unlocked', 'open_attempt', 'door_opened', 'door_closed', 'low_battery', 'phone_absent', 'rule_started', 'rule_ended', 'manual_unlock']
    message: str
    severity: Literal['info', 'warning', 'critical'] = 'info'
    profile_id: Optional[str] = None
    rule_id: Optional[str] = None
    created_at: datetime


class EventCreate(BaseModel):
    """Endpoint hardware: pousse un événement."""
    type: Literal['placed', 'removed', 'locked', 'unlocked', 'open_attempt', 'door_opened', 'door_closed', 'low_battery', 'phone_absent', 'rule_started', 'rule_ended', 'manual_unlock']
    message: str
    severity: Literal['info', 'warning', 'critical'] = 'info'
    profile_id: Optional[str] = None
    rule_id: Optional[str] = None


class Alert(BaseModel):
    alert_id: str
    family_code: str
    safe_id: str
    type: str
    title: str
    body: str
    severity: Literal['info', 'warning', 'critical']
    read: bool = False
    created_at: datetime


class Settings(BaseModel):
    family_code: str
    master_code: str = "0000"
    vacation_mode: bool = False
    weekend_mode: bool = False
    email_alerts: bool = True
    push_alerts: bool = True
    updated_at: datetime


class SettingsUpdate(BaseModel):
    master_code: Optional[str] = None
    vacation_mode: Optional[bool] = None
    weekend_mode: Optional[bool] = None
    email_alerts: Optional[bool] = None
    push_alerts: Optional[bool] = None


# ========== HELPERS ==========
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())


def make_jwt(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRES_DAYS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def gen_family_code() -> str:
    return f"FAM-{uuid.uuid4().hex[:6].upper()}"


async def get_current_user(request: Request) -> dict:
    """Return user dict, supports cookie session_token (Google) AND Authorization: Bearer (JWT)."""
    # 1) cookie session (Emergent google)
    session_token = request.cookies.get("session_token")
    if session_token:
        sess = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if sess:
            expires_at = sess.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at and expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at and expires_at >= datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0, "password_hash": 0})
                if user:
                    return user

    # 2) Authorization Bearer JWT
    auth = request.headers.get("Authorization") or request.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()
        # try as JWT
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
            user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0, "password_hash": 0})
            if user:
                return user
        except jwt.PyJWTError:
            pass
        # also try as session_token
        sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if sess:
            user = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0, "password_hash": 0})
            if user:
                return user

    raise HTTPException(status_code=401, detail="Non authentifié")


async def send_email_async(recipient: str, subject: str, html: str):
    if not RESEND_API_KEY:
        logger.info(f"[EMAIL MOCK] -> {recipient} | {subject}")
        return
    try:
        params = {"from": SENDER_EMAIL, "to": [recipient], "subject": subject, "html": html}
        await asyncio.to_thread(resend.Emails.send, params)
    except Exception as e:
        logger.error(f"Resend error: {e}")


def alert_email_html(title: str, body: str) -> str:
    return f"""
    <html><body style="font-family: -apple-system, sans-serif; background:#FAF9F6; padding:32px;">
      <table role="presentation" width="100%" style="max-width:560px; margin:0 auto; background:#FFFFFF; border-radius:24px; padding:32px; border:1px solid #E2E4E1;">
        <tr><td style="font-size:12px; letter-spacing:0.2em; text-transform:uppercase; color:#6B7270;">FOCUS SAFE</td></tr>
        <tr><td style="font-size:28px; font-weight:300; color:#1A3636; padding-top:8px;">{title}</td></tr>
        <tr><td style="font-size:15px; color:#1A3636; padding-top:16px; line-height:1.6;">{body}</td></tr>
        <tr><td style="font-size:12px; color:#6B7270; padding-top:24px;">Cette alerte est envoyée par votre Focus Safe.</td></tr>
      </table>
    </body></html>
    """


async def create_alert(family_code: str, safe_id: str, atype: str, title: str, body: str,
                       severity: str = "warning", notify_emails: Optional[List[str]] = None):
    alert = {
        "alert_id": f"alert_{uuid.uuid4().hex[:12]}",
        "family_code": family_code,
        "safe_id": safe_id,
        "type": atype,
        "title": title,
        "body": body,
        "severity": severity,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.alerts.insert_one(dict(alert))
    if notify_emails:
        settings_doc = await db.settings.find_one({"family_code": family_code}, {"_id": 0})
        if not settings_doc or settings_doc.get("email_alerts", True):
            html = alert_email_html(title, body)
            for em in notify_emails:
                asyncio.create_task(send_email_async(em, f"FOCUS SAFE — {title}", html))
    return alert


async def family_emails(family_code: str) -> List[str]:
    cursor = db.users.find({"family_code": family_code}, {"_id": 0, "email": 1})
    return [u["email"] async for u in cursor]


# ========== ROUTES ==========
@api_router.get("/")
async def root():
    return {"name": "FOCUS SAFE API", "status": "ok"}


# --- AUTH ---
@api_router.post("/auth/signup")
async def signup(payload: SignupRequest):
    existing = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    family_code = payload.family_code.strip().upper() if payload.family_code else gen_family_code()

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": payload.email.lower(),
        "name": payload.name,
        "picture": None,
        "family_code": family_code,
        "auth_provider": "password",
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(dict(user_doc))

    # Bootstrap settings if first user of family
    if not await db.settings.find_one({"family_code": family_code}, {"_id": 0}):
        await db.settings.insert_one({
            "family_code": family_code,
            "master_code": "0000",
            "vacation_mode": False,
            "weekend_mode": False,
            "email_alerts": True,
            "push_alerts": True,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })

    token = make_jwt(user_id)
    user_doc.pop("password_hash", None)
    return {"token": token, "user": user_doc}


@api_router.post("/auth/login")
async def login(payload: LoginRequest):
    user = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    token = make_jwt(user["user_id"])
    user.pop("password_hash", None)
    return {"token": token, "user": user}


@api_router.post("/auth/google/session")
async def google_session(payload: GoogleSessionRequest, response: Response):
    """Échange un session_id Emergent contre un session_token + crée/lie le user."""
    try:
        r = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": payload.session_id},
            timeout=10,
        )
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Session OAuth invalide")
        data = r.json()
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Erreur OAuth: {e}")

    email = data["email"].lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        family_code = gen_family_code()
        user = {
            "user_id": user_id,
            "email": email,
            "name": data.get("name") or email,
            "picture": data.get("picture"),
            "family_code": family_code,
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(dict(user))
        await db.settings.insert_one({
            "family_code": family_code,
            "master_code": "0000",
            "vacation_mode": False,
            "weekend_mode": False,
            "email_alerts": True,
            "push_alerts": True,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
    else:
        if data.get("picture") and user.get("picture") != data.get("picture"):
            await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"picture": data["picture"]}})
            user["picture"] = data["picture"]

    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )
    user.pop("password_hash", None)
    return {"user": user}


@api_router.get("/auth/me")
async def auth_me(user=Depends(get_current_user)):
    user.pop("password_hash", None)
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# --- SAFES ---
@api_router.get("/safes")
async def list_safes(user=Depends(get_current_user)):
    cursor = db.safes.find({"family_code": user["family_code"]}, {"_id": 0})
    return await cursor.to_list(100)


@api_router.post("/safes")
async def create_safe(payload: SafeCreate, user=Depends(get_current_user)):
    safe_id = f"safe_{uuid.uuid4().hex[:10]}"
    doc = {
        "safe_id": safe_id,
        "family_code": user["family_code"],
        "name": payload.name,
        "serial": payload.serial,
        "wifi_ssid": payload.wifi_ssid,
        "phone_present": False,
        "door_open": False,
        "locked": False,
        "battery": 100,
        "charging": False,
        "last_seen": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.safes.insert_one(dict(doc))
    return doc


@api_router.get("/safes/{safe_id}")
async def get_safe(safe_id: str, user=Depends(get_current_user)):
    safe = await db.safes.find_one({"safe_id": safe_id, "family_code": user["family_code"]}, {"_id": 0})
    if not safe:
        raise HTTPException(404, "Safe introuvable")
    return safe


@api_router.delete("/safes/{safe_id}")
async def delete_safe(safe_id: str, user=Depends(get_current_user)):
    res = await db.safes.delete_one({"safe_id": safe_id, "family_code": user["family_code"]})
    return {"deleted": res.deleted_count}


@api_router.post("/safes/{safe_id}/status")
async def update_status(safe_id: str, payload: SafeStatusUpdate, user=Depends(get_current_user)):
    """Endpoint pour le hardware (et override manuel parent). 
    Le hardware utilisera son JWT futur — pour le MVP, parent peut le faire aussi."""
    safe = await db.safes.find_one({"safe_id": safe_id, "family_code": user["family_code"]}, {"_id": 0})
    if not safe:
        raise HTTPException(404, "Safe introuvable")
    update = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    update["last_seen"] = datetime.now(timezone.utc).isoformat()
    await db.safes.update_one({"safe_id": safe_id}, {"$set": update})

    # Auto-create critical alerts
    if payload.battery is not None and payload.battery <= 15:
        await create_alert(user["family_code"], safe_id, "low_battery",
                           "Batterie faible du safe",
                           f"La batterie du safe « {safe.get('name', '')} » est à {payload.battery}%.",
                           "warning",
                           await family_emails(user["family_code"]))

    return await db.safes.find_one({"safe_id": safe_id}, {"_id": 0})


@api_router.post("/safes/{safe_id}/events")
async def push_event(safe_id: str, payload: EventCreate, user=Depends(get_current_user)):
    """Hardware pousse des événements. Crée aussi automatiquement des alertes critiques."""
    safe = await db.safes.find_one({"safe_id": safe_id, "family_code": user["family_code"]}, {"_id": 0})
    if not safe:
        raise HTTPException(404, "Safe introuvable")
    event = {
        "event_id": f"evt_{uuid.uuid4().hex[:12]}",
        "family_code": user["family_code"],
        "safe_id": safe_id,
        "type": payload.type,
        "message": payload.message,
        "severity": payload.severity,
        "profile_id": payload.profile_id,
        "rule_id": payload.rule_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.events.insert_one(dict(event))

    # Map critical events -> alerts (with email)
    critical_map = {
        "open_attempt": ("Tentative d'ouverture détectée", f"Une tentative d'ouverture a été détectée sur « {safe.get('name','')} » pendant une règle active."),
        "phone_absent": ("Téléphone absent du safe", f"Le téléphone n'a pas été placé dans « {safe.get('name','')} » alors qu'une règle active l'exige."),
        "low_battery": ("Batterie faible", f"La batterie du safe « {safe.get('name','')} » est faible."),
    }
    if payload.type in critical_map:
        title, body = critical_map[payload.type]
        await create_alert(user["family_code"], safe_id, payload.type, title, body,
                           "critical" if payload.type != "low_battery" else "warning",
                           await family_emails(user["family_code"]))

    return event


@api_router.get("/safes/{safe_id}/events")
async def list_events(safe_id: str, limit: int = 100, user=Depends(get_current_user)):
    cursor = db.events.find(
        {"safe_id": safe_id, "family_code": user["family_code"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit)
    return await cursor.to_list(limit)


# --- RULES ---
@api_router.get("/rules")
async def list_rules(user=Depends(get_current_user)):
    cursor = db.rules.find({"family_code": user["family_code"]}, {"_id": 0})
    return await cursor.to_list(200)


@api_router.post("/rules")
async def create_rule(payload: RuleCreate, user=Depends(get_current_user)):
    rule = {
        "rule_id": f"rule_{uuid.uuid4().hex[:10]}",
        "family_code": user["family_code"],
        **payload.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.rules.insert_one(dict(rule))
    return rule


@api_router.put("/rules/{rule_id}")
async def update_rule(rule_id: str, payload: RuleCreate, user=Depends(get_current_user)):
    res = await db.rules.update_one(
        {"rule_id": rule_id, "family_code": user["family_code"]},
        {"$set": payload.model_dump()}
    )
    if not res.matched_count:
        raise HTTPException(404, "Règle introuvable")
    return await db.rules.find_one({"rule_id": rule_id}, {"_id": 0})


@api_router.patch("/rules/{rule_id}/toggle")
async def toggle_rule(rule_id: str, user=Depends(get_current_user)):
    rule = await db.rules.find_one({"rule_id": rule_id, "family_code": user["family_code"]}, {"_id": 0})
    if not rule:
        raise HTTPException(404, "Règle introuvable")
    new_state = not rule.get("enabled", True)
    await db.rules.update_one({"rule_id": rule_id}, {"$set": {"enabled": new_state}})
    return {"rule_id": rule_id, "enabled": new_state}


@api_router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str, user=Depends(get_current_user)):
    res = await db.rules.delete_one({"rule_id": rule_id, "family_code": user["family_code"]})
    return {"deleted": res.deleted_count}


# --- PROFILES ---
@api_router.get("/profiles")
async def list_profiles(user=Depends(get_current_user)):
    cursor = db.profiles.find({"family_code": user["family_code"]}, {"_id": 0})
    return await cursor.to_list(50)


@api_router.post("/profiles")
async def create_profile(payload: ProfileCreate, user=Depends(get_current_user)):
    doc = {
        "profile_id": f"prof_{uuid.uuid4().hex[:10]}",
        "family_code": user["family_code"],
        **payload.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.profiles.insert_one(dict(doc))
    return doc


@api_router.delete("/profiles/{profile_id}")
async def delete_profile(profile_id: str, user=Depends(get_current_user)):
    res = await db.profiles.delete_one({"profile_id": profile_id, "family_code": user["family_code"]})
    return {"deleted": res.deleted_count}


# --- ALERTS ---
@api_router.get("/alerts")
async def list_alerts(unread_only: bool = False, user=Depends(get_current_user)):
    q = {"family_code": user["family_code"]}
    if unread_only:
        q["read"] = False
    cursor = db.alerts.find(q, {"_id": 0}).sort("created_at", -1).limit(200)
    return await cursor.to_list(200)


@api_router.patch("/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: str, user=Depends(get_current_user)):
    await db.alerts.update_one(
        {"alert_id": alert_id, "family_code": user["family_code"]},
        {"$set": {"read": True}}
    )
    return {"ok": True}


@api_router.post("/alerts/mark-all-read")
async def mark_all_read(user=Depends(get_current_user)):
    await db.alerts.update_many({"family_code": user["family_code"]}, {"$set": {"read": True}})
    return {"ok": True}


# --- SETTINGS ---
@api_router.get("/settings")
async def get_settings(user=Depends(get_current_user)):
    s = await db.settings.find_one({"family_code": user["family_code"]}, {"_id": 0})
    if not s:
        s = {
            "family_code": user["family_code"],
            "master_code": "0000",
            "vacation_mode": False,
            "weekend_mode": False,
            "email_alerts": True,
            "push_alerts": True,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.settings.insert_one(dict(s))
    return s


@api_router.put("/settings")
async def update_settings(payload: SettingsUpdate, user=Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.settings.update_one(
        {"family_code": user["family_code"]},
        {"$set": update},
        upsert=True
    )
    return await db.settings.find_one({"family_code": user["family_code"]}, {"_id": 0})


# --- DASHBOARD SUMMARY ---
@api_router.get("/dashboard/summary")
async def dashboard_summary(user=Depends(get_current_user)):
    family_code = user["family_code"]
    safes = await db.safes.find({"family_code": family_code}, {"_id": 0}).to_list(20)
    rules_count = await db.rules.count_documents({"family_code": family_code, "enabled": True})
    alerts_unread = await db.alerts.count_documents({"family_code": family_code, "read": False})
    profiles_count = await db.profiles.count_documents({"family_code": family_code})
    return {
        "safes": safes,
        "rules_active": rules_count,
        "alerts_unread": alerts_unread,
        "profiles_count": profiles_count,
        "user": {k: v for k, v in user.items() if k != "password_hash"},
    }


# --- CONTACT (landing) ---
class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    message: str


@api_router.post("/contact")
async def contact(payload: ContactRequest):
    await db.contacts.insert_one({
        "contact_id": f"ct_{uuid.uuid4().hex[:10]}",
        "name": payload.name,
        "email": payload.email,
        "message": payload.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
