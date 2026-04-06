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
    if (data.token) authToken = data.token;
    return data;
  },

  async getTasks() {
    const res = await fetch(`${BASE_URL}/tasks`, {
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
    { id:101, name:'Morning run',     freq:'Daily', streak:12, days:[true,true,true,true,true,true,false],  todayDone:false },
    { id:102, name:'Read 20 pages',   freq:'Daily', streak:5,  days:[true,false,true,true,true,true,false], todayDone:false },
    { id:103, name:'Drink 8 glasses', freq:'Daily', streak:3,  days:[false,true,true,true,true,false,false],todayDone:false },
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
state.tasks.forEach((t, i) => { if (i < 4) t.dueDate = today; });


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
    state.user.name = name || email.split('@')[0];
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
    ...h,
    freq: h.frequency || 'Daily',
    todayDone: h.lastCompletedDate
      ? new Date(h.lastCompletedDate).toDateString() === new Date().toDateString()
      : false,
    days: [false, false, false, false, false, false, false],
  }));

  document.getElementById('user-name-display').textContent = state.user.name;
  document.getElementById('user-avatar').textContent       = state.user.name[0].toUpperCase();
  document.getElementById('greeting-text').textContent     = `Good morning, ${state.user.name.split(' ')[0]}`;
  showView('app');
  renderAll();
}

function handleLogout() { showView('login'); }


function showView(v) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.getElementById('view-' + v).classList.add('active');
}

function showPage(page, navEl) {
  ['dashboard','tasks','create','habits','focus','settings'].forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) el.style.display = 'none';
  });
  if (page === 'focus') { showView('focus'); renderFocusTasks(); return; }
  showView('app');
  const titles = { dashboard:'Dashboard', tasks:'My Tasks', create:'New Task', habits:'Habits', settings:'Settings' };
  document.getElementById('topbar-title').textContent = titles[page] || page;
  const target = document.getElementById('page-' + page);
  if (target) {
    target.style.display = 'block';
    target.classList.remove('fade-in');
    void target.offsetWidth;
    target.classList.add('fade-in');
  }
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


function renderAll() { renderDashboard(); }

function renderDashboard() {
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

  document.getElementById('dash-habits-list').innerHTML = state.habits.map(h => `
    <div class="habit-mini-row">
      <div class="h-check ${h.todayDone ? 'done' : ''}" onclick="toggleHabitToday(${h.id})">
        ${h.todayDone
          ? '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 7l3 3 6-6"/></svg>'
          : '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3v8M3 7h8"/></svg>'}
      </div>
      <div class="habit-mini-info">
        <div class="habit-mini-name">${h.name}</div>
        <div class="habit-mini-streak">${h.streak} day streak</div>
      </div>
      <div class="habit-week">${h.days.map((d, i) =>
        `<div class="hw-dot ${d ? 'done' : ''} ${i === 6 ? 'today' : ''}"></div>`).join('')}</div>
    </div>
  `).join('');
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
  renderDashboard();
  renderAllTasks();
  const t = state.tasks.find(t => t.id === id);
  showToast(t.completed ? 'Task completed' : 'Task reopened');
}

function renderAllTasks() {
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
  showToast('Task updated');
  state.editingTaskId = null;
  showPage('tasks', document.querySelectorAll('.nav-item')[1]);
  renderAllTasks();
}

function deleteTask(id)  { state.deleteTarget = id; document.getElementById('delete-modal').classList.add('open'); }
function closeModal()    { document.getElementById('delete-modal').classList.remove('open'); }

async function confirmDelete() {
  await api.deleteTask(state.deleteTarget);
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
  showToast('Task created');
  showPage('dashboard', document.querySelector('.nav-item'));
  renderDashboard();
}


const dayLabels = ['M','T','W','T','F','S','S'];

async function toggleHabitToday(id) {
  const h = state.habits.find(h => h.id === id);
  if (!h) return;
  if (!h.todayDone) {
    await api.markHabitComplete(id);
    h.todayDone = true;
    h.streak += 1;
    h.days[6] = true;
  } else {
    h.todayDone = false;
    h.streak = Math.max(0, h.streak - 1);
    h.days[6] = false;
  }
  renderDashboard();
  renderHabits();
  showToast(h.todayDone ? `${h.name} done` : 'Habit unmarked');
}

function toggleHabitDay(id, dayIdx) {
  const h = state.habits.find(h => h.id === id);
  if (!h) return;
  h.days[dayIdx] = !h.days[dayIdx];
  h.streak = h.days.filter(Boolean).length;
  renderHabits();
}

function renderHabits() {
  const habitIcon = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="8"/><path d="M10 6v4l2.5 2.5"/></svg>`;
  const checkIcon = `<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2"><path d="M1.5 5l2.5 2.5 4.5-4.5"/></svg>`;
  const flameIcon = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 1c0 3-3 4-3 6.5C3 9.4 4.3 11 6 11s3-1.6 3-3.5C9 5 6 4 6 1z"/></svg>`;
  document.getElementById('habits-grid').innerHTML = state.habits.map(h => `
    <div class="habit-card">
      <div class="habit-card-top">
        <div class="habit-card-icon">${habitIcon}</div>
        <span class="habit-card-menu" onclick="deleteHabit(${h.id})" title="Delete">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3.5h10M5.5 3.5V2.5h3v1M4 3.5l.5 7.5h5l.5-7.5"/></svg>
        </span>
      </div>
      <div class="habit-card-name">${h.name}</div>
      <div class="habit-card-freq">${h.freq}</div>
      <div class="habit-week-row">
        ${h.days.map((d, i) => `
          <div class="hw-cell ${d ? 'done' : ''} ${i === 6 ? 'today' : ''}" onclick="toggleHabitDay(${h.id},${i})">
            <span class="hw-day">${dayLabels[i]}</span>
            <span class="hw-check">${checkIcon}</span>
          </div>`).join('')}
      </div>
      <div class="habit-card-bottom">
        <div class="streak-badge">${flameIcon} ${h.streak} day streak</div>
        <button class="habit-complete-btn ${h.todayDone ? 'done' : 'todo'}" onclick="toggleHabitToday(${h.id})">
          ${h.todayDone ? 'Done today' : 'Mark today'}
        </button>
      </div>
    </div>
  `).join('') + `
    <div class="add-habit-card" onclick="showPage('create',null)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>
      <p>Add new habit</p>
    </div>`;
}

async function deleteHabit(id) {
  await api.deleteHabit(id);
  state.habits = state.habits.filter(h => h.id !== id);
  renderHabits();
  showToast('Habit deleted');
}


function renderFocusTasks() {
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
  const m = Math.floor(state.focusSeconds / 60);
  const s = state.focusSeconds % 60;
  document.getElementById('focus-min').textContent = String(m).padStart(2, '0');
  document.getElementById('focus-sec').textContent = String(s).padStart(2, '0');
  const pct = state.focusSeconds / (25 * 60);
  document.getElementById('timer-ring').style.strokeDashoffset = 534 * (1 - pct);
  document.getElementById('focus-progress-text').textContent =
    `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} remaining · Pomodoro session`;
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
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

updateFocusClock();
initDarkMode();
