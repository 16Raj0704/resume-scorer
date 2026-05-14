import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import GoogleButton from '../components/GoogleButton';
import toast from 'react-hot-toast';

const S = {
  page: { minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" },
  box: { width: '100%', maxWidth: 420, padding: '0 24px' },
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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credential) => {
    try {
      await googleLogin(credential);
      navigate('/dashboard');
      toast.success('Signed in with Google!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Google sign-in failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.box}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={S.logo}>⚡</div>
          <h1 style={S.h1}>Welcome back</h1>
          <p style={S.sub}>Sign in to your account</p>
        </div>

        <GoogleButton onSuccess={handleGoogleSuccess} text="signin_with" />

        <div style={S.divider}>
          <div style={S.dividerLine} />
          <span style={S.dividerText}>or continue with email</span>
          <div style={S.dividerLine} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={S.input} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={S.label}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={S.input} />
          </div>
          <button type="submit" disabled={loading} style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 14, marginTop: 24 }}>
          No account?{' '}
          <Link to="/register" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}