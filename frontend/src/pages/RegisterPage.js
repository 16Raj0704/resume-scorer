import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import GoogleButton from '../components/GoogleButton';
import toast from 'react-hot-toast';

const S = {
  page: { minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '24px' },
  box: { width: '100%', maxWidth: 420 },
  logo: { width: 48, height: 48, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 },
  h1: { color: '#f1f0ff', fontSize: 28, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.5px' },
  sub: { color: '#6b7280', fontSize: 15, marginBottom: 32 },
  label: { display: 'block', color: '#9ca3af', fontSize: 13, marginBottom: 6 },
  input: { width: '100%', padding: '12px 14px', background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: 8, color: '#f1f0ff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  btnPrimary: { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' },
  dividerLine: { flex: 1, height: 1, background: '#1e1e2e' },
  dividerText: { color: '#4b5563', fontSize: 13 },
};

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { googleLogin, sendOTP } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credential) => {
    try {
      await googleLogin(credential);
      navigate('/dashboard');
      toast.success('Account created with Google!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Google sign-up failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await sendOTP(form.email, form.password, form.name);
      toast.success('OTP sent to your email!');
      navigate('/verify-otp', { state: { email: form.email, name: form.name } });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.box}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={S.logo}>⚡</div>
          <h1 style={S.h1}>Create account</h1>
          <p style={S.sub}>Start matching smarter today</p>
        </div>

        <GoogleButton onSuccess={handleGoogleSuccess} text="signup_with" />

        <div style={S.divider}>
          <div style={S.dividerLine} />
          <span style={S.dividerText}>or create manually</span>
          <div style={S.dividerLine} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Full name</label>
            <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" style={S.input} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Email</label>
            <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" style={S.input} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={S.label}>Password</label>
            <input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="At least 6 characters" style={S.input} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#0f0f1a', border: '1px solid #1e1e2e', borderRadius: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 16 }}>✉</span>
            <span style={{ fontSize: 12, color: '#6b7280' }}>We'll send a 6-digit verification code to your email</span>
          </div>
          <button type="submit" disabled={loading} style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Sending OTP...' : 'Send verification code →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 14, marginTop: 24 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}