"""
FOCUS SAFE — Backend API regression tests
Covers: contact, auth (signup/login/me/logout), safes CRUD + status/events,
rules CRUD, profiles CRUD, alerts, settings, dashboard summary, family scoping.
"""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://focus-lock-77.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


# ---------- Fixtures ----------
def _new_email(tag="user"):
    return f"TEST_{tag}_{uuid.uuid4().hex[:8]}@example.com"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def primary_user(session):
    """Create a primary test user and return token + user info."""
    email = _new_email("primary")
    r = session.post(f"{API}/auth/signup", json={
        "email": email, "password": "Passw0rd!", "name": "Primary Tester"
    })
    assert r.status_code == 200, f"signup failed: {r.status_code} {r.text}"
    data = r.json()
    return {"token": data["token"], "user": data["user"], "email": email, "password": "Passw0rd!"}


@pytest.fixture(scope="module")
def auth_headers(primary_user):
    return {"Authorization": f"Bearer {primary_user['token']}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def secondary_user(session):
    email = _new_email("second")
    r = session.post(f"{API}/auth/signup", json={
        "email": email, "password": "Passw0rd!", "name": "Second Family"
    })
    assert r.status_code == 200
    data = r.json()
    return {"token": data["token"], "user": data["user"]}


# ---------- Health / Contact ----------
class TestHealthAndContact:
    def test_root(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_contact_post(self, session):
        r = session.post(f"{API}/contact", json={
            "name": "TEST Contact",
            "email": "TEST_contact@example.com",
            "message": "Bonjour, MVP test."
        })
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------- Auth ----------
class TestAuth:
    def test_signup_creates_user_and_token(self, primary_user):
        assert primary_user["token"]
        assert primary_user["user"]["email"] == primary_user["email"].lower()
        assert primary_user["user"]["family_code"].startswith("FAM-")
        assert primary_user["user"]["auth_provider"] == "password"

    def test_signup_duplicate_email(self, session, primary_user):
        r = session.post(f"{API}/auth/signup", json={
            "email": primary_user["email"], "password": "Passw0rd!", "name": "Dup"
        })
        assert r.status_code == 400

    def test_login_success(self, session, primary_user):
        r = session.post(f"{API}/auth/login", json={
            "email": primary_user["email"], "password": primary_user["password"]
        })
        assert r.status_code == 200
        body = r.json()
        assert "token" in body and isinstance(body["token"], str) and len(body["token"]) > 20
        assert body["user"]["email"] == primary_user["email"].lower()

    def test_login_wrong_password(self, session, primary_user):
        r = session.post(f"{API}/auth/login", json={
            "email": primary_user["email"], "password": "WrongPass!"
        })
        assert r.status_code == 401

    def test_me_with_bearer(self, session, auth_headers, primary_user):
        r = session.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["user_id"] == primary_user["user"]["user_id"]
        assert "password_hash" not in r.json()

    def test_me_unauthorized(self, session):
        r = session.get(f"{API}/auth/me", headers={"Content-Type": "application/json"})
        assert r.status_code == 401

    def test_logout(self, session, auth_headers):
        r = session.post(f"{API}/auth/logout", headers=auth_headers)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_settings_bootstrapped_on_signup(self, session, auth_headers):
        # Settings doc auto-created during signup
        r = session.get(f"{API}/settings", headers=auth_headers)
        assert r.status_code == 200
        s = r.json()
        assert s["master_code"] == "0000"
        assert s["email_alerts"] is True


# ---------- Safes ----------
class TestSafes:
    @pytest.fixture(scope="class")
    def safe(self, session, auth_headers):
        r = session.post(f"{API}/safes", json={
            "name": "TEST Coffre Salon", "serial": "SN-TEST-001", "wifi_ssid": "TEST-Wifi"
        }, headers=auth_headers)
        assert r.status_code == 200, r.text
        return r.json()

    def test_create_safe(self, safe):
        assert safe["safe_id"].startswith("safe_")
        assert safe["name"] == "TEST Coffre Salon"
        assert safe["battery"] == 100

    def test_list_safes_contains(self, session, auth_headers, safe):
        r = session.get(f"{API}/safes", headers=auth_headers)
        assert r.status_code == 200
        ids = [s["safe_id"] for s in r.json()]
        assert safe["safe_id"] in ids

    def test_get_safe(self, session, auth_headers, safe):
        r = session.get(f"{API}/safes/{safe['safe_id']}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["safe_id"] == safe["safe_id"]

    def test_status_update_basic(self, session, auth_headers, safe):
        r = session.post(f"{API}/safes/{safe['safe_id']}/status", json={
            "phone_present": True, "locked": True, "battery": 80
        }, headers=auth_headers)
        assert r.status_code == 200
        body = r.json()
        assert body["phone_present"] is True
        assert body["locked"] is True
        assert body["battery"] == 80
        assert body["last_seen"] is not None

    def test_status_low_battery_creates_alert(self, session, auth_headers, safe):
        r = session.post(f"{API}/safes/{safe['safe_id']}/status", json={
            "battery": 10
        }, headers=auth_headers)
        assert r.status_code == 200
        # Allow async tasks to flush
        time.sleep(0.5)
        ar = session.get(f"{API}/alerts", headers=auth_headers)
        assert ar.status_code == 200
        types = [a["type"] for a in ar.json() if a["safe_id"] == safe["safe_id"]]
        assert "low_battery" in types

    def test_event_open_attempt_creates_critical_alert(self, session, auth_headers, safe):
        r = session.post(f"{API}/safes/{safe['safe_id']}/events", json={
            "type": "open_attempt", "message": "Tentative test", "severity": "critical"
        }, headers=auth_headers)
        assert r.status_code == 200
        time.sleep(0.5)
        ar = session.get(f"{API}/alerts", headers=auth_headers)
        crits = [a for a in ar.json() if a["type"] == "open_attempt" and a["safe_id"] == safe["safe_id"]]
        assert len(crits) >= 1
        assert crits[0]["severity"] == "critical"

    def test_event_phone_absent_creates_alert(self, session, auth_headers, safe):
        r = session.post(f"{API}/safes/{safe['safe_id']}/events", json={
            "type": "phone_absent", "message": "Téléphone absent test", "severity": "critical"
        }, headers=auth_headers)
        assert r.status_code == 200
        time.sleep(0.3)
        ar = session.get(f"{API}/alerts", headers=auth_headers)
        types = [a["type"] for a in ar.json() if a["safe_id"] == safe["safe_id"]]
        assert "phone_absent" in types

    def test_events_sorted_desc(self, session, auth_headers, safe):
        r = session.get(f"{API}/safes/{safe['safe_id']}/events", headers=auth_headers)
        assert r.status_code == 200
        events = r.json()
        assert len(events) >= 2
        timestamps = [e["created_at"] for e in events]
        assert timestamps == sorted(timestamps, reverse=True)


# ---------- Rules ----------
class TestRules:
    @pytest.fixture(scope="class")
    def safe_id(self, session, auth_headers):
        r = session.post(f"{API}/safes", json={"name": "TEST Rules Safe"}, headers=auth_headers)
        return r.json()["safe_id"]

    def test_full_rule_lifecycle(self, session, auth_headers, safe_id):
        # Create
        payload = {
            "safe_id": safe_id, "name": "TEST Soir Semaine",
            "days": [0, 1, 2, 3, 4],
            "start_time": "21:00", "end_time": "07:00",
            "require_lock": True, "beep_if_absent": True, "alert_parent": True, "enabled": True
        }
        r = session.post(f"{API}/rules", json=payload, headers=auth_headers)
        assert r.status_code == 200
        rule = r.json()
        rid = rule["rule_id"]
        assert rule["days"] == [0, 1, 2, 3, 4]
        assert rule["start_time"] == "21:00"
        assert rule["enabled"] is True

        # List
        r = session.get(f"{API}/rules", headers=auth_headers)
        assert r.status_code == 200
        assert any(x["rule_id"] == rid for x in r.json())

        # Update
        payload["name"] = "TEST Soir Renamed"
        payload["start_time"] = "22:00"
        r = session.put(f"{API}/rules/{rid}", json=payload, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST Soir Renamed"
        assert r.json()["start_time"] == "22:00"

        # Toggle
        r = session.patch(f"{API}/rules/{rid}/toggle", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["enabled"] is False
        r = session.patch(f"{API}/rules/{rid}/toggle", headers=auth_headers)
        assert r.json()["enabled"] is True

        # Delete
        r = session.delete(f"{API}/rules/{rid}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["deleted"] == 1


# ---------- Profiles ----------
class TestProfiles:
    def test_profile_lifecycle(self, session, auth_headers):
        r = session.post(f"{API}/profiles", json={
            "name": "TEST Léo", "role": "child", "avatar_color": "#1A3636"
        }, headers=auth_headers)
        assert r.status_code == 200
        pid = r.json()["profile_id"]

        r = session.get(f"{API}/profiles", headers=auth_headers)
        assert any(p["profile_id"] == pid for p in r.json())

        r = session.delete(f"{API}/profiles/{pid}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["deleted"] == 1


# ---------- Alerts ----------
class TestAlerts:
    def test_list_and_mark_read(self, session, auth_headers):
        r = session.get(f"{API}/alerts", headers=auth_headers)
        assert r.status_code == 200
        alerts = r.json()
        assert isinstance(alerts, list)
        if alerts:
            aid = alerts[0]["alert_id"]
            r = session.patch(f"{API}/alerts/{aid}/read", headers=auth_headers)
            assert r.status_code == 200

    def test_mark_all_read(self, session, auth_headers):
        r = session.post(f"{API}/alerts/mark-all-read", headers=auth_headers)
        assert r.status_code == 200
        # verify
        r = session.get(f"{API}/alerts?unread_only=true", headers=auth_headers)
        assert r.status_code == 200
        assert len(r.json()) == 0


# ---------- Settings ----------
class TestSettings:
    def test_update_settings(self, session, auth_headers):
        r = session.put(f"{API}/settings", json={
            "master_code": "9421", "vacation_mode": True, "weekend_mode": True,
            "email_alerts": False, "push_alerts": False
        }, headers=auth_headers)
        assert r.status_code == 200
        s = r.json()
        assert s["master_code"] == "9421"
        assert s["vacation_mode"] is True
        assert s["email_alerts"] is False

        # GET to confirm persistence
        r = session.get(f"{API}/settings", headers=auth_headers)
        s = r.json()
        assert s["master_code"] == "9421"
        assert s["weekend_mode"] is True


# ---------- Dashboard summary ----------
class TestDashboard:
    def test_summary(self, session, auth_headers):
        r = session.get(f"{API}/dashboard/summary", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        assert "safes" in d and isinstance(d["safes"], list)
        assert "rules_active" in d
        assert "alerts_unread" in d
        assert "profiles_count" in d
        assert "user" in d


# ---------- Family scoping ----------
class TestFamilyScoping:
    def test_secondary_user_cannot_see_primary_data(self, session, secondary_user, primary_user):
        h2 = {"Authorization": f"Bearer {secondary_user['token']}", "Content-Type": "application/json"}
        # secondary should have empty safes (no safes created in their family)
        r = session.get(f"{API}/safes", headers=h2)
        assert r.status_code == 200
        # No safe from primary's family should leak
        primary_family = primary_user["user"]["family_code"]
        for s in r.json():
            assert s["family_code"] != primary_family

        # Same for rules / profiles / alerts
        for path in ["/rules", "/profiles", "/alerts"]:
            r = session.get(f"{API}{path}", headers=h2)
            assert r.status_code == 200
            for x in r.json():
                assert x.get("family_code") != primary_family
