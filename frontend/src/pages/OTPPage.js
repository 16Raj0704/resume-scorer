import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const S = {
  page: { minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" },
  box: { width: '100%', maxWidth: 420, padding: '0 24px' },
  logo: { width: 48, height: 48, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 },
  h1: { color: '#f1f0ff', fontSize: 26, fontWeight: 700, margin: '0 0 8px', letterSpacing: '-0.5px' },
  sub: { color: '#6b7280', fontSize: 14, marginBottom: 36, lineHeight: 1.6 },
  otpBox: { width: 52, height: 60, textAlign: 'center', fontSize: 24, fontWeight: 700, background: '#0f0f1a', border: '1.5px solid #1e1e2e', borderRadius: 10, color: '#f1f0ff', outline: 'none', fontFamily: 'inherit', caretColor: '#7c3aed' },
  otpBoxFocus: { border: '1.5px solid #7c3aed' },
  btnPrimary: { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
};

export default function OTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const inputRefs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOTP, resendOTP } = useAuth();

  const email = location.state?.email || '';
  const name = location.state?.name || '';

  // Redirect if no email in state
  useEffect(() => {
    if (!email) navigate('/register');
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // Auto focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (idx, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newOtp = [...otp];
    newOtp[idx] = value.slice(-1); // only last digit
    setOtp(newOtp);
    // Auto advance
    if (value && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
      setFocusedIdx(idx + 1);
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
      setFocusedIdx(idx - 1);
    }
    if (e.key === 'ArrowLeft' && idx > 0) { inputRefs.current[idx - 1]?.focus(); setFocusedIdx(idx - 1); }
    if (e.key === 'ArrowRight' && idx < 5) { inputRefs.current[idx + 1]?.focus(); setFocusedIdx(idx + 1); }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
      setFocusedIdx(5);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return toast.error('Enter the 6-digit code');
    setLoading(true);
    try {
      await verifyOTP(email, code);
      toast.success('Email verified! Welcome to ResumeMatch 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP. Try again.');
      // Shake and clear on error
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => { inputRefs.current[0]?.focus(); setFocusedIdx(0); }, 100);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await resendOTP(email);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      toast.success('New OTP sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const otpComplete = otp.every(d => d !== '');

  return (
    <div style={S.page}>
      <div style={S.box}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={S.logo}>✉</div>
          <h1 style={S.h1}>Check your email</h1>
          <p style={S.sub}>
            We sent a 6-digit code to<br />
            <strong style={{ color: '#a78bfa' }}>{email}</strong><br />
            Enter it below to verify your account.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* OTP input boxes */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 32 }} onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={el => inputRefs.current[idx] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                onFocus={() => setFocusedIdx(idx)}
                style={{
                  ...S.otpBox,
                  border: focusedIdx === idx ? '1.5px solid #7c3aed' : digit ? '1.5px solid #4f46e5' : '1.5px solid #1e1e2e',
                  background: digit ? '#0d0d1f' : '#0f0f1a',
                  transition: 'all 0.15s',
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || !otpComplete}
            style={{ ...S.btnPrimary, opacity: (loading || !otpComplete) ? 0.6 : 1, cursor: (loading || !otpComplete) ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        {/* Resend */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          {countdown > 0 ? (
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              Resend code in <span style={{ color: '#a78bfa', fontWeight: 600 }}>{countdown}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              style={{ background: 'none', border: 'none', color: '#a78bfa', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
            >
              {resendLoading ? 'Sending...' : '↻ Resend code'}
            </button>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 13, marginTop: 20 }}>
          Wrong email?{' '}
          <span onClick={() => navigate('/register')} style={{ color: '#a78bfa', cursor: 'pointer', fontWeight: 500 }}>
            Go back
          </span>
        </p>
      </div>
    </div>
  );
}