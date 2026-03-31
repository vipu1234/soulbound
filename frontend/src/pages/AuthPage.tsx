import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../api';

type Step = 'form' | 'otp';

export default function AuthPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>(params.get('mode') === 'register' ? 'register' : 'login');
  const [step, setStep] = useState<Step>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/discover'); }, [user]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', { email, password });
      toast(`OTP sent to ${email}`, 'success');
      setStep('otp');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Registration failed', 'error');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      toast('Email verified! Let\'s build your profile.', 'success');
      navigate('/onboarding');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Invalid OTP', 'error');
    } finally { setLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast('Welcome back! 💍', 'success');
      navigate('/discover');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Login failed', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="glass auth-card">
        <div className="auth-logo">💍 SoulBound</div>

        {step === 'form' && (
          <>
            <div className="auth-tabs">
              <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => setMode('login')}>Sign In</button>
              <button className={`auth-tab${mode === 'register' ? ' active' : ''}`} onClick={() => setMode('register')}>Register</button>
            </div>

            {mode === 'login' ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
                <div className="auth-divider">Don't have an account? <button type="button" style={{ background:'none',border:'none',color:'var(--primary)',cursor:'pointer',fontWeight:600 }} onClick={() => setMode('register')}>Register free</button></div>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Create Password</label>
                  <input className="form-input" type="password" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required />
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Sending OTP...' : 'Create Account'}</button>
                <p className="form-hint" style={{ textAlign:'center' }}>By registering you agree to our Privacy Policy & Terms.</p>
              </form>
            )}
          </>
        )}

        {step === 'otp' && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <div style={{ textAlign:'center', marginBottom:8 }}>
              <div style={{ fontSize:48, marginBottom:8 }}>📧</div>
              <h2 style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>Check your email</h2>
              <p style={{ color:'var(--text-muted)', fontSize:14 }}>We sent a 6-digit code to <strong>{email}</strong></p>
            </div>
            <div className="form-group">
              <label className="form-label">Enter OTP</label>
              <input className="form-input otp-input" type="text" placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} pattern="\d{6}" required style={{ textAlign:'center', fontSize:28, letterSpacing:10 }} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify Email'}</button>
            <div className="auth-divider">
              Didn't receive it?{' '}
              <button type="button" style={{ background:'none',border:'none',color:'var(--primary)',cursor:'pointer',fontWeight:600 }} onClick={async () => { await api.post('/auth/resend-otp', { email }); toast('OTP resent!', 'info'); }}>Resend OTP</button>
            </div>
            <p className="form-hint" style={{ textAlign:'center', color:'var(--text-dim)' }}>💡 In dev mode, check the backend console for the OTP.</p>
          </form>
        )}
      </div>
    </div>
  );
}
