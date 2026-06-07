const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const { pool } = require('../config/db');
const { setCache, getCached, deleteCache, cacheKey } = require('../config/redis');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

// ─── Email transporter (Brevo SMTP) ──────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

async function sendOTPEmail(email, otp, name = '') {
  await transporter.sendMail({
    from: `"ResumeMatch" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your ResumeMatch verification code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f1a; padding: 40px; border-radius: 12px;">
        <h2 style="color: #f1f0ff; margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #9ca3af; margin-bottom: 32px;">Hi ${name || 'there'}, use this code to complete your registration.</p>
        <div style="background: #1e1e35; border: 1px solid #4f46e5; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 42px; font-weight: 700; color: #a78bfa; letter-spacing: 8px;">${otp}</div>
        </div>
        <p style="color: #6b7280; font-size: 13px;">This code expires in <strong style="color: #9ca3af;">10 minutes</strong>.</p>
      </div>
    `,
  });
}

// ─── SEND OTP ─────────────────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered. Please login.' });

    const otp = generateOTP();
    const hash = await bcrypt.hash(password, 12);

    await setCache(cacheKey('otp_pending', email), { email, name: name || '', passwordHash: hash, otp }, 600);
    await sendOTPEmail(email, otp, name);

    res.json({ message: 'OTP sent! Check your inbox.', email });
  } catch (err) {
    console.error('Send OTP error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP: ' + err.message });
  }
});

// ─── VERIFY OTP ───────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  try {
    const pending = await getCached(cacheKey('otp_pending', email));
    if (!pending) return res.status(400).json({ error: 'OTP expired. Please register again.' });
    if (pending.otp !== otp.trim()) return res.status(400).json({ error: 'Invalid OTP. Try again.' });

    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, email_verified) VALUES ($1, $2, $3, true) RETURNING id, email, name',
      [pending.email, pending.passwordHash, pending.name]
    );

    await deleteCache(cacheKey('otp_pending', email));

    const user = result.rows[0];
    const token = generateToken(user.id);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Verify OTP error:', err.message);
    res.status(500).json({ error: 'Verification failed. Try again.' });
  }
});

// ─── RESEND OTP ───────────────────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const pending = await getCached(cacheKey('otp_pending', email));
    if (!pending) return res.status(400).json({ error: 'Session expired. Please start registration again.' });

    const newOtp = generateOTP();
    await setCache(cacheKey('otp_pending', email), { ...pending, otp: newOtp }, 600);
    await sendOTPEmail(email, newOtp, pending.name);
    res.json({ message: 'New OTP sent!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend OTP: ' + err.message });
  }
});

// ─── GOOGLE OAUTH callback ────────────────────────────────────────────────────
router.post('/google/callback', async (req, res) => {
  const { code, redirectUri } = req.body;
  console.log('Google callback received:', { code: code ? 'present' : 'missing', redirectUri });

  if (!code) return res.status(400).json({ error: 'Authorization code required' });
  if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: 'Google Client ID not configured on server' });
  if (!GOOGLE_CLIENT_SECRET) return res.status(500).json({ error: 'Google Client Secret not configured on server' });

  try {
    console.log('Exchanging code with redirectUri:', redirectUri);

    // Exchange code for tokens
    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri: redirectUri,
    });

    console.log('Tokens received, verifying ID token...');

    // Verify the ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;
    console.log('Google user:', email);

    // Upsert user
    let result = await pool.query('SELECT id, email, name FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO users (email, name, google_id, avatar_url, email_verified) VALUES ($1, $2, $3, $4, true) RETURNING id, email, name',
        [email, name, googleId, picture]
      );
      console.log('New user created:', email);
    } else {
      await pool.query('UPDATE users SET google_id = $1, avatar_url = $2 WHERE email = $3', [googleId, picture, email]);
      console.log('Existing user logged in:', email);
    }

    const user = result.rows[0];
    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, avatar: picture } });
  } catch (err) {
    console.error('Google callback error:', err.message);
    console.error('Full error:', err);
    res.status(401).json({ error: 'Google authentication failed: ' + err.message });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(401).json({ error: 'No account found with this email' });

    const user = result.rows[0];
    if (!user.password_hash) return res.status(401).json({ error: 'This account uses Google sign-in. Please login with Google.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect password' });

    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── GET PROFILE ──────────────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;