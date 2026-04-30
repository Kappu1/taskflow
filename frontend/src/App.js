import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { projectsAPI, tasksAPI, usersAPI } from './utils/api';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  indigo: '#4F46E5', indigoDark: '#3730A3', indigoLight: '#EEF2FF',
  emerald: '#10B981', emeraldLight: '#ECFDF5',
  amber: '#F59E0B', amberLight: '#FFFBEB',
  rose: '#F43F5E', roseLight: '#FFF1F2',
  s50: '#F8FAFC', s100: '#F1F5F9', s200: '#E2E8F0', s300: '#CBD5E1',
  s400: '#94A3B8', s500: '#64748B', s600: '#475569', s700: '#334155',
  s800: '#1E293B', s900: '#0F172A',
};

const st = {
  input: { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 14, outline: 'none', background: C.s50, boxSizing: 'border-box', color: C.s800 },
  label: { fontSize: 12, fontWeight: 600, color: C.s600, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  select: { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 14, outline: 'none', background: C.s50, boxSizing: 'border-box', color: C.s800 },
  textarea: { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 14, outline: 'none', background: C.s50, boxSizing: 'border-box', color: C.s800, minHeight: 80, resize: 'vertical' },
  card: { background: '#fff', borderRadius: 14, border: `1px solid ${C.s100}`, padding: '20px' },
  fg: { marginBottom: 16 },
  statusBadge: (s) => {
    const m = { Todo: [C.s100, C.s600], 'In Progress': [C.indigoLight, C.indigo], Done: [C.emeraldLight, C.emerald], Overdue: [C.roseLight, C.rose] };
    const [bg, color] = m[s] || m.Todo;
    return { background: bg, color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'inline-block' };
  },
  priorityBadge: (p) => {
    const m = { High: [C.roseLight, C.rose], Medium: [C.amberLight, C.amber], Low: [C.emeraldLight, C.emerald] };
    const [bg, color] = m[p] || m.Medium;
    return { background: bg, color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'inline-block' };
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const avatarColors = [C.indigo, C.emerald, '#8B5CF6', '#EC4899', C.amber];
const getAvatarColor = (id) => avatarColors[(id?.charCodeAt(id?.length - 1) || 0) % avatarColors.length];
const isOverdue = (task) => task.status !== 'Done' && task.dueDate && new Date(task.dueDate) < new Date();
const getDisplayStatus = (task) => (task.isOverdue || isOverdue(task)) ? 'Overdue' : task.status;
const extractError = (err) => err?.response?.data?.message || err?.message || 'Something went wrong';

// ─── UI Components ────────────────────────────────────────────────────────────
function Avatar({ user, size = 32 }) {
  if (!user) return null;
  const color = getAvatarColor(user._id || user.id);
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color + '22', color, fontSize: size * 0.38, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {user.avatar || user.name?.slice(0, 2).toUpperCase() || '??'}
    </div>
  );
}

function Spinner() {
  return <div style={{ textAlign: 'center', padding: '40px', color: C.s400, fontSize: 14 }}>Loading…</div>;
}

function Toast({ msg, type = 'error', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'success' ? C.emerald : type === 'info' ? C.indigo : C.rose;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, background: bg, color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, maxWidth: 360, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 10 }}>
      {type === 'success' ? '✓' : '⚠'} {msg}
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 8, fontSize: 16 }}>×</button>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 18, padding: '28px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.s900 }}>{title}</h2>
          <button onClick={onClose} style={{ background: C.s100, border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: C.s500 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen() {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', email: 'alice@demo.com', password: 'admin123', confirm: '', role: 'Member' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleLogin = async () => {
    setError(''); setLoading(true);
    try { await login(form.email, form.password); }
    catch (err) { setError(extractError(err)); }
    finally { setLoading(false); }
  };

  const handleSignup = async () => {
    setError(''); setSuccess('');
    if (!form.name.trim()) return setError('Full name is required.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.role);
      setSuccess('Account created! Signing you in…');
    } catch (err) { setError(extractError(err)); }
    finally { setLoading(false); }
  };

  const handleKey = (fn) => (e) => e.key === 'Enter' && fn();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${C.s900} 0%, ${C.indigoDark} 100%)`, padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 420, boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: C.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚡</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.s900, letterSpacing: '-0.02em' }}>TaskFlow</div>
            <div style={{ fontSize: 12, color: C.s500 }}>Team Task Manager</div>
          </div>
        </div>
        {/* Tab */}
        <div style={{ display: 'flex', background: C.s100, borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {['login', 'signup'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); setSuccess(''); setForm(f => ({ ...f, email: t === 'login' ? 'alice@demo.com' : '', password: t === 'login' ? 'admin123' : '' })); }}
              style={{ flex: 1, padding: '8px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, background: tab === t ? '#fff' : 'transparent', color: tab === t ? C.s900 : C.s400, transition: 'all 0.15s' }}>
              {t === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: C.s900, marginBottom: 4 }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: C.s500, marginBottom: 24 }}>Sign in to your workspace</p>
            <div style={st.fg}><label style={st.label}>Email</label><input style={st.input} type="email" value={form.email} onChange={set('email')} onKeyDown={handleKey(handleLogin)} /></div>
            <div style={st.fg}><label style={st.label}>Password</label><input style={st.input} type="password" value={form.password} onChange={set('password')} onKeyDown={handleKey(handleLogin)} /></div>
            {error && <p style={{ color: C.rose, fontSize: 13, marginBottom: 8, fontWeight: 500 }}>⚠ {error}</p>}
            <button disabled={loading} onClick={handleLogin} style={{ width: '100%', padding: '12px', borderRadius: 10, background: loading ? C.s300 : C.indigo, color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <div style={{ marginTop: 20, padding: 14, background: C.s50, borderRadius: 10, fontSize: 12, color: C.s500 }}>
              <strong style={{ color: C.s700 }}>Demo accounts:</strong><br />
              Admin: alice@demo.com / admin123<br />
              Member: bob@demo.com / member123
            </div>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: C.s900, marginBottom: 4 }}>Create account</h1>
            <p style={{ fontSize: 14, color: C.s500, marginBottom: 24 }}>Join your team on TaskFlow</p>
            <div style={st.fg}><label style={st.label}>Full Name *</label><input style={st.input} value={form.name} onChange={set('name')} placeholder="Jane Smith" onKeyDown={handleKey(handleSignup)} /></div>
            <div style={st.fg}><label style={st.label}>Email *</label><input style={st.input} type="email" value={form.email} onChange={set('email')} placeholder="jane@company.com" onKeyDown={handleKey(handleSignup)} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={st.fg}><label style={st.label}>Password *</label><input style={st.input} type="password" value={form.password} onChange={set('password')} placeholder="Min 6 chars" /></div>
              <div style={st.fg}><label style={st.label}>Confirm *</label><input style={st.input} type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat" onKeyDown={handleKey(handleSignup)} /></div>
            </div>
            <div style={st.fg}>
              <label style={st.label}>Role</label>
              <select style={st.select} value={form.role} onChange={set('role')}><option>Member</option><option>Admin</option></select>
            </div>
            {error && <p style={{ color: C.rose, fontSize: 13, marginBottom: 8, fontWeight: 500 }}>⚠ {error}</p>}
            {success && <p style={{ color: C.emerald, fontSize: 13, marginBottom: 8, fontWeight: 500 }}>✓ {success}</p>}
            <button disabled={loading} onClick={handleSignup} style={{ width: '100%', padding: '12px', borderRadius: 10, background: loading ? C.s300 : C.indigo, color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
            <p style={{ textAlign: 'center', fontSize: 13, color: C.s400, marginTop: 16 }}>
              Already have an account? <span onClick={() => setTab('login')} style={{ color: C.indigo, cursor: 'pointer', fontWeight: 600 }}>Sign in</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      tasksAPI.getDashboard(),
      tasksAPI.getAll({ assignee: user._id }),
      projectsAPI.getAll(),
    ]).then(([s, t, p]) => {
      setStats(s.data.stats);
      setMyTasks(t.data.tasks.slice(0, 6));
      setProjects(p.data.projects.slice(0, 4));
    }).finally(() => setLoading(false));
  }, [user._id]);

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: C.s900, marginBottom: 4, letterSpacing: '-0.02em' }}>Good day, {user.name.split(' ')[0]} 👋</h1>
      <p style={{ fontSize: 14, color: C.s500, marginBottom: 24 }}>Here's what's happening across your workspace</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Tasks', num: stats?.totalTasks ?? 0, color: C.indigo, icon: '📋' },
          { label: 'In Progress', num: stats?.inProgress ?? 0, color: C.amber, icon: '🔄' },
          { label: 'Completed', num: stats?.done ?? 0, color: C.emerald, icon: '✅' },
          { label: 'Overdue', num: stats?.overdue ?? 0, color: C.rose, icon: '⚠️' },
        ].map(({ label, num, color, icon }) => (
          <div key={label} style={st.card}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{num}</div>
            <div style={{ fontSize: 13, color: C.s500, marginTop: 4, fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={st.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: C.s800 }}>My Assigned Tasks</h3>
          {myTasks.length === 0 ? <p style={{ color: C.s400, fontSize: 14 }}>No tasks assigned to you.</p> :
            myTasks.map((task, i) => (
              <div key={task._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < myTasks.length - 1 ? `1px solid ${C.s100}` : 'none' }}>
                <span style={st.statusBadge(getDisplayStatus(task))}>{getDisplayStatus(task)}</span>
                <span style={{ fontSize: 13, fontWeight: 500, flex: 1, color: C.s700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                {task.project && <span style={{ fontSize: 11, color: C.s400 }}>{task.project.name}</span>}
              </div>
            ))}
        </div>
        <div style={st.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: C.s800 }}>Projects Overview</h3>
          {projects.map(project => {
            const ts = project.taskStats || {};
            const pct = ts.total ? Math.round((ts.done / ts.total) * 100) : 0;
            return (
              <div key={project._id} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.s700 }}>{project.name}</span>
                  <span style={{ fontSize: 13, color: C.s400 }}>{ts.done}/{ts.total}</span>
                </div>
                <div style={{ background: C.s100, borderRadius: 20, height: 6 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: project.color || C.indigo, borderRadius: 20, transition: 'width 0.5s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Projects View ────────────────────────────────────────────────────────────
function ProjectsView({ user, onSelectProject, toast }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: '#4F46E5', members: [] });
  const isAdmin = user.role === 'Admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, us] = await Promise.all([projectsAPI.getAll(), usersAPI.getAll()]);
      setProjects(pr.data.projects);
      setAllUsers(us.data.users);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.name.trim()) return toast('Project name is required', 'error');
    setSaving(true);
    try {
      await projectsAPI.create({ ...form, members: [...new Set([user._id, ...form.members])] });
      toast('Project created!', 'success');
      setShowModal(false);
      setForm({ name: '', description: '', color: '#4F46E5', members: [] });
      load();
    } catch (err) { toast(extractError(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try { await projectsAPI.delete(id); toast('Project deleted', 'info'); load(); }
    catch (err) { toast(extractError(err)); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.s900, margin: 0 }}>Projects</h1>
          <p style={{ fontSize: 14, color: C.s500, margin: '4px 0 0' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && <button onClick={() => setShowModal(true)} style={{ padding: '8px 18px', borderRadius: 9, background: C.indigo, color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>+ New Project</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {projects.map(project => {
          const ts = project.taskStats || {};
          const pct = ts.total ? Math.round((ts.done / ts.total) * 100) : 0;
          return (
            <div key={project._id} onClick={() => onSelectProject(project)} style={{ ...st.card, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: project.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📁</div>
                {isAdmin && <button onClick={e => handleDelete(e, project._id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.s300, fontSize: 16, padding: 4 }}>🗑</button>}
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: C.s800 }}>{project.name}</h3>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: C.s400, lineHeight: 1.5 }}>{project.description || 'No description'}</p>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: C.s400 }}>
                  <span>{ts.done || 0}/{ts.total || 0} tasks</span><span>{pct}%</span>
                </div>
                <div style={{ background: C.s100, borderRadius: 20, height: 5 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: project.color, borderRadius: 20 }} />
                </div>
              </div>
              <div style={{ display: 'flex' }}>
                {(project.members || []).slice(0, 5).map((m, i) => (
                  <div key={m._id || i} style={{ marginLeft: i > 0 ? -8 : 0, border: '2px solid #fff', borderRadius: '50%' }}>
                    <Avatar user={m} size={26} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="New Project" onClose={() => setShowModal(false)}>
          <div style={st.fg}><label style={st.label}>Project Name *</label><input style={st.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Website Redesign" /></div>
          <div style={st.fg}><label style={st.label}>Description</label><textarea style={st.textarea} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div style={st.fg}>
            <label style={st.label}>Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['#4F46E5', '#10B981', '#F43F5E', '#F59E0B', '#8B5CF6'].map(c => (
                <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? `3px solid ${C.s800}` : '3px solid transparent' }} />
              ))}
            </div>
          </div>
          <div style={st.fg}>
            <label style={st.label}>Add Members</label>
            {allUsers.filter(u => u._id !== user._id).map(u => (
              <label key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.members.includes(u._id)} onChange={e => setForm(f => ({ ...f, members: e.target.checked ? [...f.members, u._id] : f.members.filter(id => id !== u._id) }))} />
                <Avatar user={u} size={28} /><span style={{ fontSize: 14 }}>{u.name}</span><span style={{ fontSize: 12, color: C.s400 }}>({u.role})</span>
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 9, background: C.s100, color: C.s700, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleCreate} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 9, background: C.indigo, color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>{saving ? 'Creating…' : 'Create Project'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Tasks (Kanban board per project) ─────────────────────────────────────────
function TasksView({ user, project, onBack, toast }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [form, setForm] = useState({ title: '', description: '', status: 'Todo', priority: 'Medium', dueDate: '', assignee: '' });
  const isAdmin = user.role === 'Admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tasksAPI.getByProject(project._id);
      setTasks(res.data.tasks);
    } finally { setLoading(false); }
  }, [project._id]);

  useEffect(() => { load(); }, [load]);

  const filtered = tasks.filter(t => {
    const sm = filterStatus === 'All' || t.status === filterStatus || (filterStatus === 'Overdue' && isOverdue(t));
    const am = filterAssignee === 'All' || t.assignee?._id === filterAssignee;
    return sm && am;
  });

  const openCreate = () => { setEditTask(null); setForm({ title: '', description: '', status: 'Todo', priority: 'Medium', dueDate: '', assignee: user._id }); setShowModal(true); };
  const openEdit = (task) => { setEditTask(task); setForm({ title: task.title, description: task.description || '', status: task.status, priority: task.priority, dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '', assignee: task.assignee?._id || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.title.trim()) return toast('Title is required', 'error');
    setSaving(true);
    try {
      if (editTask) {
        await tasksAPI.update(editTask._id, form);
        toast('Task updated', 'success');
      } else {
        await tasksAPI.create(project._id, form);
        toast('Task created!', 'success');
      }
      setShowModal(false);
      load();
    } catch (err) { toast(extractError(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try { await tasksAPI.delete(id); toast('Task deleted', 'info'); load(); }
    catch (err) { toast(extractError(err)); }
  };

  const cycleStatus = async (task) => {
    const canEdit = isAdmin || task.assignee?._id === user._id || task.createdBy?._id === user._id;
    if (!canEdit) return;
    const cycle = ['Todo', 'In Progress', 'Done'];
    const next = cycle[(cycle.indexOf(task.status) + 1) % cycle.length];
    try { await tasksAPI.update(task._id, { status: next }); load(); }
    catch (err) { toast(extractError(err)); }
  };

  const members = project.members || [];
  const columns = ['Todo', 'In Progress', 'Done'];

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.s400, fontSize: 20, padding: 0 }}>←</button>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: project.color }} />
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.s900, margin: 0 }}>{project.name}</h1>
      </div>
      <p style={{ fontSize: 14, color: C.s500, marginBottom: 20, marginLeft: 44 }}>{project.description}</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={{ ...st.select, width: 'auto', padding: '7px 12px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          {['All', 'Todo', 'In Progress', 'Done', 'Overdue'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select style={{ ...st.select, width: 'auto', padding: '7px 12px' }} value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
          <option value="All">All Members</option>
          {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button onClick={openCreate} style={{ padding: '8px 18px', borderRadius: 9, background: C.indigo, color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>+ Add Task</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {columns.map(col => {
          const colTasks = filterStatus === 'Overdue'
            ? (col === 'Todo' ? filtered : [])
            : filtered.filter(t => t.status === col);
          return (
            <div key={col}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={st.statusBadge(col)}>{col}</span>
                <span style={{ fontSize: 13, color: C.s400, fontWeight: 600 }}>{colTasks.length}</span>
              </div>
              {colTasks.map(task => {
                const dispStatus = getDisplayStatus(task);
                const canEdit = isAdmin || task.assignee?._id === user._id || task.createdBy?._id === user._id;
                return (
                  <div key={task._id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.s100}`, padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.s800, flex: 1 }}>{task.title}</span>
                      {canEdit && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => openEdit(task)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: C.s300 }}>✏️</button>
                          {(isAdmin || task.createdBy?._id === user._id) && <button onClick={() => handleDelete(task._id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: C.s300 }}>🗑</button>}
                        </div>
                      )}
                    </div>
                    {task.description && <p style={{ fontSize: 12, color: C.s400, margin: '0 0 10px', lineHeight: 1.5 }}>{task.description}</p>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      <span style={st.priorityBadge(task.priority)}>{task.priority}</span>
                      {dispStatus === 'Overdue' && <span style={st.statusBadge('Overdue')}>Overdue</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {task.assignee && <><Avatar user={task.assignee} size={24} /><span style={{ fontSize: 12, color: C.s400 }}>{task.assignee.name?.split(' ')[0]}</span></>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {task.dueDate && <span style={{ fontSize: 11, color: dispStatus === 'Overdue' ? C.rose : C.s400 }}>📅 {task.dueDate.slice(0, 10)}</span>}
                        {canEdit && <button onClick={() => cycleStatus(task)} style={{ background: C.s50, border: `1px solid ${C.s200}`, borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: C.s600, fontWeight: 600 }}>→</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title={editTask ? 'Edit Task' : 'New Task'} onClose={() => setShowModal(false)}>
          <div style={st.fg}><label style={st.label}>Title *</label><input style={st.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" /></div>
          <div style={st.fg}><label style={st.label}>Description</label><textarea style={st.textarea} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={st.fg}><label style={st.label}>Assignee</label>
              <select style={st.select} value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div style={st.fg}><label style={st.label}>Status</label>
              <select style={st.select} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {['Todo', 'In Progress', 'Done'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={st.fg}><label style={st.label}>Priority</label>
              <select style={st.select} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {['Low', 'Medium', 'High'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={st.fg}><label style={st.label}>Due Date</label>
              <input style={st.input} type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 9, background: C.s100, color: C.s700, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 9, background: C.indigo, color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>{saving ? 'Saving…' : (editTask ? 'Save Changes' : 'Create Task')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── All Tasks ────────────────────────────────────────────────────────────────
function AllTasksView({ user, toast }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user.role === 'Admin';

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await tasksAPI.getAll(); setTasks(res.data.tasks); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cycleStatus = async (task) => {
    const canEdit = isAdmin || task.assignee?._id === user._id || task.createdBy?._id === user._id;
    if (!canEdit) return;
    const cycle = ['Todo', 'In Progress', 'Done'];
    const next = cycle[(cycle.indexOf(task.status) + 1) % cycle.length];
    try { await tasksAPI.update(task._id, { status: next }); load(); }
    catch (err) { toast(extractError(err)); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: C.s900, marginBottom: 4 }}>All Tasks</h1>
      <p style={{ fontSize: 14, color: C.s500, marginBottom: 24 }}>{tasks.length} tasks across all projects</p>
      <div style={st.card}>
        {tasks.length === 0 ? <p style={{ color: C.s400 }}>No tasks found.</p> :
          tasks.map((task, i) => {
            const dispStatus = getDisplayStatus(task);
            const canEdit = isAdmin || task.assignee?._id === user._id || task.createdBy?._id === user._id;
            return (
              <div key={task._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < tasks.length - 1 ? `1px solid ${C.s100}` : 'none' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: task.project?.color || C.s300, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.s800 }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: C.s400 }}>{task.project?.name}</div>
                </div>
                <span style={st.priorityBadge(task.priority)}>{task.priority}</span>
                <span style={st.statusBadge(dispStatus)}>{dispStatus}</span>
                {task.assignee && <Avatar user={task.assignee} size={26} />}
                {task.dueDate && <span style={{ fontSize: 12, color: dispStatus === 'Overdue' ? C.rose : C.s400, minWidth: 80, textAlign: 'right' }}>📅 {task.dueDate.slice(0, 10)}</span>}
                {canEdit && <button onClick={() => cycleStatus(task)} style={{ background: C.s50, border: `1px solid ${C.s200}`, borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer', color: C.s600, fontWeight: 600, whiteSpace: 'nowrap' }}>Next →</button>}
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─── Team View ────────────────────────────────────────────────────────────────
function TeamView({ user, toast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Member' });
  const { signup } = useAuth();
  const isAdmin = user.role === 'Admin';

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await usersAPI.getAll(); setUsers(res.data.users); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return toast('All fields are required', 'error');
    if (form.password.length < 6) return toast('Password must be at least 6 characters', 'error');
    setSaving(true);
    try {
      // Use signup endpoint — it creates and returns the user
      const res = await fetch((process.env.REACT_APP_API_URL || '/api') + '/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast('Member added!', 'success');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'Member' });
      load();
    } catch (err) { toast(err.message || 'Failed to create user'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (id === user._id) return toast('You cannot remove yourself', 'error');
    if (!window.confirm('Deactivate this user?')) return;
    try { await usersAPI.delete(id); toast('User deactivated', 'info'); load(); }
    catch (err) { toast(extractError(err)); }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.s900, margin: 0 }}>Team</h1>
          <p style={{ fontSize: 14, color: C.s500, margin: '4px 0 0' }}>{users.length} active members</p>
        </div>
        {isAdmin && <button onClick={() => setShowModal(true)} style={{ padding: '8px 18px', borderRadius: 9, background: C.indigo, color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>+ Add Member</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {users.map(u => (
          <div key={u._id} style={st.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Avatar user={u} size={44} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.s800 }}>{u.name} {u._id === user._id && <span style={{ fontSize: 11, color: C.s400 }}>(you)</span>}</div>
                  <div style={{ fontSize: 12, color: C.s400 }}>{u.email}</div>
                </div>
              </div>
              {isAdmin && u._id !== user._id && <button onClick={() => handleDelete(u._id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.s300, fontSize: 14 }}>🗑</button>}
            </div>
            <hr style={{ border: 'none', borderTop: `1px solid ${C.s100}`, margin: '14px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.s400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</div>
                <span style={{ ...st.statusBadge(u.role === 'Admin' ? 'In Progress' : 'Todo'), marginTop: 4 }}>{u.role}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: C.s400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joined</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.s700, marginTop: 4 }}>{new Date(u.createdAt).toLocaleDateString('en', { month: 'short', year: '2-digit' })}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="Add Team Member" onClose={() => setShowModal(false)}>
          <div style={st.fg}><label style={st.label}>Full Name *</label><input style={st.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" /></div>
          <div style={st.fg}><label style={st.label}>Email *</label><input style={st.input} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@company.com" /></div>
          <div style={st.fg}><label style={st.label}>Password *</label><input style={st.input} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" /></div>
          <div style={st.fg}><label style={st.label}>Role</label>
            <select style={st.select} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}><option>Member</option><option>Admin</option></select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 9, background: C.s100, color: C.s700, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleCreate} disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 9, background: C.indigo, color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>{saving ? 'Adding…' : 'Add Member'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'error') => setToast({ msg, type }), []);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${C.s900} 0%, ${C.indigoDark} 100%)` }}>
      <div style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>Loading TaskFlow…</div>
    </div>
  );

  if (!user) return <AuthScreen />;

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'projects', label: 'Projects', icon: '📁' },
    { id: 'tasks', label: 'All Tasks', icon: '✅' },
    { id: 'team', label: 'Team', icon: '👥' },
  ];

  const renderContent = () => {
    switch (view) {
      case 'dashboard': return <Dashboard user={user} />;
      case 'projects': return <ProjectsView user={user} onSelectProject={p => { setSelectedProject(p); setView('project-tasks'); }} toast={showToast} />;
      case 'project-tasks': return selectedProject ? <TasksView user={user} project={selectedProject} onBack={() => setView('projects')} toast={showToast} /> : null;
      case 'tasks': return <AllTasksView user={user} toast={showToast} />;
      case 'team': return <TeamView user={user} toast={showToast} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", background: C.s50 }}>
      {/* Sidebar */}
      <div style={{ width: 240, minHeight: '100vh', background: C.s900, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 16px', borderBottom: `1px solid ${C.s700}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: C.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>TaskFlow</div>
              <div style={{ fontSize: 11, color: C.s400 }}>Team Manager</div>
            </div>
          </div>
        </div>
        <nav style={{ padding: '12px 0', flex: 1 }}>
          <div style={{ padding: '8px 16px', fontSize: 11, color: C.s600, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Menu</div>
          {nav.map(item => {
            const active = view === item.id || (view === 'project-tasks' && item.id === 'projects');
            return (
              <div key={item.id} onClick={() => { setView(item.id); if (item.id !== 'projects') setSelectedProject(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', margin: '2px 8px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 400, color: active ? '#fff' : C.s400, background: active ? C.indigo : 'transparent', transition: 'all 0.15s' }}>
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </div>
            );
          })}
        </nav>
        <div style={{ padding: '16px', borderTop: `1px solid ${C.s700}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Avatar user={user} size={34} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: C.s400 }}>{user.role}</div>
            </div>
          </div>
          <button onClick={logout} style={{ width: '100%', padding: '8px', borderRadius: 8, background: C.s800, border: 'none', color: C.s300, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Sign Out</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '28px', overflow: 'auto' }}>
        {renderContent()}
      </div>

      {/* Toast notifications */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
