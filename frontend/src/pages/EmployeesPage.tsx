import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Lock, Unlock, Filter, UserX, Eye } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface Employee {
  id: number; firstName: string; lastName: string; email: string;
  phone: string; position: string; status: string; hireDate: string;
  salary: number; departmentId: number;
  department?: { id: number; name: string };
}
interface Department { id: number; name: string; }

const statusClasses: Record<string, string> = {
  active: 'badge-active', blocked: 'badge-blocked',
  on_leave: 'badge-on_leave', terminated: 'badge-terminated',
};
const avatarColors = ['#6c5ce7', '#10b981', '#e84393', '#3b82f6', '#f59e0b', '#ef4444'];

const initForm = { firstName: '', lastName: '', email: '', phone: '', position: '', hireDate: '', salary: '', departmentId: '', status: 'active' };

const EmployeesPage: React.FC = () => {
  const { t } = useLang();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | 'view' | null>(null);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [form, setForm] = useState<any>(initForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterDept) params.departmentId = filterDept;
      const [empRes, deptRes] = await Promise.all([api.get('/employees', { params }), api.get('/departments')]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, filterStatus, filterDept]);

  const openAdd = () => { setForm(initForm); setSelected(null); setModal('add'); };
  const openEdit = (emp: Employee) => {
    setSelected(emp);
    setForm({
      firstName: emp.firstName, lastName: emp.lastName, email: emp.email,
      phone: emp.phone || '', position: emp.position || '', hireDate: emp.hireDate || '',
      salary: emp.salary || '', departmentId: emp.departmentId || '', status: emp.status,
    });
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, salary: form.salary ? +form.salary : undefined, departmentId: form.departmentId ? +form.departmentId : undefined };
      if (modal === 'add') { await api.post('/employees', payload); toast.success('Employee added!'); }
      else { await api.put(`/employees/${selected!.id}`, payload); toast.success('Employee updated!'); }
      setModal(null); load();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/employees/${selected!.id}`);
      toast.success('Employee deleted'); setModal(null); load();
    } catch { toast.error('Delete failed'); }
    finally { setSaving(false); }
  };

  const toggleBlock = async (emp: Employee) => {
    try {
      const endpoint = emp.status === 'blocked' ? 'unblock' : 'block';
      await api.patch(`/employees/${emp.id}/${endpoint}`);
      toast.success(emp.status === 'blocked' ? 'Employee unblocked' : 'Employee blocked');
      load();
    } catch { toast.error('Action failed'); }
  };

  const getInitials = (emp: Employee) => `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase();
  const getAvatarBg = (id: number) => avatarColors[id % avatarColors.length];

  const fmtSalary = (s: number) => s ? `${Number(s).toLocaleString()} MAD` : '—';
  const fmtStatus = (s: string) => s.replace('_', ' ');

  return (
    <div className="animate-slide">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('employeeDir')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            {employees.length} {employees.length === 1 ? t('employeeFound') : t('employeesFound')}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} />{t('addEmp')}
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div className="search-bar">
          <div className="search-input-wrap" style={{ flex: '1 1 200px' }}>
            <Search size={15} className="search-icon" />
            <input className="form-control" placeholder={t('searchPlaceholder')}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select className="form-control" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: '140px' }}>
              <option value="">{t('allStatuses')}</option>
              <option value="active">{t('active')}</option>
              <option value="blocked">{t('blocked')}</option>
              <option value="on_leave">{t('onLeave')}</option>
              <option value="terminated">{t('terminated')}</option>
            </select>
            <select className="form-control" value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ minWidth: '160px' }}>
              <option value="">{t('allDepts')}</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner" /></div>
        ) : employees.length === 0 ? (
          <div className="empty-state"><UserX size={48} /><p>{t('noEmployees')}</p><span style={{ fontSize: '13px' }}>{t('adjustFilters')}</span></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('employee')}</th>
                  <th>{t('email')}</th>
                  <th>{t('position')}</th>
                  <th>{t('department')}</th>
                  <th>{t('hireDate')}</th>
                  <th>{t('salary')}</th>
                  <th>{t('status')}</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => (
                  <tr key={emp.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar" style={{ background: getAvatarBg(emp.id) }}>{getInitials(emp)}</div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.phone || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{emp.email}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{emp.position || '—'}</td>
                    <td>
                      {emp.department ? (
                        <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '12px', background: 'rgba(139,92,246,0.12)', color: 'var(--purple)', fontWeight: 500 }}>
                          {emp.department.name}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{emp.hireDate || '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--teal)' }}>{fmtSalary(emp.salary)}</td>
                    <td>
                      <span className={`badge ${statusClasses[emp.status] || 'badge-active'}`}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                        {fmtStatus(emp.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title={t('viewProfile')}
                          onClick={() => { setSelected(emp); setModal('view'); }}>
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title={t('editEmp')}
                          onClick={() => openEdit(emp)}>
                          <Edit2 size={14} />
                        </button>
                        {user?.role === 'admin' && (
                          <>
                            <button className="btn btn-ghost btn-icon btn-sm"
                              title={emp.status === 'blocked' ? 'Unblock' : 'Block'}
                              onClick={() => toggleBlock(emp)}
                              style={{ color: emp.status === 'blocked' ? 'var(--teal)' : 'var(--amber)' }}>
                              {emp.status === 'blocked' ? <Unlock size={14} /> : <Lock size={14} />}
                            </button>
                            <button className="btn btn-ghost btn-icon btn-sm" title={t('deleteEmp')}
                              onClick={() => { setSelected(emp); setModal('delete'); }}
                              style={{ color: 'var(--red)' }}>
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">{modal === 'add' ? t('addEmp') : t('editEmp')}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">{t('firstName')} *</label>
                  <input className="form-control" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Alice" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('lastName')} *</label>
                  <input className="form-control" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Martin" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('email')} *</label>
                  <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="alice@company.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('phone')}</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+212 6 00 00 00 00" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('position')}</label>
                  <input className="form-control" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} placeholder="Developer" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('department')}</label>
                  <select className="form-control" value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
                    <option value="">{t('allDepts')}</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('hireDate')}</label>
                  <input className="form-control" type="date" value={form.hireDate} onChange={e => setForm({ ...form, hireDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('salary')} (MAD)</label>
                  <input className="form-control" type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="50000" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('status')}</label>
                <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">{t('active')}</option>
                  <option value="blocked">{t('blocked')}</option>
                  <option value="on_leave">{t('onLeave')}</option>
                  <option value="terminated">{t('terminated')}</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModal(null)}>{t('cancel')}</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSave} disabled={saving}>
                  {saving ? t('saving') : modal === 'add' ? t('addEmp') : t('saveChanges')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Profile */}
      {modal === 'view' && selected && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{t('viewProfile')}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '4px 0' }}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="avatar" style={{ width: '64px', height: '64px', fontSize: '22px', background: getAvatarBg(selected.id) }}>
                  {getInitials(selected)}
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                    {selected.firstName} {selected.lastName}
                  </h2>
                  <span className={`badge ${statusClasses[selected.status] || 'badge-active'}`}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                    {fmtStatus(selected.status)}
                  </span>
                </div>
              </div>

              {/* Info grid */}
              <div className="modal-grid" style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                {[
                  { label: t('emailAddress'), value: selected.email, color: 'var(--text-primary)' },
                  { label: t('phoneNumber'), value: selected.phone || '—', color: 'var(--text-primary)' },
                  { label: t('department'), value: selected.department?.name || '—', color: 'var(--text-primary)' },
                  { label: t('position'), value: selected.position || '—', color: 'var(--text-primary)' },
                  { label: t('hireDate'), value: selected.hireDate || '—', color: 'var(--text-primary)' },
                  { label: t('salary'), value: fmtSalary(selected.salary), color: 'var(--teal)' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontWeight: 500, color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModal(null)}>{t('cancel')}</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEdit(selected)}>{t('editEmp')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {modal === 'delete' && selected && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash2 size={26} color="var(--red)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{t('deleteEmp')}?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                {selected.firstName} {selected.lastName} — {t('deleteEmpMsg')}
              </p>
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

export default EmployeesPage;
