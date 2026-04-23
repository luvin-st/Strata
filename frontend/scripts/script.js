const BASE_URL = 'http://localhost:3000/api';
let authToken = null;

const api = {
  async register(name, email, password) {
    const res = await fetch(`${BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return res.json();
  },

  async login(email, password) {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) {
      authToken = data.token;
      sessionStorage.setItem('strata_token', authToken);
    }
    return data;
  },

  async getTasks() {
    const res = await fetch(`${BASE_URL}/tasks`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    return res.json();
  },

  async getTasksSorted() {
    const res = await fetch(`${BASE_URL}/tasks/sorted`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    return res.json();
  },

  async createTask(payload) {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async updateTask(id, payload) {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async deleteTask(id) {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    return res.json();
  },

  async markComplete(id) {
    const res = await fetch(`${BASE_URL}/tasks/${id}/complete`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    return res.json();
  },

  async unmarkComplete(id) {
    const res = await fetch(`${BASE_URL}/tasks/${id}/uncomplete`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    return res.json();
  },

  // ✅ granular updates

  async setCategory(id, category) {
    const res = await fetch(`${BASE_URL}/tasks/${id}/category`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ category }),
    });
    return res.json();
  },

  async setDueDate(id, dueDate) {
    const res = await fetch(`${BASE_URL}/tasks/${id}/due`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ dueDate }),
    });
    return res.json();
  },

  async setPriority(id, priority) {
    const res = await fetch(`${BASE_URL}/tasks/${id}/priority`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ priority }),
    });
    return res.json();
  },

  // habits

  async getHabits() {
    const res = await fetch(`${BASE_URL}/habits`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    return res.json();
  },

  async createHabit(payload) {
    const res = await fetch(`${BASE_URL}/habits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async markHabitComplete(id) {
    const res = await fetch(`${BASE_URL}/habits/${id}/complete`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    return res.json();
  },

  async deleteHabit(id) {
    const res = await fetch(`${BASE_URL}/habits/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    return res.json();
  },
};

let state = {
  user: { name: 'Emily Johnson', email: 'emily@example.com' },
  tasks: [
    { id:1, title:'Prepare meeting agenda',      description:'Meeting with the marketing team.', priority:'high',   dueDate:'', completed:false, category:'Work'     },
    { id:2, title:'Buy paint and brushes',        description:'',                                 priority:'medium', dueDate:'', completed:true,  category:'Personal' },
    { id:3, title:'Remove old tiles',             description:'',                                 priority:'medium', dueDate:'', completed:false, category:'Home'     },
    { id:4, title:'Send project brief',           description:'',                                 priority:'high',   dueDate:'', completed:true,  category:'Work'     },
    { id:5, title:'Anniversary dinner reservation', description:'',                               priority:'low',    dueDate:'', completed:false, category:'Personal' },
    { id:6, title:'Install new shelves',          description:'',                                 priority:'low',    dueDate:'', completed:false, category:'Home'     },
  ],
  habits: [
    { id:101, name:'Morning run',     frequency:'daily',    customDays:[], category:'Fitness',  desc:'',                  completions:[], createdAt:'' },
    { id:102, name:'Read 20 pages',   frequency:'daily',    customDays:[], category:'Learning', desc:'',                  completions:[], createdAt:'' },
    { id:103, name:'Drink 8 glasses', frequency:'weekdays', customDays:[], category:'Health',   desc:'Stay hydrated',     completions:[], createdAt:'' },
  ],
  priority: 'low',
  editingTaskId: null,
  deleteTarget: null,
  focusRunning: false,
  focusTimer: null,
  focusSeconds: 25 * 60,
  focusTask: 'Prepare meeting agenda',
  focusTaskCat: 'Work',
  currentTab: 'today',
  currentFilter: 'all',
  darkMode: false,
};

const today = new Date().toISOString().split('T')[0];

// Restore persisted session data (set after login, shared across pages)
// State restoration runs immediately so data is available before render functions fire
(function restoreSession() {
  try {
    const savedToken = sessionStorage.getItem('strata_token');
    if (savedToken) authToken = savedToken;

    const savedUser = sessionStorage.getItem('strata_user');
    if (savedUser) state.user = JSON.parse(savedUser);

    const savedTasks = sessionStorage.getItem('strata_tasks');
    if (savedTasks) {
      state.tasks = JSON.parse(savedTasks);
    } else {
      // Seed demo tasks with today's date on first load
      state.tasks.forEach((t, i) => { if (i < 4) t.dueDate = today; });
    }

    const savedHabits = sessionStorage.getItem('strata_habits');
    if (savedHabits) state.habits = JSON.parse(savedHabits);
  } catch(e) { /* ignore parse errors */ }
})();

// Update user info elements in the sidebar/header — must run after DOM is ready
function applyUserToDOM() {
  const nameEl   = document.getElementById('user-name-display');
  const avatarEl = document.getElementById('user-avatar');
  const greetEl  = document.getElementById('greeting-text');
  const emailEl  = document.getElementById('user-email-display');
  const hour     = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  if (nameEl)   nameEl.textContent   = state.user.name;
  if (avatarEl) avatarEl.textContent = state.user.name[0].toUpperCase();
  if (greetEl)  greetEl.textContent  = `Good ${timeOfDay}, ${state.user.name.split(' ')[0]}`;
  if (emailEl)  emailEl.textContent  = state.user.email;
}

// Persist state changes back to sessionStorage so they survive page navigation
function persistState() {
  try {
    sessionStorage.setItem('strata_tasks',  JSON.stringify(state.tasks));
    sessionStorage.setItem('strata_habits', JSON.stringify(state.habits));
    sessionStorage.setItem('strata_user',   JSON.stringify(state.user));
  } catch(e) {}
}


function initDarkMode() {
  const saved = localStorage.getItem('strata-dark');
  if (saved === 'true') {
    state.darkMode = true;
    document.body.classList.add('dark');
  }
  syncDarkToggles();
}

function setDarkMode(on) {
  state.darkMode = on;
  document.body.classList.toggle('dark', on);
  localStorage.setItem('strata-dark', on);
  syncDarkToggles();
}

function syncDarkToggles() {
  document.querySelectorAll('.dark-mode-toggle').forEach(el => {
    el.classList.toggle('on', state.darkMode);
  });
}


let isSignup = false;

function toggleAuth() {
  isSignup = !isSignup;
  document.getElementById('auth-title').textContent = isSignup ? 'Create account' : 'Welcome back';
  document.getElementById('auth-sub').textContent   = isSignup ? 'Start your Strata journey' : 'Sign in to your Strata account';
  document.getElementById('signup-name-field').style.display = isSignup ? 'block' : 'none';
  document.querySelector('.login-toggle').innerHTML = isSignup
    ? 'Already have an account? <a onclick="toggleAuth()">Sign in</a>'
    : "Don't have an account? <a onclick=\"toggleAuth()\">Create one</a>";
  document.querySelector('.btn-full').textContent = isSignup ? 'Create Account' : 'Sign In';
}

async function handleLogin() {
  const email    = document.getElementById('input-email').value;
  const password = document.getElementById('input-password').value;
  const name     = document.getElementById('input-name').value || 'User';

  if (isSignup) {
    await api.register(name, email, password);
    await api.login(email, password);
    state.user.name = name;
  } else {
    const res = await api.login(email, password);
    if (!res.token) { showToast('Invalid email or password'); return; }
    state.user.name  = res.name  || email.split('@')[0];
    state.user.email = res.email || email;
  }

  // Load real tasks from database
  const tasks = await api.getTasks();
  state.tasks = tasks.map(t => ({
    ...t,
    dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
    category: t.category || 'Work',
  }));

  // Load real habits from database
  const habits = await api.getHabits();
  state.habits = habits.map(h => ({
    id:          h.id,
    name:        h.name,
    desc:        h.description || '',
    frequency:   h.frequency || 'daily',
    customDays:  h.customDays || [],
    category:    h.category   || 'Health',
    completions: h.completions || [],
    createdAt:   h.createdAt  || '',
  }));

  // Store user info for other pages to pick up
  sessionStorage.setItem('strata_user', JSON.stringify(state.user));
  sessionStorage.setItem('strata_tasks', JSON.stringify(state.tasks));
  sessionStorage.setItem('strata_habits', JSON.stringify(state.habits));

  // Redirect to dashboard after login
  window.location.href = 'dashboard.html';
}

function handleLogout() { window.location.href = 'login.html'; }


function showView(v) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('view-' + v);
  if (el) el.classList.add('active');
}

// Page-to-file mapping for multi-page navigation
const PAGE_FILES = {
  dashboard: 'dashboard.html',
  tasks:     'tasks.html',
  habits:    'habits.html',
  focus:     'focus.html',
  settings:  'settings.html',
  create:    'tasks.html?create=1',
};

function navigateTo(page) {
  const file = PAGE_FILES[page];
  if (file) window.location.href = file;
}

function showPage(page, navEl) {
  // If this page's section doesn't exist in the current document, navigate to it
  const target = document.getElementById('page-' + page);
  if (!target) {
    navigateTo(page);
    return;
  }

  // Otherwise handle in-page switching (for pages with multiple sections)
  ['dashboard','tasks','create','habits','focus','settings'].forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) el.style.display = 'none';
  });
  if (page === 'focus') { showView('focus'); renderFocusTasks(); return; }
  showView('app');
  const titles = { dashboard:'Dashboard', tasks:'My Tasks', create:'New Task', habits:'Habits', settings:'Settings' };
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = titles[page] || page;
  target.style.display = 'block';
  target.classList.remove('fade-in');
  void target.offsetWidth;
  target.classList.add('fade-in');
  if (navEl) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    navEl.classList.add('active');
  }
  if (page === 'dashboard') renderDashboard();
  if (page === 'tasks')     renderAllTasks();
  if (page === 'habits')    renderHabits();
  if (page === 'settings')  renderSettings('profile');
  if (page === 'create')    initCreateForm();
}

// Auto-init: call the right render function based on which page we're on
function initCurrentPage() {
  if (document.getElementById('page-dashboard')) { renderDashboard(); }
  if (document.getElementById('page-tasks'))     {
    // Check if arriving via ?create=1
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === '1') {
      document.getElementById('page-tasks').style.display = 'none';
      const createEl = document.getElementById('page-create');
      if (createEl) { createEl.style.display = 'block'; initCreateForm(); }
    } else {
      renderAllTasks();
    }
  }
  if (document.getElementById('page-habits'))   { renderHabits(); }
  if (document.getElementById('page-settings')) { renderSettings('profile'); }
  if (document.getElementById('view-focus'))     { renderFocusTasks(); }
}


function renderAll() { renderDashboard(); }

function renderDashboard() {
  if (!document.getElementById('page-dashboard')) return;
  const todayTasks = state.tasks.filter(t => t.dueDate === today);
  const doneTasks  = state.tasks.filter(t => t.completed);
  const rate = state.tasks.length ? Math.round((doneTasks.length / state.tasks.length) * 100) : 0;

  document.getElementById('stat-total').textContent  = state.tasks.length;
  document.getElementById('stat-done').textContent   = doneTasks.length;
  document.getElementById('stat-habits').textContent = state.habits.length;
  document.getElementById('stat-rate').textContent   = rate + '%';
  document.getElementById('task-badge').textContent  = state.tasks.filter(t => !t.completed).length;
  document.getElementById('greeting-sub').textContent =
    `${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})} · ${todayTasks.length} tasks today`;

  const display = state.currentTab === 'today'
    ? state.tasks.filter(t => t.dueDate === today || !t.dueDate).slice(0, 6)
    : state.tasks.filter(t => t.dueDate > today).slice(0, 6);
  document.getElementById('dashboard-task-list').innerHTML =
    display.length ? display.map(t => taskRowHTML(t)).join('') : emptyState('No tasks scheduled');

  const upcoming = state.tasks
    .filter(t => !t.completed && t.dueDate > today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);
  document.getElementById('upcoming-mini-list').innerHTML =
    upcoming.length ? upcoming.map(t => taskRowHTML(t, true)).join('') : emptyState('All clear');

  const _todayStr = new Date().toDateString();
  document.getElementById('dash-habits-list').innerHTML = state.habits.map(h => {
    const todayDone = (h.completions || []).includes(_todayStr);
    const streak    = habitCalcStreak(h);
    const last7     = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
      last7.push((h.completions || []).includes(d.toDateString()));
    }
    return `
    <div class="habit-mini-row">
      <div class="h-check ${todayDone ? 'done' : ''}" onclick="toggleHabitToday(${h.id})">
        ${todayDone
          ? '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 7l3 3 6-6"/></svg>'
          : '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3v8M3 7h8"/></svg>'}
      </div>
      <div class="habit-mini-info">
        <div class="habit-mini-name">${h.name}</div>
        <div class="habit-mini-streak">${streak} day streak</div>
      </div>
      <div class="habit-week">${last7.map((d, i) =>
        `<div class="hw-dot ${d ? 'done' : ''} ${i === 6 ? 'today' : ''}"></div>`).join('')}</div>
    </div>`;
  }).join('');
}

function emptyState(msg) {
  return `<div class="empty-state">
    <div class="empty-icon"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="6" width="28" height="28" rx="6"/><path d="M13 20l5 5 9-9"/></svg></div>
    ${msg}
  </div>`;
}

function taskRowHTML(t, mini = false) {
  const dueText  = t.dueDate ? new Date(t.dueDate + 'T00:00').toLocaleDateString('en-US', {month:'short', day:'numeric'}) : '';
  const isOverdue = t.dueDate && t.dueDate < today && !t.completed;
  return `<div class="task-row ${t.completed ? 'done' : ''}" id="trow-${t.id}">
    <div class="check-circle ${t.completed ? 'checked' : ''}" onclick="toggleTask(${t.id})"></div>
    <div class="task-row-info">
      <div class="task-row-name">${t.title}</div>
      <div class="task-row-meta">
        <span class="task-row-cat cat-${t.category}">${t.category}</span>
        ${dueText ? `<span class="task-row-due ${isOverdue ? 'overdue' : ''}">${dueText}</span>` : ''}
      </div>
    </div>
    ${!mini ? `<div class="task-actions">
      <div class="task-act-btn" onclick="editTask(${t.id})" title="Edit">
        <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 2l2 2-7 7H2v-2L9 2z"/></svg>
      </div>
      <div class="task-act-btn del" onclick="deleteTask(${t.id})" title="Delete">
        <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3.5h9M5 3.5V2.5h3v1M4 3.5l.5 7h4l.5-7"/></svg>
      </div>
    </div>` : ''}
  </div>`;
}

function switchTab(el, tab) {
  state.currentTab = tab;
  document.querySelectorAll('.panel-tabs .ptab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderDashboard();
}


async function toggleTask(id) {
  await api.markComplete(id);
  const t = state.tasks.find(t => t.id === id);
  if (t) t.completed = !t.completed;
  persistState();
  renderDashboard();
  renderAllTasks();
  showToast(t && t.completed ? 'Task completed' : 'Task reopened');
}

function renderAllTasks() {
  if (!document.getElementById('all-task-list')) return;
  let list = [...state.tasks];
  if      (state.currentFilter === 'todo') list = list.filter(t => !t.completed);
  else if (state.currentFilter === 'done') list = list.filter(t => t.completed);
  else if (['Work','Personal','Home','Health'].includes(state.currentFilter))
    list = list.filter(t => t.category === state.currentFilter);
  document.getElementById('all-task-list').innerHTML =
    list.length ? list.map(t => taskRowHTML(t)).join('') : emptyState('No tasks found');
  document.getElementById('task-badge').textContent = state.tasks.filter(t => !t.completed).length;
}

function filterTasks(filter, el) {
  state.currentFilter = filter;
  document.querySelectorAll('#task-filters .ptab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderAllTasks();
}

function editTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  state.editingTaskId = id;
  showPage('create', null);
  setTimeout(() => {
    document.getElementById('create-form-title').textContent  = 'Edit Task';
    document.getElementById('new-task-title').value           = t.title;
    document.getElementById('new-task-description').value     = t.description || '';
    document.getElementById('new-task-category').value        = t.category;
    if (t.dueDate) document.getElementById('new-task-dueDate').value = t.dueDate;
    state.priority = t.priority || 'low';
    document.querySelectorAll('.prio-btn').forEach(b => {
      b.classList.remove('sel');
      if (b.classList.contains(state.priority)) b.classList.add('sel');
    });
    document.getElementById('save-task-btn').textContent = 'Update Task';
    document.getElementById('save-task-btn').onclick     = () => updateTask(id);
    updatePreview();
  }, 50);
}

async function updateTask(id) {
  const payload = {
    title:       document.getElementById('new-task-title').value,
    description: document.getElementById('new-task-description').value,
    category:    document.getElementById('new-task-category').value,
    dueDate:     document.getElementById('new-task-dueDate').value,
    priority:    state.priority,
  };
  await api.updateTask(id, payload);
  const idx = state.tasks.findIndex(t => t.id === id);
  if (idx !== -1) state.tasks[idx] = { ...state.tasks[idx], ...payload };
  persistState();
  showToast('Task updated');
  state.editingTaskId = null;
  showPage('tasks', document.querySelectorAll('.nav-item')[1]);
  renderAllTasks();
}

function deleteTask(id)  { state.deleteTarget = id; document.getElementById('delete-modal').classList.add('open'); }
function closeModal()    { document.getElementById('delete-modal').classList.remove('open'); }

async function confirmDelete() {
  await api.deleteTask(state.deleteTarget);
  state.tasks = state.tasks.filter(t => t.id !== state.deleteTarget);
  persistState();
  closeModal();
  renderDashboard();
  renderAllTasks();
  showToast('Task deleted');
}


function initCreateForm() {
  state.editingTaskId = null;
  document.getElementById('create-form-title').textContent  = 'New Task';
  document.getElementById('new-task-title').value           = '';
  document.getElementById('new-task-description').value     = '';
  document.getElementById('new-task-category').value        = 'Work';
  document.getElementById('new-task-dueDate').value         = '';
  document.getElementById('new-task-dueDate').min           = today;
  state.priority = 'low';
  document.querySelectorAll('.prio-btn').forEach((b, i) => { b.classList.remove('sel'); if (i === 0) b.classList.add('sel'); });
  document.getElementById('save-task-btn').textContent = 'Save Task';
  document.getElementById('save-task-btn').onclick     = saveTask;
  updatePreview();
}

function selectPriority(el, p) {
  state.priority = p;
  document.querySelectorAll('.prio-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  updatePreview();
}

function updatePreview() {
  const title = document.getElementById('new-task-title').value;
  const desc  = document.getElementById('new-task-description').value;
  const cat   = document.getElementById('new-task-category').value;
  document.getElementById('prev-title').textContent      = title || 'Task title...';
  document.getElementById('prev-title').style.color      = title ? 'var(--text-1)' : 'var(--text-3)';
  document.getElementById('prev-title').style.fontStyle  = title ? 'normal' : 'italic';
  document.getElementById('prev-desc').textContent       = desc || 'No description yet';
  document.getElementById('prev-desc').style.fontStyle   = desc ? 'normal' : 'italic';
  const pLabels = { low:'Low priority', medium:'Medium priority', high:'High priority' };
  document.getElementById('prev-meta').innerHTML =
    `<span class="preview-chip">${cat}</span><span class="preview-chip">${pLabels[state.priority]}</span>`;
}

async function saveTask() {
  const title = document.getElementById('new-task-title').value.trim();
  if (!title) { showToast('Please enter a task title'); return; }
  const payload = {
    title,
    description: document.getElementById('new-task-description').value,
    priority:    state.priority,
    dueDate:     document.getElementById('new-task-dueDate').value || null,
    category:    document.getElementById('new-task-category').value,
  };
  const newTask = await api.createTask(payload);
  state.tasks.unshift({
    ...newTask,
    dueDate: newTask.dueDate ? newTask.dueDate.split('T')[0] : '',
    category: payload.category,
  });
  persistState();
  showToast('Task created');
  showPage('dashboard', document.querySelector('.nav-item'));
}


// ── Habit helpers ────────────────────────────────────────────────────────────
const habitIcon = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="8"/><path d="M10 6v4l2.5 2.5"/></svg>`;
const habitCheckIcon = `<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2"><path d="M1.5 5l2.5 2.5 4.5-4.5"/></svg>`;
const habitFlameIcon = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 1c0 3-3 4-3 6.5C3 9.4 4.3 11 6 11s3-1.6 3-3.5C9 5 6 4 6 1z"/></svg>`;

function habitFreqLabel(freq, customDays) {
  if (freq === 'daily')    return 'Daily';
  if (freq === 'weekdays') return 'Weekdays';
  if (freq === 'custom')   return (customDays || []).join(', ') || 'Custom';
  return freq;
}

function habitIsScheduledDay(h, date) {
  const dayName  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()];
  const weekdays = ['Mon','Tue','Wed','Thu','Fri'];
  if (h.frequency === 'daily')    return true;
  if (h.frequency === 'weekdays') return weekdays.includes(dayName);
  if (h.frequency === 'custom')   return (h.customDays || []).includes(dayName);
  return true;
}

function habitCalcStreak(h) {
  const comps = (h.completions || []).slice().sort();
  if (!comps.length) return 0;
  let streak = 0;
  let cursor = new Date(); cursor.setHours(0,0,0,0);
  for (let i = comps.length - 1; i >= 0; i--) {
    const d = new Date(comps[i]); d.setHours(0,0,0,0);
    const diff = (cursor - d) / 86400000;
    if (diff <= 1) { streak++; cursor = d; } else break;
  }
  return streak;
}

// ── Render habits page ───────────────────────────────────────────────────────
function renderHabits() {
  if (!document.getElementById('habits-grid')) return;
  const grid  = document.getElementById('habits-grid');
  const empty = document.getElementById('habits-empty');
  grid.innerHTML = '';

  if (!state.habits.length) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  const now = new Date(); now.setHours(0,0,0,0);
  const todayStr = now.toDateString();

  state.habits.forEach(h => {
    const streak          = habitCalcStreak(h);
    const todayDone       = (h.completions || []).includes(todayStr);
    const todayScheduled  = habitIsScheduledDay(h, now);

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      days.push({
        label:     ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()],
        dateStr:   d.toDateString(),
        done:      (h.completions || []).includes(d.toDateString()),
        isToday:   i === 0,
        scheduled: habitIsScheduledDay(h, d),
      });
    }

    const card = document.createElement('div');
    card.className = 'habit-card';
    card.innerHTML = `
      <div class="habit-card-top">
        <div class="habit-card-icon">${habitIcon}</div>
        <div style="display:flex;gap:4px;">
          <span class="habit-card-menu" title="Edit" onclick="openEditHabit(${h.id})" style="color:var(--text-3)">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 2l3 3-6 6H3v-3L9 2z"/></svg>
          </span>
          <span class="habit-card-menu" title="Delete" onclick="openDeleteHabit(${h.id})">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3.5h10M5.5 3.5V2.5h3v1M4 3.5l.5 7.5h5l.5-7.5"/></svg>
          </span>
        </div>
      </div>
      <div class="habit-card-name">${h.name}</div>
      <div class="habit-card-freq">${habitFreqLabel(h.frequency, h.customDays)}${h.desc ? ' · ' + h.desc : ''}</div>
      <div class="habit-week-row">
        ${days.map(d => `
          <div class="hw-cell ${d.done ? 'done' : ''} ${d.isToday ? 'today' : ''} ${!d.scheduled ? 'off' : ''}"
               ${d.scheduled ? `onclick="toggleHabitDay(${h.id}, '${d.dateStr}')"` : ''}>
            <span class="hw-day">${d.label}</span>
            <span class="hw-check">${habitCheckIcon}</span>
          </div>`).join('')}
      </div>
      <div class="habit-card-bottom">
        <div class="streak-badge">${habitFlameIcon} ${streak} day streak</div>
        ${todayScheduled
          ? `<button class="habit-complete-btn ${todayDone ? 'done' : 'todo'}" onclick="toggleHabitToday(${h.id})">
               ${todayDone ? 'Done today' : 'Mark today'}
             </button>`
          : `<span style="font-size:.78rem;color:var(--text-3);">Not scheduled today</span>`}
      </div>
    `;
    grid.appendChild(card);
  });

  // "Add new habit" card
  const addCard = document.createElement('div');
  addCard.className = 'add-habit-card';
  addCard.onclick = openCreateHabit;
  addCard.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg><p>Add new habit</p>`;
  grid.appendChild(addCard);
}

// ── Toggle today ─────────────────────────────────────────────────────────────
async function toggleHabitToday(id) {
  const h = state.habits.find(h => h.id === id);
  if (!h) return;
  const todayStr = new Date().toDateString();
  if ((h.completions || []).includes(todayStr)) {
    h.completions = h.completions.filter(d => d !== todayStr);
  } else {
    await api.markHabitComplete(id);
    h.completions = [...(h.completions || []), todayStr];
  }
  persistState();
  renderDashboard();
  renderHabits();
  showToast((h.completions || []).includes(new Date().toDateString()) ? `${h.name} done` : 'Habit unmarked');
}

// ── Toggle a specific day cell ────────────────────────────────────────────────
function toggleHabitDay(id, dateStr) {
  const h = state.habits.find(h => h.id === id);
  if (!h) return;
  if ((h.completions || []).includes(dateStr)) {
    h.completions = h.completions.filter(d => d !== dateStr);
  } else {
    h.completions = [...(h.completions || []), dateStr];
  }
  persistState();
  renderHabits();
}

// ── Create / Edit modal ───────────────────────────────────────────────────────
let _habitEditingId  = null;
let _habitSelFreq    = 'daily';
let _habitSelDays    = [];

function openCreateHabit() {
  _habitEditingId = null;
  _setHabitModalTitle('Create Habit', 'Track a recurring behaviour to build streaks');
  _clearHabitForm();
  _habitSetFreq('daily', []);
  _showHabitModal();
}

function openEditHabit(id) {
  const h = state.habits.find(x => x.id === id);
  if (!h) return;
  _habitEditingId = id;
  _setHabitModalTitle('Edit Habit', 'Update your habit details');
  document.getElementById('habit-name').value     = h.name;
  document.getElementById('habit-desc').value     = h.desc || '';
  document.getElementById('habit-category').value = h.category || 'Health';
  _habitSetFreq(h.frequency || 'daily', h.customDays || []);
  _showHabitModal();
}

function closeHabitModal(e) {
  if (e && e.target !== document.getElementById('habit-modal')) return;
  document.getElementById('habit-modal').style.display = 'none';
}

function _showHabitModal()  { document.getElementById('habit-modal').style.display = 'flex'; }
function _setHabitModalTitle(t, s) {
  document.getElementById('habit-modal-title').textContent = t;
  document.getElementById('habit-modal-sub').textContent   = s;
}
function _clearHabitForm() {
  document.getElementById('habit-name').value     = '';
  document.getElementById('habit-desc').value     = '';
  document.getElementById('habit-category').value = 'Health';
}

function _habitSetFreq(freq, days) {
  _habitSelFreq = freq;
  _habitSelDays = days ? [...days] : [];
  document.querySelectorAll('#freq-btns button').forEach(b => {
    const sel = b.dataset.freq === freq;
    b.classList.toggle('sel', sel);
    b.classList.toggle('low', sel);
    b.classList.toggle('medium', !sel);
  });
  const customEl = document.getElementById('custom-days');
  if (customEl) customEl.style.display = freq === 'custom' ? 'block' : 'none';
  document.querySelectorAll('.day-btn').forEach(b => {
    const on = _habitSelDays.includes(b.dataset.day);
    b.classList.toggle('sel', on);
    b.classList.toggle('low', on);
    b.classList.toggle('medium', !on);
  });
}

function selectFreq(btn) { _habitSetFreq(btn.dataset.freq, []); }

function toggleDay(btn) {
  const day = btn.dataset.day;
  if (_habitSelDays.includes(day)) {
    _habitSelDays = _habitSelDays.filter(d => d !== day);
  } else {
    _habitSelDays.push(day);
  }
  const on = _habitSelDays.includes(day);
  btn.classList.toggle('sel', on);
  btn.classList.toggle('low', on);
  btn.classList.toggle('medium', !on);
}

function saveHabit() {
  const name = document.getElementById('habit-name').value.trim();
  if (!name) { showToast('Please enter a habit name'); return; }

  if (_habitEditingId !== null) {
    const h = state.habits.find(x => x.id === _habitEditingId);
    if (h) {
      h.name       = name;
      h.desc       = document.getElementById('habit-desc').value.trim();
      h.frequency  = _habitSelFreq;
      h.customDays = [..._habitSelDays];
      h.category   = document.getElementById('habit-category').value;
    }
  } else {
    state.habits.push({
      id:          Date.now(),
      name,
      desc:        document.getElementById('habit-desc').value.trim(),
      frequency:   _habitSelFreq,
      customDays:  [..._habitSelDays],
      category:    document.getElementById('habit-category').value,
      completions: [],
      createdAt:   new Date().toISOString(),
    });
  }

  persistState();
  document.getElementById('habit-modal').style.display = 'none';
  renderHabits();
  showToast(_habitEditingId ? 'Habit updated' : 'Habit created');
}

// ── Delete modal ──────────────────────────────────────────────────────────────
let _deletingHabitId = null;

function openDeleteHabit(id) {
  _deletingHabitId = id;
  document.getElementById('delete-habit-modal').style.display = 'flex';
}
function closeDeleteHabitModal() {
  document.getElementById('delete-habit-modal').style.display = 'none';
  _deletingHabitId = null;
}
async function confirmDeleteHabit() {
  await api.deleteHabit(_deletingHabitId);
  state.habits = state.habits.filter(h => h.id !== _deletingHabitId);
  persistState();
  closeDeleteHabitModal();
  renderHabits();
  showToast('Habit deleted');
}

// Keep old deleteHabit name as alias so any stale references still work
function deleteHabit(id) { openDeleteHabit(id); }


function renderFocusTasks() {
  if (!document.getElementById('focus-task-list')) return;
  const activeTasks = state.tasks.filter(t => !t.completed).slice(0, 4);
  document.getElementById('focus-task-list').innerHTML = activeTasks.map(t => `
    <div class="focus-pick-item ${t.title === state.focusTask ? 'active' : ''}"
         onclick="selectFocusTask('${t.title.replace(/'/g,"\\'")}','${t.category}')">
      <div class="focus-pick-dot"></div>
      <span class="focus-pick-name ${t.title === state.focusTask ? 'active' : ''}">${t.title}</span>
    </div>`).join('');
  document.getElementById('focus-task-name').textContent = state.focusTask;
  document.getElementById('focus-task-cat').textContent  = state.focusTaskCat;
}

function selectFocusTask(name, cat) {
  state.focusTask = name; state.focusTaskCat = cat;
  stopFocus();
  document.getElementById('focus-task-name').textContent = name;
  document.getElementById('focus-task-cat').textContent  = cat;
  renderFocusTasks();
}

function toggleFocus() { state.focusRunning ? stopFocus() : startFocus(); }

function startFocus() {
  state.focusRunning = true;
  document.getElementById('focus-play-btn').textContent = 'Pause';
  document.getElementById('focus-status').textContent   = 'Focusing';
  state.focusTimer = setInterval(() => {
    state.focusSeconds--;
    updateFocusClock();
    if (state.focusSeconds <= 0) {
      stopFocus(); state.focusSeconds = 25 * 60; updateFocusClock();
      showToast('Session complete — take a break');
    }
  }, 1000);
}

function stopFocus() {
  state.focusRunning = false;
  clearInterval(state.focusTimer);
  document.getElementById('focus-play-btn').textContent = 'Resume';
  document.getElementById('focus-status').textContent   = 'Paused';
}

function skipFocus() {
  stopFocus(); state.focusSeconds = 25 * 60; updateFocusClock();
  document.getElementById('focus-play-btn').textContent = 'Start';
  document.getElementById('focus-status').textContent   = 'Ready';
}

function updateFocusClock() {
  const minEl  = document.getElementById('focus-min');
  if (!minEl) return;
  const secEl  = document.getElementById('focus-sec');
  const ringEl = document.getElementById('timer-ring');
  const progEl = document.getElementById('focus-progress-text');
  const m = Math.floor(state.focusSeconds / 60);
  const s = state.focusSeconds % 60;
  minEl.textContent  = String(m).padStart(2, '0');
  secEl.textContent  = String(s).padStart(2, '0');
  const pct = state.focusSeconds / (25 * 60);
  ringEl.style.strokeDashoffset = 534 * (1 - pct);
  progEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} remaining · Pomodoro session`;
}

