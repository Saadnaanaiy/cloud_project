import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface Dept { id: number; name: string; description: string; }

const deptColors = ['#6c5ce7', '#10b981', '#e84393', '#3b82f6', '#f59e0b', '#ef4444'];

const DepartmentsPage: React.FC = () => {
  const { t } = useLang();
  const { user } = useAuth();
  const [depts, setDepts] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Dept | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const r = await api.get('/departments'); setDepts(r.data); }
    catch { toast.error('Failed to load departments'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'add') { await api.post('/departments', form); toast.success('Department created!'); }
      else { await api.put(`/departments/${selected!.id}`, form); toast.success('Department updated!'); }
      setModal(null); load();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await api.delete(`/departments/${selected!.id}`); toast.success('Deleted'); setModal(null); load(); }
    catch { toast.error('Delete failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="animate-slide">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('deptManagement')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            {depts.length} {t('deptsConfigured')}
          </p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => { setForm({ name: '', description: '' }); setModal('add'); }}>
            <Plus size={16} />{t('addDept')}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><div className="spinner" /></div>
      ) : depts.length === 0 ? (
        <div className="empty-state" style={{ padding: '80px' }}>
          <Building2 size={48} />
          <p>{t('noData')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {depts.map((dept, i) => (
            <div key={dept.id} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '12px',
                  background: deptColors[i % deptColors.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Building2 size={22} color="#fff" />
                </div>
                {user?.role === 'admin' && (
                  <div className="action-btns">
                    <button className="btn btn-ghost btn-icon btn-sm" title={t('editDept')}
                      onClick={() => { setSelected(dept); setForm({ name: dept.name, description: dept.description }); setModal('edit'); }}>
                      <Edit2 size={13} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" title={t('deleteDept')}
                      style={{ color: 'var(--red)' }}
                      onClick={() => { setSelected(dept); setModal('delete'); }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>{dept.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {dept.description || t('noDesc')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'add' ? t('newDept') : t('editDept')}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">{t('deptName')} *</label>
                <input className="form-control" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Engineering" />
              </div>
              <div className="form-group">
                <label className="form-label">{t('deptDesc')}</label>
                <textarea className="form-control" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder={t('deptDescPlaceholder')} rows={3}
                  style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setModal(null)}>{t('cancel')}</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleSave} disabled={saving || !form.name}>
                  {saving ? t('saving') : t('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {modal === 'delete' && selected && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal" style={{ maxWidth: '380px', textAlign: 'center' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(239,68,68,0.12)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
              }}>
                <Trash2 size={24} color="var(--red)" />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>"{selected.name}"?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t('deleteDeptMsg')}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModal(null)}>{t('cancel')}</button>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={handleDelete} disabled={saving}>
                {saving ? t('deleting') : t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
