const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const AUTH_PRO_USER = process.env.AUTHPRO_USER || 'Jergan';
const AUTH_PRO_API_KEY = process.env.AUTHPRO_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean);

if (!AUTH_PRO_API_KEY || !JWT_SECRET) {
  console.error('Missing AUTHPRO_API_KEY or JWT_SECRET. Copy .env.example to .env and configure both.');
  process.exit(1);
}

app.use(helmet());
app.use(express.json({ limit: '20kb' }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed'));
  },
  credentials: false
}));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again later.' }
});

function issueToken(member) {
  return jwt.sign(
    { sub: member.login, email: member.email, provider: 'authpro' },
    JWT_SECRET,
    { issuer: 'jergan-studio', audience: 'jergan-apps', expiresIn: '7d', jwtid: crypto.randomUUID() }
  );
}

async function verifyWithAuthPro(login, password, ip) {
  const body = new URLSearchParams({
    user: AUTH_PRO_USER,
    api_key: AUTH_PRO_API_KEY,
    login,
    password
  });
  if (ip) body.set('IP', ip);

  const response = await fetch('https://www.authpro.com/api2/login/', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!response.ok) throw new Error(`AuthPro returned HTTP ${response.status}`);
  return response.json();
}

async function findMember(login) {
  const body = new URLSearchParams({
    user: AUTH_PRO_USER,
    api_key: AUTH_PRO_API_KEY,
    record: '{login}{email}',
    login_full: login,
    limit: '1'
  });

  const response = await fetch('https://www.authpro.com/api2/list/', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!response.ok) throw new Error(`AuthPro returned HTTP ${response.status}`);
  const data = await response.json();
  return data.members?.[0] || null;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'jergan-account', provider: 'AuthPro' });
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const login = typeof req.body.login === 'string' ? req.body.login.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!login || !password) return res.status(400).json({ error: 'Login and password are required.' });

  try {
    const result = await verifyWithAuthPro(login, password, req.ip);
    if (result.result !== 'OK') return res.status(401).json({ error: result.message || 'Invalid login.' });

    const member = await findMember(login);
    const profile = { login, email: member?.email || '' };
    const token = issueToken(profile);

    res.json({
      ok: true,
      token,
      user: profile,
      expiresIn: 604800
    });
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(502).json({ error: 'Authentication service is temporarily unavailable.' });
  }
});

function authenticate(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing Bearer token.' });

  try {
    req.user = jwt.verify(token, JWT_SECRET, { issuer: 'jergan-studio', audience: 'jergan-apps' });
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ ok: true, user: { login: req.user.sub, email: req.user.email } });
});

app.post('/api/auth/verify', authenticate, (_req, res) => {
  res.json({ ok: true, valid: true });
});

app.listen(PORT, () => {
  console.log(`Jergan Account server listening on port ${PORT}`);
});
