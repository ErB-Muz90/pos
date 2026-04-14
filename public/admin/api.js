// ── Config ────────────────────────────────────────────────────────────────
const API = (window.BANDUKA_API_URL || '').replace(/\/$/, '')
  || (window.location.port === '3006' ? 'http://localhost:3000' : window.location.origin);
const BASE = `${API}/api/v1`;

// ── HTTP helpers ──────────────────────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (res.status === 401) { logout(); throw new Error('Session expired'); }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || res.statusText);
  return body?.data ?? body;
}

const apiGet  = (path) => apiFetch(path);
const apiPost = (path, data) => apiFetch(path, { method: 'POST', body: JSON.stringify(data) });
const apiPatch = (path, data) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(data) });
const apiDel  = (path) => apiFetch(path, { method: 'DELETE' });

// ── Shared UI helpers ─────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function statusBadge(s) {
  const m = { active:'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20', trial:'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    expired:'bg-rose-500/10 text-rose-300 border border-rose-500/20', suspended:'bg-slate-500/10 text-slate-300 border border-slate-500/20', deleted:'bg-red-500/20 text-red-200 border border-red-500/30' };
  return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${m[s]||'bg-slate-500/10 text-slate-300 border border-slate-500/20'}">${esc(s)}</span>`;
}

function statCard(label, value, color = 'text-white') {
  const iconMap = {
    'Total Orgs': '▣',
    'Active': '●',
    'Trial': '◔',
    'Expired': '◌',
    'Total Users': '◉',
    'New Orgs (30d)': '◫',
    'Sales (30d)': '◈',
    'Revenue (30d)': '◎',
    'Users': '◉',
    'Branches': '◫',
    'Products': '◧',
    'Total Sales': '◈',
  };
  return `<div class="rounded-[1.35rem] border border-white/10 bg-white/5 backdrop-blur-sm p-4 shadow-lg shadow-slate-950/20 relative overflow-hidden">
    <div class="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/5 blur-2xl"></div>
    <div class="relative">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-300">${iconMap[label] || '◦'}</div>
        <div class="text-[10px] uppercase tracking-[0.2em] text-slate-500">Live</div>
      </div>
      <p class="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wide">${label}</p>
      <p class="text-2xl font-bold ${color}">${value}</p>
    </div>
  </div>`;
}

function glassPanel(content, extra = '') {
  return `<div class="rounded-[1.4rem] border border-white/10 bg-white/5 backdrop-blur-sm ${extra}">${content}</div>`;
}

function primaryButton(label, attrs = '') {
  return `<button ${attrs} class="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl text-sm hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20">${label}</button>`;
}

function pageTitle(title, backView) {
  return `<div class="flex items-center gap-3 mb-6">
    ${backView ? `<button onclick="navigate('${backView}')" class="text-slate-400 hover:text-white text-sm">← Back</button>` : ''}
    <div>
      <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Super Admin</p>
      <h1 class="text-2xl font-bold text-white">${esc(title)}</h1>
    </div>
  </div>`;
}

function toast(msg, isError = false) {
  const t = document.createElement('div');
  t.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white text-sm shadow-lg z-50 ${isError ? 'bg-red-600' : 'bg-green-600'}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '—'; }
function fmtNum(n) { return Number(n || 0).toLocaleString(); }
function planPriceFallback(name) {
  const map = { starter: 'Ksh 2,500', professional: 'Ksh 7,500', enterprise: 'Custom' };
  return map[String(name || '').toLowerCase()] || 'Custom';
}

function getAccessLevel(user) {
  return user?.permissions?.superAdminAccess || 'full_access';
}

function canWriteSuperAdmin() {
  return getAccessLevel(state.user) === 'full_access';
}

function accessLevelBadge(level) {
  const value = level === 'read_only' ? 'read_only' : 'full_access';
  const styles = value === 'read_only'
    ? 'bg-sky-500/10 text-sky-200 border border-sky-500/20'
    : 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20';
  return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}">${value === 'read_only' ? 'Read Only' : 'Full Access'}</span>`;
}

// ── Login view ────────────────────────────────────────────────────────────
function renderLogin() {
  return `
  <div class="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.2),_transparent_28%),linear-gradient(180deg,_#020617,_#0f172a)] px-4">
    <div class="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div class="text-center mb-6">
        <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-500/30">B</div>
        <h1 class="text-xl font-bold text-white">Super Admin</h1>
        <p class="text-sm text-slate-400 mt-1">Bandu POS Platform</p>
      </div>
      ${state.error ? `<div class="bg-red-500/10 border border-red-500/30 text-red-200 text-sm rounded-xl px-3 py-2 mb-4">${esc(state.error)}</div>` : ''}
      <form id="loginForm" class="space-y-4">
        <input id="saUser" type="text" placeholder="Username" value="superadmin"
          class="w-full border border-white/10 bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400" />
        <input id="saPass" type="password" placeholder="Password"
          class="w-full border border-white/10 bg-white/5 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400" />
        <button type="submit" ${state.loading ? 'disabled' : ''}
          class="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-semibold py-2 rounded-xl text-sm transition disabled:opacity-50">
          ${state.loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  </div>`;
}
