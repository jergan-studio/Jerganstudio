# Jergan Account Server

The Jergan Account Server is the server-side authentication gateway for Jergan Studio apps. It verifies credentials with AuthPro and issues a short, application-facing JWT so apps do not need to know the AuthPro API key.

AuthPro's API documents `POST /api2/login/` for verifying a member login/password and `POST /api2/list/` for retrieving member fields. The API key must remain on the server. See: https://www.authpro.com/api.shtml

## 1. Install

```bash
cd auth-server
npm install
```

## 2. Configure secrets

Copy `.env.example` to `.env` and set:

- `AUTHPRO_USER=Jergan`
- `AUTHPRO_API_KEY` — your private AuthPro API key
- `JWT_SECRET` — a long random secret
- `ALLOWED_ORIGINS` — the exact HTTPS origins of your apps

**Never commit `.env` or put the AuthPro API key in browser code, GitHub Pages, desktop app source, or a public repository.**

## 3. Run locally

```bash
npm start
```

Health check:

```text
GET http://localhost:3000/health
```

## API

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "login": "your-login",
  "password": "your-password"
}
```

Successful response:

```json
{
  "ok": true,
  "token": "JWT...",
  "user": {
    "login": "your-login",
    "email": "you@example.com"
  },
  "expiresIn": 604800
}
```

### Current user

```http
GET /api/auth/me
Authorization: Bearer JWT...
```

### Verify token

```http
POST /api/auth/verify
Authorization: Bearer JWT...
```

## Connecting an app

A Jergan app should send the user's login and password only to your HTTPS Jergan Account Server. After a successful login, store the returned access token using the app's secure credential storage.

Example browser request:

```js
const response = await fetch('https://YOUR-AUTH-SERVER.example.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ login, password })
});

const data = await response.json();
if (!response.ok) throw new Error(data.error || 'Login failed');

// Keep this token private to the app.
const token = data.token;
```

Then an app can verify the account:

```js
const response = await fetch('https://YOUR-AUTH-SERVER.example.com/api/auth/me', {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await response.json();
```

## Deployment

Deploy this `auth-server` directory to a Node.js service such as Render, Railway, or another HTTPS Node host. Do **not** deploy this server as a static GitHub Pages site; GitHub Pages cannot run the Node.js process.

Set the environment variables in the hosting provider's secret/environment-variable settings.

## Security notes

- HTTPS is required in production.
- Keep `AUTHPRO_API_KEY` server-side.
- Use a long random `JWT_SECRET`.
- Restrict `ALLOWED_ORIGINS` to your real app origins.
- Do not log passwords or tokens.
- The sample API uses a seven-day bearer token. Reduce the lifetime if your apps need stricter sessions.
- For desktop apps, use OS credential storage for the token rather than a plaintext file.