function exitFocus() {
  stopFocus(); state.focusSeconds = 25 * 60; updateFocusClock();
  document.getElementById('focus-play-btn').textContent = 'Start';
  document.getElementById('focus-status').textContent   = 'Ready';
  showView('app');
  showPage('dashboard', document.querySelector('.nav-item'));
}

function settingsHTML(tab) {
  const sections = {
    profile: `
      <div class="settings-section">
        <div class="settings-section-title">Profile</div>
        <div class="settings-section-desc">Manage your personal information</div>
        <div class="avatar-row">
          <div class="avatar-big" id="settings-avatar">E</div>
          <div class="avatar-actions">
            <button class="btn-sm-outline">Upload photo</button>
            <button class="btn-sm-outline">Remove</button>
          </div>
        </div>
        <div class="field-row" style="margin-bottom:16px;">
          <div class="field-group" style="margin-bottom:0"><label class="field-label">First Name</label><input class="field-input" type="text" value="Emily"></div>
          <div class="field-group" style="margin-bottom:0"><label class="field-label">Last Name</label><input class="field-input" type="text" value="Johnson"></div>
        </div>
        <div class="field-group"><label class="field-label">Email</label><input class="field-input" type="email" value="emily@example.com"></div>
        <button class="btn-save" style="width:auto;padding:10px 24px;margin-top:4px;" onclick="showToast('Profile saved')">Save Changes</button>
      </div>`,
    preferences: `
      <div class="settings-section">
        <div class="settings-section-title">Appearance</div>
        <div class="settings-section-desc">Customize how Strata looks</div>
        <div class="setting-row">
          <div class="setting-row-left"><div class="setting-name">Dark Mode</div><div class="setting-desc">Switch to a darker color scheme</div></div>
          <div class="toggle dark-mode-toggle ${state.darkMode ? 'on' : ''}" onclick="setDarkMode(!state.darkMode)"><div class="toggle-thumb"></div></div>
        </div>
        <div class="setting-row">
          <div class="setting-row-left"><div class="setting-name">Compact View</div><div class="setting-desc">Show more tasks in less space</div></div>
          <div class="toggle on" onclick="this.classList.toggle('on')"><div class="toggle-thumb"></div></div>
        </div>
      </div>
      <div class="settings-section">
        <div class="settings-section-title">Task Defaults</div>
        <div class="settings-section-desc">Set defaults for new tasks</div>
        <div class="field-group"><label class="field-label">Default Category</label><select class="field-select"><option>Work</option><option>Personal</option><option>Home</option></select></div>
        <div class="field-group"><label class="field-label">Default Priority</label><select class="field-select"><option>Low</option><option>Medium</option><option>High</option></select></div>
      </div>`,
    notifications: `
      <div class="settings-section">
        <div class="settings-section-title">Notifications</div>
        <div class="settings-section-desc">Control what alerts you receive</div>
        <div class="setting-row"><div class="setting-row-left"><div class="setting-name">Task reminders</div><div class="setting-desc">Get reminded before tasks are due</div></div><div class="toggle on" onclick="this.classList.toggle('on')"><div class="toggle-thumb"></div></div></div>
        <div class="setting-row"><div class="setting-row-left"><div class="setting-name">Habit check-ins</div><div class="setting-desc">Daily reminder to mark habits</div></div><div class="toggle on" onclick="this.classList.toggle('on')"><div class="toggle-thumb"></div></div></div>
        <div class="setting-row"><div class="setting-row-left"><div class="setting-name">Weekly summary</div><div class="setting-desc">Get a report every Sunday</div></div><div class="toggle" onclick="this.classList.toggle('on')"><div class="toggle-thumb"></div></div></div>
        <div class="setting-row"><div class="setting-row-left"><div class="setting-name">Focus mode alerts</div><div class="setting-desc">Notify when focus session ends</div></div><div class="toggle on" onclick="this.classList.toggle('on')"><div class="toggle-thumb"></div></div></div>
      </div>`,
    account: `
      <div class="settings-section">
        <div class="settings-section-title">Change Password</div>
        <div class="settings-section-desc">Update your login credentials</div>
        <div class="field-group"><label class="field-label">Current Password</label><input class="field-input" type="password" placeholder="••••••••"></div>
        <div class="field-group"><label class="field-label">New Password</label><input class="field-input" type="password" placeholder="••••••••"></div>
        <div class="field-group"><label class="field-label">Confirm Password</label><input class="field-input" type="password" placeholder="••••••••"></div>
        <button class="btn-save" style="width:auto;padding:10px 24px;" onclick="showToast('Password updated')">Update Password</button>
      </div>
      <div class="settings-section">
        <div class="settings-section-title" style="color:#dc2626;">Danger Zone</div>
        <div class="settings-section-desc">These actions are irreversible</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn-sm-danger" onclick="showToast('Data exported')">Export my data</button>
          <button class="btn-sm-danger" onclick="handleLogout()">Sign out everywhere</button>
          <button class="btn-sm-danger">Delete account</button>
        </div>
      </div>`
  };
  return sections[tab] || '';
}

function renderSettings(tab) {
  if (!document.getElementById('settings-content')) return;
  document.getElementById('settings-content').innerHTML = settingsHTML(tab);
  if (document.getElementById('settings-avatar'))
    document.getElementById('settings-avatar').textContent = state.user.name[0];
}

function switchSettingsTab(el, tab) {
  document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  renderSettings(tab);
}


let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

document.addEventListener('DOMContentLoaded', () => {
  applyUserToDOM();
  updateFocusClock();
  initDarkMode();
  initCurrentPage();
});