# Auth Testing Playbook (Emergent Google + JWT)

## Quick set up of a Google session in DB (for cookie-based auth tests)
```bash
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  family_code: 'FAM-TEST01',
  auth_provider: 'google',
  created_at: new Date()
});
db.user_sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
print('Session token: ' + sessionToken);
print('User ID: ' + userId);
"
```

## Backend tests
```bash
# Health
curl https://focus-lock-77.preview.emergentagent.com/api/

# JWT signup
curl -X POST https://focus-lock-77.preview.emergentagent.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"qa@example.com","password":"qapass123","name":"QA"}'

# Auth me (Bearer)
curl https://focus-lock-77.preview.emergentagent.com/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

## Browser tests
For Google OAuth flow, set cookie session_token directly:
```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": "<TOKEN_FROM_DB>",
    "domain": "focus-lock-77.preview.emergentagent.com",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
await page.goto("https://focus-lock-77.preview.emergentagent.com/dashboard")
```
