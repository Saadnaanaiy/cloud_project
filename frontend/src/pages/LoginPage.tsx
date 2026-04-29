import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { Lock, Mail, Eye, EyeOff, Users } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      toast.error('Please complete the CAPTCHA');
      return;
    }
    setLoading(true);
    try {
      await login(email, password, captchaToken);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = 'Invalid credentials. Please try again.';
      
      if (err.response) {
        msg = err.response.data?.message || msg;
      } else if (err.request) {
        msg = 'No response from server. Please check your internet connection or API URL.';
      } else {
        msg = err.message || 'An unexpected error occurred.';
      }

      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Subtle background glow — theme-aware opacity */}
      <div className="auth-glow-1" />
      <div className="auth-glow-2" />

      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '16px',
            background: 'var(--brand)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px', boxShadow: 'var(--shadow-md)',
          }}>
            <Users size={36} color="var(--brand-text)" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>
            {t('loginTitle')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('loginSubtitle')}</p>
        </div>

        {/* Card */}
        <div className="auth-card" style={{ padding: '40px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">{t('emailLabel')}</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" className="form-control auth-input" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@company.com" required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('passwordLabel')}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPass ? 'text' : 'password'} className="form-control auth-input"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: '44px' }}
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
                onChange={(token) => setCaptchaToken(token)}
                theme="dark"
              />
            </div>

            <button type="submit" className="btn btn-primary auth-btn" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
              {loading
                ? <><div className="spinner" style={{ width: '18px', height: '18px', borderTopColor: 'var(--brand-text)' }} /> {t('signingIn')}</>
                : t('signIn')}
            </button>
          </form>

          {/* Sign up link */}
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'none' }}>
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
