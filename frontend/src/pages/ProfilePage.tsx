import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, Calendar, Edit2, Key, Save, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const roleColors: Record<string, string> = { admin: 'var(--purple)', hr: 'var(--teal)', manager: 'var(--amber)' };
const roleBg: Record<string, string> = {
  admin: 'rgba(139,92,246,0.12)',
  hr: 'rgba(16,185,129,0.12)',
  manager: 'rgba(245,158,11,0.12)',
};
const avatarColors = ['#6c5ce7', '#10b981', '#e84393', '#3b82f6', '#f59e0b', '#ef4444'];

interface ProfileData {
  id: number; name: string; email: string; role: string;
  createdAt: string; updatedAt: string;
}

const ProfilePage: React.FC = () => {
  const { refreshUser } = useAuth();
  const { t } = useLang();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<'info' | 'password' | null>(null);

  // Info edit form
  const [infoForm, setInfoForm] = useState({ name: '', email: '' });
  const [savingInfo, setSavingInfo] = useState(false);

  // Password change form
  const [passForm, setPassForm] = useState({ newPassword: '', confirmPassword: '' });
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    api.get('/auth/me').then(r => {
      setProfile(r.data);
      setInfoForm({ name: r.data.name, email: r.data.email });
    }).catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveInfo = async () => {
    if (!infoForm.name.trim() || !infoForm.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setSavingInfo(true);
    try {
      const { data } = await api.put('/auth/me', { name: infoForm.name, email: infoForm.email });
      setProfile(prev => prev ? { ...prev, ...data } : prev);
      await refreshUser();
      toast.success('Profile updated!');
      setEditMode(null);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Update failed');
    } finally { setSavingInfo(false); }
  };

  const handleChangePassword = async () => {
    if (passForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (passForm.newPassword !== passForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSavingPass(true);
    try {
      await api.put('/auth/me', { password: passForm.newPassword });
      toast.success('Password changed!');
      setPassForm({ newPassword: '', confirmPassword: '' });
      setEditMode(null);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to change password');
    } finally { setSavingPass(false); }
  };

  const initials = (name: string) => name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '16px' }}>
      <div className="spinner" /><span style={{ color: 'var(--text-muted)' }}>Loading profile...</span>
    </div>
  );

  if (!profile) return null;

  const avatarBg = avatarColors[profile.id % avatarColors.length];

  return (
    <div className="animate-slide" style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My <span>Profile</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>View and manage your account information</p>
        </div>
      </div>

      {/* Avatar & name hero */}
      <div className="glass-card" style={{ padding: '32px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', background: avatarBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {initials(profile.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>{profile.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
              background: roleBg[profile.role] || 'var(--bg-main)',
              color: roleColors[profile.role] || 'var(--text-secondary)',
            }}>
              <Shield size={12} />
              {profile.role.toUpperCase()}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ID #{profile.id}</span>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(editMode === 'info' ? null : 'info')} style={{ flexShrink: 0 }}>
          {editMode === 'info' ? <><X size={14} /> Cancel</> : <><Edit2 size={14} /> Edit</>}
        </button>
      </div>

      {/* Edit info form */}
      {editMode === 'info' && (
        <div className="glass-card animate-slide" style={{ padding: '24px', marginBottom: '20px', border: '1px solid var(--purple)', borderColor: 'rgba(139,92,246,0.4)' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '20px', fontSize: '15px' }}>Edit Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" value={infoForm.name} onChange={e => setInfoForm({ ...infoForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('emailLabel')}</label>
              <input type="email" className="form-control" value={infoForm.email} onChange={e => setInfoForm({ ...infoForm, email: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-ghost" onClick={() => setEditMode(null)}>{t('cancel')}</button>
            <button className="btn btn-primary" onClick={handleSaveInfo} disabled={savingInfo}>
              {savingInfo ? <><div className="spinner" style={{ width: '14px', height: '14px', borderTopColor: 'var(--brand-text)' }} /> Saving...</> : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </div>
      )}

      {/* Info grid */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '20px', fontSize: '15px', color: 'var(--text-secondary)' }}>Account Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {[
            { icon: User, label: 'Full Name', value: profile.name, color: 'var(--purple)' },
            { icon: Mail, label: t('emailLabel'), value: profile.email, color: 'var(--blue)' },
            { icon: Shield, label: 'Role', value: profile.role.charAt(0).toUpperCase() + profile.role.slice(1), color: roleColors[profile.role] },
            { icon: Calendar, label: 'Member since', value: fmtDate(profile.createdAt), color: 'var(--teal)' },
            { icon: Calendar, label: 'Last updated', value: fmtDate(profile.updatedAt), color: 'var(--amber)' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'var(--bg-main)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={17} color={color} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{label}</div>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editMode === 'password' ? '20px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Key size={17} color="var(--red)" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '15px' }}>Change Password</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Update your account password</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(editMode === 'password' ? null : 'password')}>
            {editMode === 'password' ? <><X size={14} /> Cancel</> : <><Key size={14} /> Change</>}
          </button>
        </div>

        {editMode === 'password' && (
          <div className="animate-slide">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-control"
                  value={passForm.newPassword} onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })}
                  placeholder="Min. 6 characters" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-control"
                  value={passForm.confirmPassword} onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                  placeholder="Repeat password" />
              </div>
            </div>
            {passForm.newPassword && passForm.confirmPassword && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontSize: '13px' }}>
                {passForm.newPassword === passForm.confirmPassword
                  ? <><Check size={14} color="var(--teal)" /><span style={{ color: 'var(--teal)' }}>Passwords match</span></>
                  : <><X size={14} color="var(--red)" /><span style={{ color: 'var(--red)' }}>Passwords do not match</span></>}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost" onClick={() => setEditMode(null)}>{t('cancel')}</button>
              <button className="btn btn-danger" onClick={handleChangePassword} disabled={savingPass}>
                {savingPass ? <><div className="spinner" style={{ width: '14px', height: '14px', borderTopColor: '#fff' }} /> Saving...</> : <><Key size={14} /> Update Password</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
