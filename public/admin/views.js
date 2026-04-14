// ── 1. Dashboard ──────────────────────────────────────────────────────────
function renderDashboard(d) {
  if (!d) return '';
  const byTier = d.byTier || [];
  const totalTierCount = byTier.reduce((sum, item) => sum + Number(item.count || 0), 0) || 1;
  const activity = [
    { label: 'UNSUSPEND_ORG', target: 'Organization restored', date: 'Today', tone: 'bg-emerald-400' },
    { label: 'CHANGE_SUBSCRIPTION', target: 'Subscription changed', date: 'Today', tone: 'bg-sky-400' },
    { label: 'CREATE_TENANT', target: 'New organization onboarded', date: 'Today', tone: 'bg-orange-400' },
    { label: 'UPDATE_FEATURE_FLAG', target: 'Feature access updated', date: 'Yesterday', tone: 'bg-violet-400' },
  ];
  return `
  ${pageTitle('Platform Dashboard')}
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    ${statCard('Total Orgs', fmtNum(d.orgs.total))}
    ${statCard('Active', fmtNum(d.orgs.active), 'text-emerald-300')}
    ${statCard('Trial', fmtNum(d.orgs.trial), 'text-amber-300')}
    ${statCard('Expired', fmtNum(d.orgs.expired), 'text-rose-300')}
  </div>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    ${statCard('Total Users', fmtNum(d.users.total))}
    ${statCard('New Orgs (30d)', fmtNum(d.orgs.newLast30Days), 'text-sky-300')}
    ${statCard('Sales (30d)', fmtNum(d.revenue.salesLast30Days))}
    ${statCard('Revenue (30d)', 'KES ' + fmtNum(d.revenue.amountLast30Days), 'text-orange-300')}
  </div>
  <div class="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 mb-6">
    <div class="rounded-[1.4rem] border border-white/10 bg-white/5 backdrop-blur-sm p-6">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="font-semibold text-white text-lg">By Plan</h2>
          <p class="text-sm text-slate-400">Subscription mix across active organizations</p>
        </div>
        <div class="rounded-xl bg-orange-500/10 px-3 py-1 text-xs text-orange-200">30 day view</div>
      </div>
      <div class="space-y-4">
        ${byTier.map(t => `
          <div>
            <div class="flex items-center justify-between text-sm mb-1.5">
              <span class="text-white capitalize">${esc(t.tier)}</span>
              <span class="text-slate-400">${fmtNum(t.count)} organizations</span>
            </div>
            <div class="h-2.5 rounded-full bg-white/5 overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r ${t.tier === 'starter' ? 'from-sky-500 to-cyan-400' : t.tier === 'professional' ? 'from-fuchsia-500 to-violet-500' : 'from-emerald-500 to-teal-400'}" style="width:${Math.max(12, Math.round((Number(t.count || 0) / totalTierCount) * 100))}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="mt-6 grid sm:grid-cols-3 gap-3">
        ${byTier.map(t => `
          <div class="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3">
            <div class="text-[11px] uppercase tracking-[0.2em] text-slate-500">${esc(t.tier)}</div>
            <div class="mt-2 text-2xl font-bold text-white">${fmtNum(t.count)}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="rounded-[1.4rem] border border-white/10 bg-white/5 backdrop-blur-sm p-6">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="font-semibold text-white text-lg">Recent Activity</h2>
          <p class="text-sm text-slate-400">Latest platform events</p>
        </div>
        <button onclick="navigate('audit')" class="text-sm text-orange-300 hover:text-orange-200">View all →</button>
      </div>
      <div class="space-y-3">
        ${activity.map(item => `
          <div class="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
            <span class="mt-1 h-2.5 w-2.5 rounded-full ${item.tone}"></span>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-white">${item.label}</div>
              <div class="text-xs text-slate-400">${item.target}</div>
            </div>
            <div class="text-[11px] uppercase tracking-wide text-slate-500">${item.date}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>`;
}

// ── 2. Tenants ────────────────────────────────────────────────────────────
function renderTenants(res) {
  const orgs = res?.data || [];
  const meta = res?.meta || {};
  return `
  ${pageTitle('Tenant Management')}
  <div class="flex items-center justify-between gap-4 mb-4 flex-wrap">
    <div>
      <p class="text-sm text-slate-400">Manage organizations, plans, and account state.</p>
    </div>
    ${primaryButton('+ New Tenant')}
  </div>
  <div class="flex gap-2 mb-4 flex-wrap">
    <input id="orgSearch" type="text" placeholder="Search name or PIN…" value="${esc(state.data.orgSearch||'')}"
      class="border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 flex-1 min-w-40" />
    <select id="orgStatus" class="border border-white/10 bg-white/5 text-slate-200 rounded-xl px-3 py-2 text-sm">
      <option value="">All Status</option>
      ${['active','trial','expired','suspended'].map(s => `<option value="${s}" ${state.data.orgStatusFilter===s?'selected':''}>${s}</option>`).join('')}
    </select>
    <select id="orgTier" class="border border-white/10 bg-white/5 text-slate-200 rounded-xl px-3 py-2 text-sm">
      <option value="">All Plans</option>
      ${['starter','professional','enterprise'].map(t => `<option value="${t}" ${state.data.orgTierFilter===t?'selected':''}>${t}</option>`).join('')}
    </select>
    <button id="orgSearchBtn" class="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl text-sm hover:from-orange-400 hover:to-amber-400">Search</button>
  </div>
  <div class="rounded-[1.4rem] border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-white/5 text-slate-400 text-xs uppercase">
        <tr>
          <th class="px-4 py-2 text-left">Organization</th>
          <th class="px-4 py-2 text-left">PIN</th>
          <th class="px-4 py-2 text-left">Plan</th>
          <th class="px-4 py-2 text-left">Status</th>
          <th class="px-4 py-2 text-left">Users</th>
          <th class="px-4 py-2 text-left">Sales</th>
          <th class="px-4 py-2 text-left">Joined</th>
          <th class="px-4 py-2"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        ${orgs.map(o => `
        <tr class="hover:bg-white/5">
          <td class="px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-orange-200">▣</div>
              <div>
                <p class="font-medium text-white">${esc(o.name)}</p>
                <p class="text-xs text-slate-500">${esc(o.businessType || 'organization')}</p>
              </div>
            </div>
          </td>
          <td class="px-4 py-3 text-slate-400 font-mono text-xs">${esc(o.taxPin)}</td>
          <td class="px-4 py-3"><span class="capitalize text-xs bg-white/10 text-slate-200 px-2 py-0.5 rounded-full">${esc(o.subscriptionTier)}</span></td>
          <td class="px-4 py-3">${statusBadge(o.subscriptionStatus)}</td>
          <td class="px-4 py-3 text-slate-300">${o._count?.users||0}</td>
          <td class="px-4 py-3 text-slate-300">${fmtNum(o._count?.sales||0)}</td>
          <td class="px-4 py-3 text-slate-500 text-xs">${fmtDate(o.createdAt)}</td>
          <td class="px-4 py-3 text-right">
            <button data-view-org="${o.id}" class="text-orange-500 hover:underline text-xs">View →</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
    ${meta.totalPages > 1 ? `<div class="flex justify-center gap-2 p-3 border-t border-white/10">
      ${Array.from({length: meta.totalPages}, (_,i) => `<button data-org-page="${i+1}"
        class="px-3 py-1 rounded text-xs ${meta.page===i+1?'bg-orange-500 text-white':'bg-white/10 text-slate-300 hover:bg-white/20'}">${i+1}</button>`).join('')}
    </div>` : ''}
  </div>`;
}

// ── 3. Org Detail ─────────────────────────────────────────────────────────
function renderOrgDetail(o) {
  if (!o) return '';
  return `
  ${pageTitle(o.name, 'tenants')}
  <div class="grid md:grid-cols-2 gap-4 mb-6">
    <div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
      <h2 class="font-semibold text-white mb-3">Info</h2>
      <dl class="space-y-2 text-sm">
        ${[['Tax PIN', o.taxPin],['Type', o.businessType],['Status', o.status],['Created', fmtDate(o.createdAt)]].map(([k,v]) =>
          `<div class="flex justify-between"><dt class="text-slate-400">${k}</dt><dd class="font-medium text-slate-100">${esc(String(v))}</dd></div>`).join('')}
      </dl>
    </div>
    <div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
      <h2 class="font-semibold text-white mb-3">Subscription</h2>
      <dl class="space-y-2 text-sm mb-4">
        ${[['Plan', o.subscriptionTier],['Status', o.subscriptionStatus],['Expires', fmtDate(o.subscriptionExpiresAt)],['Max Users', o.maxUsers],['Max Branches', o.maxBranches]].map(([k,v]) =>
          `<div class="flex justify-between"><dt class="text-slate-400">${k}</dt><dd class="font-medium capitalize text-slate-100">${esc(String(v))}</dd></div>`).join('')}
      </dl>
      <div class="border-t border-white/10 pt-3 space-y-2">
        <p class="text-xs text-slate-400 font-medium">Change plan</p>
        <div class="flex gap-2 flex-wrap">
          ${['starter','professional','enterprise'].map(tier =>
            `<button data-set-plan="${tier}" class="px-2 py-1 text-xs rounded bg-white/10 text-slate-200 hover:bg-orange-500/20 hover:text-orange-200 capitalize">${tier}</button>`).join('')}
        </div>
        <div class="flex gap-2 flex-wrap">
          <button data-extend="3" class="px-2 py-1 text-xs rounded bg-sky-500/15 text-sky-200 hover:bg-sky-500/25">+3 months</button>
          <button data-extend="12" class="px-2 py-1 text-xs rounded bg-sky-500/15 text-sky-200 hover:bg-sky-500/25">+12 months</button>
          <button data-expire class="px-2 py-1 text-xs rounded bg-rose-500/15 text-rose-200 hover:bg-rose-500/25">Expire now</button>
        </div>
      </div>
    </div>
  </div>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    ${statCard('Users', `${o._count?.users||0} / ${o.maxUsers}`)}
    ${statCard('Branches', `${o._count?.branches||0} / ${o.maxBranches}`)}
    ${statCard('Products', fmtNum(o._count?.products))}
    ${statCard('Total Sales', fmtNum(o.revenue?.total))}
  </div>
  <div class="rounded-[1.4rem] border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-5">
    <h2 class="font-semibold text-red-200 mb-3">Actions</h2>
    <div class="flex gap-3 flex-wrap">
      <button id="impersonateBtn" class="px-3 py-1.5 text-sm rounded-lg bg-sky-500/15 text-sky-100 hover:bg-sky-500/25 border border-sky-500/20">🔑 Login as Admin</button>
      <button id="suspendBtn" class="px-3 py-1.5 text-sm rounded-lg bg-amber-500/15 text-amber-100 hover:bg-amber-500/25 border border-amber-500/20">⏸ Suspend</button>
      <button id="unsuspendBtn" class="px-3 py-1.5 text-sm rounded-lg bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25 border border-emerald-500/20">▶ Unsuspend</button>
      <button id="deleteOrgBtn" class="px-3 py-1.5 text-sm rounded-lg bg-rose-500/15 text-rose-100 hover:bg-rose-500/25 border border-rose-500/20">🗑 Delete</button>
    </div>
  </div>`;
}

// ── 4. Plans ──────────────────────────────────────────────────────────────
function renderPlans(plans) {
  return `
  ${pageTitle('Plan Management')}
  <div class="flex items-center justify-between gap-4 mb-4 flex-wrap">
    <p class="text-sm text-slate-400">Subscription plans, limits, and commercial packaging.</p>
    ${primaryButton('+ Add Plan', 'id="addPlanBtn"')}
  </div>
  <div class="grid md:grid-cols-3 gap-4 mb-6">
    ${(plans||[]).map(p => `
    <div class="rounded-[1.5rem] border ${p.name === 'professional' ? 'border-orange-500/40 shadow-lg shadow-orange-500/10' : 'border-white/10'} bg-white/5 backdrop-blur-sm p-5 relative overflow-hidden">
      ${p.name === 'professional' ? '<div class="absolute right-4 top-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Most Popular</div>' : ''}
      <div class="flex justify-between items-start mb-3">
        <div>
          <h3 class="font-bold text-white capitalize">${esc(p.displayName)}</h3>
          <p class="text-xs text-slate-500 mt-1">Tier configuration</p>
        </div>
        <span class="text-xs px-2 py-0.5 rounded-full ${p.isActive?'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20':'bg-slate-500/10 text-slate-300 border border-slate-500/20'}">${p.isActive?'Active':'Inactive'}</span>
      </div>
      <div class="mb-4">
        <div class="text-3xl font-bold text-white">${esc(p.priceLabel || planPriceFallback(p.name))}</div>
        <div class="text-xs text-slate-500">per month</div>
      </div>
      <dl class="space-y-1 text-sm text-slate-300 mb-4">
        <div class="flex justify-between"><dt>Max Users</dt><dd class="font-medium">${p.maxUsers}</dd></div>
        <div class="flex justify-between"><dt>Max Branches</dt><dd class="font-medium">${p.maxBranches}</dd></div>
        <div class="flex justify-between"><dt>Max Products</dt><dd class="font-medium">${fmtNum(p.maxProducts)}</dd></div>
      </dl>
      <div class="flex flex-wrap gap-1">
        ${(p.features||[]).map(f => `<span class="text-xs bg-orange-500/10 text-orange-200 px-2 py-0.5 rounded-full border border-orange-500/20">${esc(f)}</span>`).join('')}
      </div>
      <div class="mt-3 grid grid-cols-2 gap-2">
        <button data-edit-plan='${JSON.stringify(p)}' class="w-full text-xs border border-white/10 rounded-xl py-1.5 text-slate-200 hover:bg-white/10">Edit Plan</button>
        <button data-delete-plan="${esc(p.name)}" class="w-full text-xs border border-rose-500/20 bg-rose-500/10 rounded-xl py-1.5 text-rose-200 hover:bg-rose-500/20">Delete</button>
      </div>
    </div>`).join('')}
  </div>
  <div id="planForm" class="rounded-[1.4rem] border border-white/10 bg-white/5 backdrop-blur-sm p-5 hidden">
    <h2 class="font-semibold text-white mb-4">Edit Plan</h2>
    <div class="grid md:grid-cols-2 gap-4">
      <div><label class="text-xs text-slate-400">Plan Key</label><input id="pKey" class="w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm mt-1" placeholder="starter" /></div>
      <div><label class="text-xs text-slate-400">Display Name</label><input id="pName" class="w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm mt-1" /></div>
      <div><label class="text-xs text-slate-400">Price Label</label><input id="pPriceLabel" class="w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm mt-1" placeholder="Ksh 2,500" /></div>
      <div><label class="text-xs text-slate-400">Max Users</label><input id="pUsers" type="number" class="w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm mt-1" /></div>
      <div><label class="text-xs text-slate-400">Max Branches</label><input id="pBranches" type="number" class="w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm mt-1" /></div>
      <div><label class="text-xs text-slate-400">Max Products</label><input id="pProducts" type="number" class="w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm mt-1" /></div>
    </div>
    <div class="flex gap-2 mt-4">
      <button id="savePlanBtn" class="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl text-sm hover:from-orange-400 hover:to-amber-400">Save</button>
      <button id="cancelPlanBtn" class="border border-white/10 px-4 py-2 rounded-xl text-sm text-slate-200 hover:bg-white/10">Cancel</button>
    </div>
  </div>`;
}

// ── 5. Feature Flags ──────────────────────────────────────────────────────
function renderFlags(flags) {
  const writeAccess = canWriteSuperAdmin();
  return `
  ${pageTitle('Feature Flags')}
  <div class="flex items-center justify-between gap-4 mb-4 flex-wrap">
    <p class="text-sm text-slate-400">Control feature access per subscription tier.</p>
    ${writeAccess ? primaryButton('+ New Feature', 'id="addFeatureBtn"') : '<div class="text-xs text-sky-200 bg-sky-500/10 border border-sky-500/20 rounded-xl px-3 py-2">Read-only access</div>'}
  </div>
  <div class="rounded-[1.4rem] border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-white/5 text-slate-400 text-xs uppercase">
        <tr>
          <th class="px-4 py-2 text-left">Feature</th>
          <th class="px-4 py-2 text-left">Key</th>
          <th class="px-4 py-2 text-center">Starter</th>
          <th class="px-4 py-2 text-center">Professional</th>
          <th class="px-4 py-2 text-center">Enterprise</th>
          <th class="px-4 py-2"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        ${(flags||[]).map(f => `
        <tr>
          <td class="px-4 py-3 font-medium text-white">
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-200">⚑</div>
              <span>${esc(f.label)}</span>
            </div>
          </td>
          <td class="px-4 py-3 text-slate-400 font-mono text-xs">${esc(f.key)}</td>
          ${['starter','professional','enterprise'].map(t => `
            <td class="px-4 py-3 text-center">
              <label class="inline-flex items-center justify-center cursor-pointer">
                <input type="checkbox" data-flag="${esc(f.key)}" data-tier="${t}" ${(f.enabledForTiers||[]).includes(t)?'checked':''} class="h-4 w-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-400" />
              </label>
            </td>`).join('')}
          <td class="px-4 py-3 text-right">
            <button data-save-flag="${esc(f.key)}" class="text-xs text-orange-500 hover:underline">Save</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
  ${writeAccess ? `
  <div id="featureForm" class="rounded-[1.4rem] border border-white/10 bg-white/5 backdrop-blur-sm p-5 mt-6 hidden">
    <h2 class="font-semibold text-white mb-4">New Feature Flag</h2>
    <div class="grid md:grid-cols-2 gap-4">
      <div><label class="text-xs text-slate-400">Feature Label</label><input id="featureLabel" class="w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm mt-1" placeholder="Advanced Reporting" /></div>
      <div><label class="text-xs text-slate-400">Feature Key</label><input id="featureKey" class="w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm mt-1" placeholder="advanced_reporting" /></div>
    </div>
    <div class="mt-4">
      <div class="text-xs text-slate-400 mb-2">Enabled For</div>
      <div class="flex gap-4 flex-wrap text-sm text-slate-300">
        ${['starter','professional','enterprise'].map(t => `
          <label class="flex items-center gap-2">
            <input type="checkbox" data-new-flag-tier="${t}" class="h-4 w-4 rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-400" />
            <span class="capitalize">${t}</span>
          </label>
        `).join('')}
      </div>
    </div>
    <div class="mt-4 flex gap-2">
      <button id="saveFeatureBtn" class="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl text-sm hover:from-orange-400 hover:to-amber-400">Create Feature</button>
      <button id="cancelFeatureBtn" class="border border-white/10 px-4 py-2 rounded-xl text-sm text-slate-200 hover:bg-white/10">Cancel</button>
    </div>
  </div>` : ''}`;
}

// ── 6. Platform Settings ──────────────────────────────────────────────────
function renderSettings(settings) {
  const s = settings || {};
  const systemKeys = ['maintenance_mode','smtp_host','smtp_port','smtp_from'];
  const securityKeys = ['support_email','app_name'];
  const writeAccess = canWriteSuperAdmin();
  return `
  ${pageTitle('Platform Settings')}
  <div class="grid lg:grid-cols-2 gap-6">
    <div class="rounded-[1.4rem] border border-white/10 bg-white/5 backdrop-blur-sm p-5">
      <h2 class="text-lg font-semibold text-white mb-4">System Configuration</h2>
      <div class="space-y-4" id="settingsForm">
        ${systemKeys.map(k => `
        <div>
          <label class="text-xs text-slate-400 font-medium uppercase tracking-wide">${k.replace(/_/g,' ')}</label>
          <input data-setting="${k}" type="${k==='maintenance_mode'?'checkbox':'text'}" value="${esc(s[k]||'')}"
            ${k==='maintenance_mode' && s[k]==='true' ? 'checked' : ''}
            class="mt-1 w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>`).join('')}
      </div>
    </div>
    <div class="rounded-[1.4rem] border border-white/10 bg-white/5 backdrop-blur-sm p-5">
      <h2 class="text-lg font-semibold text-white mb-4">Security & Support</h2>
      <div class="space-y-4">
        ${securityKeys.map(k => `
        <div>
          <label class="text-xs text-slate-400 font-medium uppercase tracking-wide">${k.replace(/_/g,' ')}</label>
          <input data-setting="${k}" type="text" value="${esc(s[k]||'')}"
            class="mt-1 w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>`).join('')}
        <div class="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
          <div class="text-sm font-medium text-white">Two-Factor Authentication</div>
          <div class="text-xs text-slate-400 mt-1">Required for all super admin accounts</div>
          <div class="mt-3 inline-flex rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-300">Enabled</div>
        </div>
      </div>
    </div>
    <div class="lg:col-span-2 rounded-[1.4rem] border border-white/10 bg-white/5 backdrop-blur-sm p-5">
      <h2 class="text-lg font-semibold text-white mb-4">Change Password</h2>
      <div class="grid md:grid-cols-3 gap-4">
        <div>
          <label class="text-xs text-slate-400 font-medium uppercase tracking-wide">Current Password</label>
          <input id="saCurrentPassword" type="password" class="mt-1 w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-xs text-slate-400 font-medium uppercase tracking-wide">New Password</label>
          <input id="saNewPassword" type="password" class="mt-1 w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="text-xs text-slate-400 font-medium uppercase tracking-wide">Confirm Password</label>
          <input id="saConfirmPassword" type="password" class="mt-1 w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm" />
        </div>
      </div>
      <div class="mt-4 flex items-center justify-between gap-4 flex-wrap">
        <p class="text-xs text-slate-500">Use at least 8 characters. Password change is allowed for both full-access and read-only super admins.</p>
        <button id="changeSaPasswordBtn" class="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-xl text-sm hover:from-orange-400 hover:to-amber-400">Update Password</button>
      </div>
    </div>
    <div class="lg:col-span-2 flex justify-end">
      <button id="saveSettingsBtn" ${writeAccess ? '' : 'disabled'} class="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-5 py-2.5 rounded-xl text-sm hover:from-orange-400 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed">Save All Settings</button>
    </div>
  </div>`;
}

// ── 7. Audit Log ──────────────────────────────────────────────────────────
function renderAudit(res) {
  const logs = res?.data || [];
  const meta = res?.meta || {};
  return `
  ${pageTitle('Super Admin Audit Log')}
  <div class="flex items-center justify-between gap-4 mb-4 flex-wrap">
    <p class="text-sm text-slate-400">Track privileged platform actions and account changes.</p>
    <div class="flex gap-2">
      <button class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">Filter</button>
      ${primaryButton('Export CSV')}
    </div>
  </div>
  <div class="rounded-[1.4rem] border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-white/5 text-slate-400 text-xs uppercase">
        <tr>
          <th class="px-4 py-2 text-left">Time</th>
          <th class="px-4 py-2 text-left">Admin</th>
          <th class="px-4 py-2 text-left">Action</th>
          <th class="px-4 py-2 text-left">Target</th>
          <th class="px-4 py-2 text-left">IP</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        ${logs.map(l => `
        <tr>
          <td class="px-4 py-2 text-xs text-slate-500">${new Date(l.createdAt).toLocaleString()}</td>
          <td class="px-4 py-2 font-medium text-white">${esc(l.adminUsername)}</td>
          <td class="px-4 py-2"><span class="font-mono text-xs bg-white/10 text-slate-200 px-2 py-0.5 rounded">${esc(l.action)}</span></td>
          <td class="px-4 py-2 text-xs text-slate-400">${esc(l.targetType||'')} ${esc(l.targetId?.slice(0,8)||'')}</td>
          <td class="px-4 py-2 text-xs text-slate-500">${esc(l.ipAddress||'')}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    ${meta.totalPages > 1 ? `<div class="flex justify-center gap-2 p-3 border-t border-white/10">
      ${Array.from({length:meta.totalPages},(_,i)=>`<button data-audit-page="${i+1}"
        class="px-3 py-1 rounded text-xs ${meta.page===i+1?'bg-orange-500 text-white':'bg-white/10 text-slate-300 hover:bg-white/20'}">${i+1}</button>`).join('')}
    </div>` : ''}
  </div>`;
}

// ── 8. SA Users ───────────────────────────────────────────────────────────
function renderAdmins(admins) {
  const writeAccess = canWriteSuperAdmin();
  return `
  ${pageTitle('Super Admin Users')}
  <div class="flex items-center justify-between gap-4 mb-4 flex-wrap">
    <p class="text-sm text-slate-400">Manage platform administrators and access posture.</p>
    ${writeAccess ? primaryButton('+ Add Admin', 'id="addAdminBtn"') : '<div class="text-xs text-sky-200 bg-sky-500/10 border border-sky-500/20 rounded-xl px-3 py-2">Read-only access</div>'}
  </div>
  <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
    ${(admins||[]).map(a => `
      <div class="rounded-[1.4rem] border border-white/10 bg-white/5 backdrop-blur-sm p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-lg font-bold text-white">${esc((a.username || 'S').slice(0,1).toUpperCase())}</div>
            <div>
              <div class="font-semibold text-white">${esc(a.username)}</div>
              <div class="text-sm text-slate-400">${esc(a.email||'')}</div>
            </div>
          </div>
          <div class="text-slate-500">⋯</div>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-2">
            <div class="text-[11px] uppercase tracking-wide text-slate-500">Role</div>
            <div class="mt-1">${accessLevelBadge(getAccessLevel(a))}</div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-2">
            <div class="text-[11px] uppercase tracking-wide text-slate-500">Status</div>
            <div class="mt-1">${statusBadge(a.status)}</div>
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <div>
            <div class="text-[11px] uppercase tracking-wide text-slate-500">Last Login</div>
            <div class="text-xs text-slate-300 mt-1">${a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : 'Never'}</div>
          </div>
          <div class="flex items-center gap-2">
            ${writeAccess ? `<button data-edit-admin='${JSON.stringify({ id: a.id, username: a.username, email: a.email || '', fullName: a.fullName || '', accessLevel: getAccessLevel(a) })}' class="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">Edit</button>` : ''}
            ${writeAccess ? `<button data-delete-admin="${a.id}" class="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200">Delete</button>` : ''}
          </div>
        </div>
      </div>
    `).join('')}
  </div>
  ${writeAccess ? `
    <div id="adminForm" class="rounded-[1.4rem] border border-white/10 bg-white/5 backdrop-blur-sm p-5 mt-6 hidden">
      <h2 class="font-semibold text-white mb-4">Super Admin Account</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <input type="hidden" id="adminId" />
        <div><label class="text-xs text-slate-400">Username</label><input id="adminUsername" class="w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm mt-1" /></div>
        <div><label class="text-xs text-slate-400">Full Name</label><input id="adminFullName" class="w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm mt-1" /></div>
        <div><label class="text-xs text-slate-400">Email</label><input id="adminEmail" type="email" class="w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm mt-1" /></div>
        <div><label class="text-xs text-slate-400">Role</label>
          <select id="adminAccessLevel" class="w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm mt-1">
            <option value="full_access">Full Access</option>
            <option value="read_only">Read Only</option>
          </select>
        </div>
        <div class="md:col-span-2"><label class="text-xs text-slate-400">Password</label><input id="adminPassword" type="password" placeholder="Required for new users only" class="w-full border border-white/10 bg-white/5 text-white rounded-xl px-3 py-2 text-sm mt-1" /></div>
      </div>
      <div class="mt-4 flex gap-2">
        <button id="saveAdminBtn" class="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl text-sm hover:from-orange-400 hover:to-amber-400">Save Admin</button>
        <button id="cancelAdminBtn" class="border border-white/10 px-4 py-2 rounded-xl text-sm text-slate-200 hover:bg-white/10">Cancel</button>
      </div>
    </div>
  ` : ''}
  `;
}

// ── Event binder ──────────────────────────────────────────────────────────
function bindViewEvents() {
  const orgId = state.data.orgId;

  // Tenant list
  document.getElementById('orgSearchBtn')?.addEventListener('click', () => {
    state.data.orgSearch = document.getElementById('orgSearch').value;
    state.data.orgStatusFilter = document.getElementById('orgStatus').value;
    state.data.orgTierFilter = document.getElementById('orgTier').value;
    navigate('tenants', { search: state.data.orgSearch, status: state.data.orgStatusFilter, tier: state.data.orgTierFilter });
  });
  document.querySelectorAll('[data-view-org]').forEach(el =>
    el.addEventListener('click', () => navigate('org', { id: el.dataset.viewOrg })));
  document.querySelectorAll('[data-org-page]').forEach(el =>
    el.addEventListener('click', () => navigate('tenants', { page: el.dataset.orgPage })));

  // Org detail actions
  if (orgId) {
    document.querySelectorAll('[data-set-plan]').forEach(el =>
      el.addEventListener('click', async () => {
        await apiPatch(`/super-admin/orgs/${orgId}/subscription`, { tier: el.dataset.setPlan, status: 'active', months: 1 });
        toast('Plan updated'); navigate('org', { id: orgId });
      }));
    document.querySelectorAll('[data-extend]').forEach(el =>
      el.addEventListener('click', async () => {
        await apiPatch(`/super-admin/orgs/${orgId}/subscription`, { tier: state.data.org.subscriptionTier, status: 'active', months: +el.dataset.extend });
        toast('Extended'); navigate('org', { id: orgId });
      }));
    document.querySelector('[data-expire]')?.addEventListener('click', async () => {
      await apiPatch(`/super-admin/orgs/${orgId}/subscription`, { tier: state.data.org.subscriptionTier, status: 'expired', months: 0 });
      toast('Expired'); navigate('org', { id: orgId });
    });
    document.getElementById('impersonateBtn')?.addEventListener('click', async () => {
      const r = await apiPost(`/super-admin/orgs/${orgId}/impersonate`, {});
      toast(`Impersonation token for ${r.targetAdmin} copied!`);
      navigator.clipboard?.writeText(r.accessToken).catch(()=>{});
      alert(`Token for ${r.targetAdmin} (${r.organization}):\n\n${r.accessToken}\n\nExpires in 1 hour. Use this as Bearer token.`);
    });
    document.getElementById('suspendBtn')?.addEventListener('click', async () => {
      if (!confirm('Suspend this org?')) return;
      await apiPatch(`/super-admin/orgs/${orgId}/suspend`, {});
      toast('Suspended'); navigate('org', { id: orgId });
    });
    document.getElementById('unsuspendBtn')?.addEventListener('click', async () => {
      await apiPatch(`/super-admin/orgs/${orgId}/unsuspend`, {});
      toast('Unsuspended'); navigate('org', { id: orgId });
    });
    document.getElementById('deleteOrgBtn')?.addEventListener('click', async () => {
      if (!confirm('Permanently delete this organization?')) return;
      await apiDel(`/super-admin/orgs/${orgId}`);
      toast('Deleted'); navigate('tenants');
    });
  }

  // Plans
  document.getElementById('addPlanBtn')?.addEventListener('click', () => {
    document.getElementById('planForm').classList.remove('hidden');
    document.getElementById('pKey').value = '';
    document.getElementById('pName').value = '';
    document.getElementById('pPriceLabel').value = '';
    document.getElementById('pUsers').value = '';
    document.getElementById('pBranches').value = '';
    document.getElementById('pProducts').value = '';
  });
  document.querySelectorAll('[data-edit-plan]').forEach(el => {
    el.addEventListener('click', () => {
      const p = JSON.parse(el.dataset.editPlan);
      document.getElementById('planForm').classList.remove('hidden');
      document.getElementById('pKey').value = p.name;
      document.getElementById('pName').value = p.displayName;
      document.getElementById('pPriceLabel').value = p.priceLabel || planPriceFallback(p.name);
      document.getElementById('pUsers').value = p.maxUsers;
      document.getElementById('pBranches').value = p.maxBranches;
      document.getElementById('pProducts').value = p.maxProducts;
    });
  });
  document.querySelectorAll('[data-delete-plan]').forEach(el => {
    el.addEventListener('click', async () => {
      const planName = el.dataset.deletePlan;
      if (!planName) return;
      if (!confirm(`Delete plan "${planName}"?`)) return;
      try {
        await apiDel(`/super-admin/plans/${encodeURIComponent(planName)}`);
        toast('Plan deleted');
        navigate('plans');
      } catch (err) {
        toast(err.message || 'Failed to delete plan', true);
      }
    });
  });
  document.getElementById('savePlanBtn')?.addEventListener('click', async () => {
    await apiPost('/super-admin/plans', {
      name: document.getElementById('pKey').value,
      displayName: document.getElementById('pName').value,
      priceLabel: document.getElementById('pPriceLabel').value,
      maxUsers: +document.getElementById('pUsers').value,
      maxBranches: +document.getElementById('pBranches').value,
      maxProducts: +document.getElementById('pProducts').value,
    });
    toast('Plan saved'); navigate('plans');
  });
  document.getElementById('cancelPlanBtn')?.addEventListener('click', () =>
    document.getElementById('planForm').classList.add('hidden'));

  // Feature flags
  document.getElementById('addFeatureBtn')?.addEventListener('click', () => {
    document.getElementById('featureForm').classList.remove('hidden');
    document.getElementById('featureLabel').value = '';
    document.getElementById('featureKey').value = '';
    document.querySelectorAll('[data-new-flag-tier]').forEach(input => { input.checked = false; });
  });
  document.getElementById('cancelFeatureBtn')?.addEventListener('click', () => {
    document.getElementById('featureForm').classList.add('hidden');
  });
  document.getElementById('saveFeatureBtn')?.addEventListener('click', async () => {
    const label = document.getElementById('featureLabel').value.trim();
    const key = document.getElementById('featureKey').value.trim();
    const enabledForTiers = ['starter','professional','enterprise'].filter(t =>
      document.querySelector(`[data-new-flag-tier="${t}"]`)?.checked);
    try {
      await apiPost('/super-admin/feature-flags', { label, key, enabledForTiers, orgOverrides: {} });
      toast('Feature flag created');
      navigate('flags');
    } catch (err) {
      toast(err.message || 'Failed to create feature flag', true);
    }
  });
  document.querySelectorAll('[data-save-flag]').forEach(el => {
    el.addEventListener('click', async () => {
      const key = el.dataset.saveFlag;
      const tiers = ['starter','professional','enterprise'].filter(t =>
        document.querySelector(`[data-flag="${key}"][data-tier="${t}"]`)?.checked);
      await apiPatch(`/super-admin/feature-flags/${key}`, { enabledForTiers: tiers, orgOverrides: {} });
      toast('Flag updated');
    });
  });

  // Platform settings
  document.getElementById('saveSettingsBtn')?.addEventListener('click', async () => {
    const inputs = document.querySelectorAll('[data-setting]');
    for (const inp of inputs) {
      const val = inp.type === 'checkbox' ? String(inp.checked) : inp.value;
      await apiPost('/super-admin/settings', { key: inp.dataset.setting, value: val });
    }
    toast('Settings saved');
  });
  document.getElementById('changeSaPasswordBtn')?.addEventListener('click', async () => {
    const currentPassword = document.getElementById('saCurrentPassword').value;
    const newPassword = document.getElementById('saNewPassword').value;
    const confirmPassword = document.getElementById('saConfirmPassword').value;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast('Fill in all password fields', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('New password confirmation does not match', true);
      return;
    }
    try {
      await apiPost('/super-admin/admins/change-password', { currentPassword, newPassword });
      document.getElementById('saCurrentPassword').value = '';
      document.getElementById('saNewPassword').value = '';
      document.getElementById('saConfirmPassword').value = '';
      toast('Password updated. Sign in again if prompted.');
    } catch (err) {
      toast(err.message || 'Failed to update password', true);
    }
  });

  // Super admin users
  document.getElementById('addAdminBtn')?.addEventListener('click', () => {
    document.getElementById('adminForm').classList.remove('hidden');
    document.getElementById('adminId').value = '';
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminFullName').value = '';
    document.getElementById('adminEmail').value = '';
    document.getElementById('adminAccessLevel').value = 'full_access';
    document.getElementById('adminPassword').value = '';
  });
  document.querySelectorAll('[data-edit-admin]').forEach(el => {
    el.addEventListener('click', () => {
      const admin = JSON.parse(el.dataset.editAdmin);
      document.getElementById('adminForm').classList.remove('hidden');
      document.getElementById('adminId').value = admin.id;
      document.getElementById('adminUsername').value = admin.username;
      document.getElementById('adminFullName').value = admin.fullName || admin.username;
      document.getElementById('adminEmail').value = admin.email || '';
      document.getElementById('adminAccessLevel').value = admin.accessLevel || 'full_access';
      document.getElementById('adminPassword').value = '';
    });
  });
  document.querySelectorAll('[data-delete-admin]').forEach(el => {
    el.addEventListener('click', async () => {
      const id = el.dataset.deleteAdmin;
      if (!id) return;
      if (!confirm('Delete this super admin account?')) return;
      try {
        await apiDel(`/super-admin/admins/${encodeURIComponent(id)}`);
        toast('Super admin deleted');
        navigate('admins');
      } catch (err) {
        toast(err.message || 'Failed to delete super admin', true);
      }
    });
  });
  document.getElementById('saveAdminBtn')?.addEventListener('click', async () => {
    const id = document.getElementById('adminId').value;
    const username = document.getElementById('adminUsername').value.trim();
    const fullName = document.getElementById('adminFullName').value.trim();
    const email = document.getElementById('adminEmail').value.trim();
    const accessLevel = document.getElementById('adminAccessLevel').value;
    const password = document.getElementById('adminPassword').value;

    try {
      if (id) {
        await apiPatch(`/super-admin/admins/${encodeURIComponent(id)}`, { username, fullName, email, accessLevel });
        toast('Super admin updated');
      } else {
        await apiPost('/super-admin/admins', { username, fullName, email, password, accessLevel });
        toast('Super admin created');
      }
      navigate('admins');
    } catch (err) {
      toast(err.message || 'Failed to save super admin', true);
    }
  });
  document.getElementById('cancelAdminBtn')?.addEventListener('click', () => {
    document.getElementById('adminForm').classList.add('hidden');
  });

  // Audit pagination
  document.querySelectorAll('[data-audit-page]').forEach(el =>
    el.addEventListener('click', () => navigate('audit', { page: el.dataset.auditPage })));
}
