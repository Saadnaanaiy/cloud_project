import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { Bell, Sun, Moon, User, LogOut, Settings, Menu } from 'lucide-react';

const Topbar: React.FC<{ title: string, setMobileMenuOpen: (open: boolean) => void }> = ({ title, setMobileMenuOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, dir } = useLang();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarColors = ['#6c5ce7', '#10b981', '#e84393', '#3b82f6', '#f59e0b', '#ef4444'];
  const avatarBg = user ? avatarColors[user.id % avatarColors.length] : '#6c5ce7';
  const initials = user ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <header className="topbar-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0', display: window.innerWidth > 768 ? 'none' : 'block' }}
        >
          <Menu size={22} color="var(--text-primary)" />
        </button>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h2>
          <p className="hide-on-mobile" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dateStr} — {timeStr}</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Language selector */}
        <div ref={langRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 10px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--bg-surface)',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
              color: 'var(--text-primary)', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}
          >
            <img src={`https://flagcdn.com/w20/${lang === 'fr' ? 'fr' : lang === 'ar' ? 'ma' : 'gb'}.png`} alt="flag" style={{ width: '16px', borderRadius: '2px', objectFit: 'cover', height: '12px' }} />
            {lang.toUpperCase()}
          </button>
          
          {langOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)',
              right: 0, width: '110px', background: 'var(--bg-surface)',
              border: '1px solid var(--border)', borderRadius: '8px',
              boxShadow: 'var(--shadow-md)', zIndex: 200,
              padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px',
              animation: 'slideUp 0.15s ease'
            }}>
              {[
                { code: 'en', flag: 'gb', label: 'English' },
                { code: 'fr', flag: 'fr', label: 'Français' },
                { code: 'ar', flag: 'ma', label: 'العربية' },
              ].map(l => (
                <button key={l.code}
                  onClick={() => { setLang(l.code as any); setLangOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    width: '100%', padding: '6px 10px', background: lang === l.code ? 'var(--btn-ghost-hover)' : 'transparent',
                    border: 'none', borderRadius: '4px', cursor: 'pointer',
                    fontSize: '12px', color: 'var(--text-primary)', textAlign: 'left',
                    fontFamily: 'inherit', fontWeight: lang === l.code ? 600 : 400
                  }}
                  onMouseEnter={e => { if (lang !== l.code) e.currentTarget.style.background = 'var(--bg-surface-hover)' }}
                  onMouseLeave={e => { if (lang !== l.code) e.currentTarget.style.background = 'transparent' }}
                >
                  <img src={`https://flagcdn.com/w20/${l.flag}.png`} alt={l.code} style={{ width: '16px', borderRadius: '2px', objectFit: 'cover', height: '12px' }} />
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Toggle Theme" style={{ color: 'var(--text-secondary)' }}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button className="btn btn-ghost btn-icon" style={{ position: 'relative', color: 'var(--text-secondary)' }}>
          <Bell size={18} />
          <span style={{ position: 'absolute', top: '6px', right: '6px', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--red)', border: '2px solid var(--bg-surface)' }} />
        </button>

        {/* Profile dropdown */}
        {user && (
          <div ref={dropRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '5px 10px 5px 5px', borderRadius: '999px',
                border: '1px solid var(--border)', background: 'transparent',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--btn-ghost-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%',
                background: avatarBg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#fff',
              }}>
                {initials}
              </div>
              <div className="hide-on-mobile" style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.2 }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</div>
              </div>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)',
                ...(dir === 'rtl' ? { left: 0 } : { right: 0 }),
                width: '200px', background: 'var(--bg-surface)',
                border: '1px solid var(--border)', borderRadius: '10px',
                boxShadow: 'var(--shadow-lg)', zIndex: 200,
                animation: 'slideUp 0.15s ease',
                overflow: 'hidden',
              }}>
                {/* User info header */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>{user.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{user.email}</div>
                </div>
                {/* Menu items */}
                {[
                  { icon: User, label: 'My Profile', action: () => { navigate('/profile'); setDropdownOpen(false); } },
                  { icon: Settings, label: 'Settings', action: () => { navigate('/profile'); setDropdownOpen(false); } },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      width: '100%', padding: '10px 16px', background: 'none',
                      border: 'none', fontSize: '13px', color: 'var(--text-secondary)',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--btn-ghost-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <item.icon size={15} color="var(--text-muted)" />
                    {item.label}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  <button onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      width: '100%', padding: '10px 16px', background: 'none',
                      border: 'none', fontSize: '13px', color: 'var(--red)',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <LogOut size={15} color="var(--red)" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
