import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, UserCheck, UserX, Clock, FileDown, FileSpreadsheet, TrendingUp, Building2 } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const COLORS = ['#6c5ce7', '#00b894', '#f59e0b', '#ef4444', '#3b82f6', '#e84393'];

const DashboardPage: React.FC = () => {
  const { t } = useLang();
  const [stats, setStats] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/employees/stats'),
      api.get(`/attendance/stats/monthly?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`),
    ]).then(([statsRes, monthlyRes]) => {
      setStats(statsRes.data);
      setMonthlyData(monthlyRes.data.map((d: any) => {
        let formattedDate = d.date;
        if (d.date) {
          try {
            // Re-parse it properly to include the H:M:S
            const dateObj = new Date(d.date);
            const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            formattedDate = `${dateStr} ${timeStr}`;
          } catch {
            formattedDate = d.date; // Fallback
          }
        }
        return {
          date: formattedDate,
          present: parseInt(d.present) || 0,
          absent: parseInt(d.absent) || 0,
          late: parseInt(d.late) || 0,
        };
      }));
    }).catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const downloadReport = async (type: 'pdf' | 'excel') => {
    setExporting(type);
    try {
      const res = await api.get(`/reports/${type}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_employes_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} report downloaded!`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(null); }
  };

  const kpis = [
    { label: t('totalEmployees'), value: stats?.total ?? '—', icon: Users, color: 'var(--brand-hover)', sub: t('allRegistered') },
    { label: t('activeEmployees'), value: stats?.active ?? '—', icon: UserCheck, color: 'var(--teal)', sub: t('currentlyWorking') },
    { label: t('blocked'), value: stats?.blocked ?? '—', icon: UserX, color: 'var(--red)', sub: t('accessSuspended') },
    { label: t('onLeave'), value: stats?.onLeave ?? '—', icon: Clock, color: 'var(--amber)', sub: t('temporarilyAbsent') },
  ];

  const deptData = (stats?.byDepartment || []).map((d: any) => ({ name: d.department || 'Unknown', value: parseInt(d.count) }));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '16px' }}>
      <div className="spinner" />
      <span style={{ color: 'var(--text-muted)' }}>Loading dashboard...</span>
    </div>
  );

  return (
    <div className="animate-slide">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('welcomeBoard')} <span>{t('dashboard')}</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>{t('dashDesc')}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-ghost" onClick={() => downloadReport('excel')} disabled={!!exporting}>
            <FileSpreadsheet size={16} color="var(--teal)" />
            {exporting === 'excel' ? t('generating') : t('exportExcel')}
          </button>
          <button className="btn btn-primary" onClick={() => downloadReport('pdf')} disabled={!!exporting}>
            <FileDown size={16} />
            {exporting === 'pdf' ? t('generating') : t('exportPdf')}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass-card kpi-card" style={{ cursor: 'default' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <kpi.icon size={22} color={kpi.color} />
              </div>
              <TrendingUp size={14} color="var(--text-muted)" />
            </div>
            <div className="kpi-value" style={{ color: 'var(--text-primary)' }}>
              {kpi.value}
            </div>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-sub">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Attendance trend */}
        <div className="glass-card chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <TrendingUp size={18} color="var(--brand)" />
            <h3 className="chart-title" style={{ margin: 0 }}>{t('attTrends')}</h3>
          </div>
          {monthlyData.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px' }}>
              <p>No data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)' }} cursor={{ fill: 'var(--border)', opacity: 0.4 }} />
                <Legend wrapperStyle={{ color: 'var(--text-primary)', fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="present" stackId="a" fill="var(--brand)" name={t('present')} />
                <Bar dataKey="late" stackId="a" fill="var(--amber)" name={t('late')} />
                <Bar dataKey="absent" stackId="a" fill="var(--red)" name={t('absent')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Dept distribution */}
        <div className="glass-card chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Building2 size={18} color="var(--teal)" />
            <h3 className="chart-title" style={{ margin: 0 }}>{t('deptDist')}</h3>
          </div>
          {deptData.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px' }}><p>No data</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={deptData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
                  {deptData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                <Legend formatter={(v) => <span style={{ color: 'var(--text-primary)', fontSize: '11px' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Secondary Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Bar chart */}
        <div className="glass-card chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Building2 size={18} color="var(--brand)" />
            <h3 className="chart-title" style={{ margin: 0 }}>{t('empPerDept')}</h3>
          </div>
          {deptData.length === 0 ? (
            <div className="empty-state"><p>No data</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                <Bar dataKey="value" name={t('employees')} radius={[6, 6, 0, 0]}>
                  {deptData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Distribution */}
        <div className="glass-card chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <UserCheck size={18} color="var(--brand)" />
            <h3 className="chart-title" style={{ margin: 0 }}>Employee Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie 
                data={[
                  { name: 'Active', value: stats?.active || 0, color: '#10b981' },
                  { name: 'On Leave', value: stats?.onLeave || 0, color: '#f59e0b' },
                  { name: 'Blocked', value: stats?.blocked || 0, color: '#ef4444' }
                ].filter(d => d.value > 0)}
                cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value"
              >
                {([
                  { name: 'Active', value: stats?.active || 0, color: '#10b981' },
                  { name: 'On Leave', value: stats?.onLeave || 0, color: '#f59e0b' },
                  { name: 'Blocked', value: stats?.blocked || 0, color: '#ef4444' }
                ].filter(d => d.value > 0)).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
              <Legend formatter={(v) => <span style={{ color: 'var(--text-primary)', fontSize: '11px' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
