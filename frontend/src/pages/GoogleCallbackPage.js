import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function GoogleCallbackPage() {
  const [status, setStatus] = useState('Completing sign-in...');
  const [error, setError] = useState(null);
  const { googleLoginCode } = useAuth();
  const navigate = useNavigate();
  const called = useRef(false); // prevent double call in StrictMode

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    // Google puts the code in the URL query string
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errorParam = params.get('error');

    console.log('Google callback — code:', code ? 'present' : 'missing', 'error:', errorParam);

    if (errorParam) {
      setError('Google sign-in was cancelled.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!code) {
      setError('No authorisation code received from Google.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    setStatus('Verifying your Google account...');

    googleLoginCode(code)
      .then(() => {
        setStatus('Success! Redirecting...');
        toast.success('Signed in with Google!');
        navigate('/dashboard', { replace: true });
      })
      .catch((err) => {
        console.error('Google login error:', err);
        const msg = err.response?.data?.error || 'Google sign-in failed. Try again.';
        setError(msg);
        toast.error(msg);
        setTimeout(() => navigate('/login'), 2500);
      });
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", gap: 20,
      padding: 24,
    }}>
      {error ? (
        <>
          <div style={{ fontSize: 36 }}>⚠</div>
          <div style={{ color: '#f87171', fontSize: 15, textAlign: 'center' }}>{error}</div>
          <div style={{ color: '#6b7280', fontSize: 13 }}>Redirecting to login...</div>
        </>
      ) : (
        <>
          <div style={{
            width: 40, height: 40, border: '2px solid #7c3aed',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <div style={{ color: '#9ca3af', fontSize: 15 }}>{status}</div>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}