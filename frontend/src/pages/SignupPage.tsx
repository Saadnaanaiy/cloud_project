import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import { Lock, Mail, Eye, EyeOff, Users, User, ChevronDown } from 'lucide-react';

const roleOptions = [
  { value: 'hr', label: 'HR Manager' },
  { value: 'employee', label: 'Employee' },
  { value: 'admin', label: 'Administrator' },
];

const Field = ({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) => (
  <div className="form-group">
    <label className="form-label" htmlFor={id}>{label}</label>
    {children}
    {error && <span style={{ fontSize: '12px', color: 'var(--red)', marginTop: '2px' }}>{error}</span>}
  </div>
);

const SignupPage: React.FC = () => {
  const { register } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'hr' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      toast.success('Account created! Welcome 🎉');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-glow-1" />
      <div className="auth-glow-2" />

      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '16px', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: 'var(--shadow-md)' }}>
            <Users size={36} color="var(--brand-text)" />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Register to manage your organization</p>
        </div>

        {/* Card */}
        <div className="auth-card" style={{ padding: '40px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Name */}
            <Field id="name" label="Full Name" error={errors.name}>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="name" type="text" className="form-control auth-input"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ borderColor: errors.name ? 'var(--red)' : undefined }}
                  placeholder="John Doe" />
              </div>
            </Field>

            {/* Email */}
            <Field id="email" label={t('emailLabel')} error={errors.email}>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="email" type="email" className="form-control auth-input"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ borderColor: errors.email ? 'var(--red)' : undefined }}
                  placeholder="john@company.com" />
              </div>
            </Field>

            {/* Role */}
            <div className="form-group">
              <label className="form-label" htmlFor="role">Role</label>
              <div style={{ position: 'relative' }}>
                <select id="role" className="form-control auth-input"
                  value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                  style={{ paddingRight: '36px', appearance: 'none', paddingLeft: '14px' }}>
                  {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <ChevronDown size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Password */}
            <Field id="password" label={t('passwordLabel')} error={errors.password}>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="password" type={showPass ? 'text' : 'password'} className="form-control auth-input"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ paddingRight: '44px', borderColor: errors.password ? 'var(--red)' : undefined }}
                  placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {/* Confirm password */}
            <Field id="confirmPassword" label="Confirm Password" error={errors.confirmPassword}>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="confirmPassword" type={showConfirm ? 'text' : 'password'} className="form-control auth-input"
                  value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  style={{ paddingRight: '44px', borderColor: errors.confirmPassword ? 'var(--red)' : undefined }}
                  placeholder="Repeat password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <button type="submit" className="btn btn-primary auth-btn" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
              {loading
                ? <><div className="spinner" style={{ width: '18px', height: '18px', borderTopColor: 'var(--brand-text)' }} /> Creating account...</>
                : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--purple)', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
