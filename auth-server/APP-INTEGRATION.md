# Jergan Account app integration

Jergan Account is the shared authentication gateway for Jergan Studio apps.

## Architecture

```text
Jergan app
   |
   | HTTPS
   v
Jergan Account (Render)
   |
   | server-side API request
   v
AuthPro
```

The AuthPro API key must remain only in the Render environment. Never ship it in a desktop app, browser JavaScript, or GitHub repository.

## API

### `POST /api/auth/login`

Request:

```json
{
  "login": "member-login",
  "password": "member-password"
}
```

Successful response:

```json
{
  "ok": true,
  "token": "JWT_FROM_SERVER",
  "user": {
    "login": "member-login",
    "email": "member@example.com"
  },
  "expiresIn": 604800
}
```

Store the returned token using the app's secure credential storage. Do not put it in source code.

### `GET /api/auth/me`

Send:

```http
Authorization: Bearer YOUR_JERGAN_TOKEN
```

### `POST /api/auth/verify`

Send the same Bearer token to verify that it is still valid.

### `GET /health`

Returns a simple server health response.

## Desktop apps

A desktop app should eventually use a system-browser login rather than collecting passwords itself. That browser/callback flow should be added only after the AuthPro account's supported API credentials and redirect configuration are available.

## Render

Deploy this directory as a Render Web Service:

- Root directory: `auth-server`
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/health`

Environment variables:

```text
AUTHPRO_USER=Jergan
AUTHPRO_API_KEY=<provided by AuthPro>
JWT_SECRET=<strong random secret>
ALLOWED_ORIGINS=https://your-jergan-site.example
```

Do not commit `.env` or secrets.
