/* ============================================================
   Taskflow — script.js
   localStorage key: 'taskflow_v1_tasks'  (namespaced — won't
   clash with any other app on the same GitHub Pages domain)
   ============================================================ */

(function () {

  /* ---- Namespaced storage key ---- */
  const STORAGE_KEY = 'taskflow_v1_tasks';

  /* ---- State ---- */
  let tasks         = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  let currentFilter = 'all';
  let currentSort   = '';
  let searchQuery   = '';
  let pendingDeleteId = null;

  /* ---- Element refs ---- */
  const taskList         = document.getElementById('task-list');
  const emptyState       = document.getElementById('empty-state');
  const modalOverlay     = document.getElementById('modal-overlay');
  const confirmOverlay   = document.getElementById('confirm-overlay');
  const clearOverlay     = document.getElementById('clear-confirm-overlay');
  const taskForm         = document.getElementById('task-input-form');
  const modalTitle       = document.getElementById('modal-title');
  const submitBtn        = document.getElementById('submit-btn');
  const editIdInput      = document.getElementById('edit-task-id');
  const searchInput      = document.getElementById('search-input');
  const searchMobile     = document.getElementById('search-input-mobile');
  const sortSelect       = document.getElementById('sort-tasks');
  const sortSelectMobile = document.getElementById('sort-tasks-mobile');
  const toast            = document.getElementById('toast');
  let toastTimer;

  /* ================================================
     NAVIGATION
     ================================================ */

  document.querySelectorAll('.nav-item[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      setFilter(btn.dataset.filter);
      syncAllNavs(btn.dataset.filter);
    });
  });

  document.querySelectorAll('.mobile-filter-chip-pill[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      setFilter(btn.dataset.filter);
      syncAllNavs(btn.dataset.filter);
    });
  });

  document.querySelectorAll('.mobile-stat-chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      const f = chip.dataset.filter === 'due-today' ? 'all' : chip.dataset.filter;
      setFilter(f);
      syncAllNavs(f);
    });
  });

  document.querySelectorAll('.bottom-nav-item[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      setFilter(btn.dataset.filter);
      syncAllNavs(btn.dataset.filter);
    });
  });

  function setFilter(f) {
    currentFilter = f;
    updatePageTitle();
    render();
  }

  function syncAllNavs(filter) {
    document.querySelectorAll('.nav-item[data-filter]').forEach(n =>
      n.classList.toggle('active', n.dataset.filter === filter));
    document.querySelectorAll('.mobile-filter-chip-pill[data-filter]').forEach(c =>
      c.classList.toggle('active', c.dataset.filter === filter));
    document.querySelectorAll('.bottom-nav-item[data-filter]').forEach(b =>
      b.classList.toggle('active', b.dataset.filter === filter));
  }

  /* ================================================
     ADD TASK BUTTONS
     ================================================ */
  document.getElementById('add-task-btn').addEventListener('click', openAddModal);
  document.getElementById('add-task-btn-mobile')?.addEventListener('click', openAddModal);
  document.getElementById('add-task-btn-bnav')?.addEventListener('click', openAddModal);
  document.getElementById('empty-add-btn')?.addEventListener('click', openAddModal);

  /* ================================================
     CLEAR COMPLETED
     ================================================ */
  ['clear-completed-sidebar', 'clear-completed-topbar', 'clear-completed-mobile'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', openClearConfirm);
  });

  function openClearConfirm() {
    const count = tasks.filter(t => t.status === 'completed').length;
    if (count === 0) { showToast('No completed tasks to clear'); return; }
    document.getElementById('clear-confirm-count').textContent =
      `This will permanently remove ${count} completed task${count !== 1 ? 's' : ''}.`;
    clearOverlay.classList.remove('hidden');
  }

  document.getElementById('clear-confirm-cancel').addEventListener('click', () =>
    clearOverlay.classList.add('hidden'));

  document.getElementById('clear-confirm-ok').addEventListener('click', () => {
    const removed = tasks.filter(t => t.status === 'completed').length;
    tasks = tasks.filter(t => t.status !== 'completed');
    saveTasks();
    if (currentFilter === 'completed') { setFilter('all'); syncAllNavs('all'); }
    else render();
    clearOverlay.classList.add('hidden');
    showToast(`Cleared ${removed} completed task${removed !== 1 ? 's' : ''} ✓`);
  });

  clearOverlay.addEventListener('click', e => {
    if (e.target === clearOverlay) clearOverlay.classList.add('hidden');
  });

  /* ================================================
     TASK MODAL
     ================================================ */
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('cancel-btn').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

  function openAddModal() {
    taskForm.reset();
    editIdInput.value = '';
    modalTitle.textContent = 'New Task';
    submitBtn.textContent  = 'Add Task';
    clearPills('importance-pills');
    clearPills('difficulty-pills');
    document.getElementById('task-importance').value = '';
    document.getElementById('task-difficulty').value = '';
    clearFormErrors();
    modalOverlay.classList.remove('hidden');
    setTimeout(() => document.getElementById('task-name').focus(), 50);
  }

  function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    editIdInput.value = task.id;
    modalTitle.textContent = 'Edit Task';
    submitBtn.textContent  = 'Save Changes';
    document.getElementById('task-name').value     = task.name;
    document.getElementById('task-details').value  = task.details;
    document.getElementById('task-due-date').value = task.dueDate;
    document.getElementById('task-status').value   = task.status;
    selectPill('importance-pills', 'task-importance', task.importance);
    selectPill('difficulty-pills', 'task-difficulty', task.difficulty);
    clearFormErrors();
    modalOverlay.classList.remove('hidden');
    setTimeout(() => document.getElementById('task-name').focus(), 50);
  }

  function closeModal() {
    modalOverlay.classList.add('hidden');
    taskForm.reset();
    clearFormErrors();
  }

  /* ================================================
     DELETE CONFIRM
     ================================================ */
  document.getElementById('confirm-cancel').addEventListener('click', () => {
    confirmOverlay.classList.add('hidden');
    pendingDeleteId = null;
  });

  document.getElementById('confirm-delete').addEventListener('click', () => {
    if (pendingDeleteId !== null) {
      tasks = tasks.filter(t => t.id !== pendingDeleteId);
      saveTasks();
      render();
      showToast('Task deleted');
    }
    confirmOverlay.classList.add('hidden');
    pendingDeleteId = null;
  });

  confirmOverlay.addEventListener('click', e => {
    if (e.target === confirmOverlay) {
      confirmOverlay.classList.add('hidden');
      pendingDeleteId = null;
    }
  });

  /* ================================================
     SORT
     ================================================ */
  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    if (sortSelectMobile) sortSelectMobile.value = currentSort;
    render();
  });

  sortSelectMobile?.addEventListener('change', () => {
    currentSort = sortSelectMobile.value;
    sortSelect.value = currentSort;
    render();
  });

  /* ================================================
     SEARCH
     ================================================ */
  searchInput.addEventListener('input', e => {
    searchQuery = e.target.value.toLowerCase().trim();
    if (searchMobile) searchMobile.value = e.target.value;
    render();
  });

  searchMobile?.addEventListener('input', e => {
    searchQuery = e.target.value.toLowerCase().trim();
    searchInput.value = e.target.value;
    render();
  });

  /* ================================================
     KEYBOARD
     ================================================ */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      confirmOverlay.classList.add('hidden');
      clearOverlay.classList.add('hidden');
    }
  });

  /* ================================================
     PILL GROUPS
     ================================================ */
  setupPillGroup('importance-pills', 'task-importance');
  setupPillGroup('difficulty-pills', 'task-difficulty');

  function setupPillGroup(groupId, hiddenId) {
    document.getElementById(groupId).querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.getElementById(groupId).querySelectorAll('.pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
        document.getElementById(hiddenId).value = pill.dataset.value;
      });
    });
  }

  function clearPills(groupId) {
    document.getElementById(groupId).querySelectorAll('.pill').forEach(p => p.classList.remove('selected'));
  }

  function selectPill(groupId, hiddenId, value) {
    clearPills(groupId);
    const pill = document.querySelector(`#${groupId} .pill[data-value="${value}"]`);
    if (pill) pill.classList.add('selected');
    document.getElementById(hiddenId).value = value;
  }

  /* ================================================
     FORM SUBMIT
     ================================================ */
  taskForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateForm()) return;

    const id = editIdInput.value ? parseInt(editIdInput.value) : null;
    const taskData = {
      id:         id || Date.now(),
      name:       document.getElementById('task-name').value.trim(),
      details:    document.getElementById('task-details').value.trim(),
      dueDate:    document.getElementById('task-due-date').value,
      status:     document.getElementById('task-status').value,
      importance: document.getElementById('task-importance').value,
      difficulty: document.getElementById('task-difficulty').value,
    };

    if (id) {
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) tasks[idx] = taskData;
      showToast('Task updated ✓');
    } else {
      tasks.unshift(taskData);
      showToast('Task added ✓');
    }

    saveTasks();
    render();
    closeModal();
  });

  /* ================================================
     VALIDATION
     ================================================ */
  function validateForm() {
    clearFormErrors();
    let valid = true;
    if (!document.getElementById('task-name').value.trim()) {
      markError(document.getElementById('task-name')); valid = false;
    }
    if (!document.getElementById('task-due-date').value) {
      markError(document.getElementById('task-due-date')); valid = false;
    }
    if (!document.getElementById('task-importance').value) {
      markError(document.getElementById('importance-pills')); valid = false;
    }
    if (!document.getElementById('task-difficulty').value) {
      markError(document.getElementById('difficulty-pills')); valid = false;
    }
    if (!valid) showToast('Please fill all required fields');
    return valid;
  }

  function markError(el) { el.closest('.form-group')?.classList.add('error'); }
  function clearFormErrors() {
    document.querySelectorAll('.form-group.error').forEach(g => g.classList.remove('error'));
  }

  /* ================================================
     PERSIST — namespaced key prevents collisions with
     any other app on the same GitHub Pages domain
     ================================================ */
  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  /* ================================================
     RENDER
     ================================================ */
  function render() {
    let filtered = [...tasks];

    if (currentFilter !== 'all') {
      filtered = filtered.filter(t => t.status === currentFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchQuery) ||
        t.details.toLowerCase().includes(searchQuery)
      );
    }

    if (currentSort === 'due-date') {
      filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    } else if (currentSort === 'importance') {
      const o = { high: 3, medium: 2, low: 1 };
      filtered.sort((a, b) => o[b.importance] - o[a.importance]);
    } else if (currentSort === 'difficulty') {
      const o = { hard: 3, medium: 2, easy: 1 };
      filtered.sort((a, b) => o[b.difficulty] - o[a.difficulty]);
    } else if (currentSort === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    taskList.innerHTML = '';

    if (filtered.length === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
      filtered.forEach((task, i) => taskList.appendChild(createCard(task, i)));
    }

    updateDashboard();
    updateBadge(filtered.length);
    updateClearBtns();
  }

  /* ---- Card builder ---- */
  function createCard(task, index) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.importance = task.importance;
    card.dataset.status     = task.status;
    card.style.animationDelay = `${index * 40}ms`;

    const dueInfo   = getDueInfo(task.dueDate, task.status);
    const impClass  = `badge-${task.importance}`;
    const diffClass = task.difficulty === 'hard' ? 'badge-hard'
                    : task.difficulty === 'easy' ? 'badge-easy'
                    : 'badge-diff-medium';

    card.innerHTML = `
      <div class="card-header">
        <span class="task-name">${esc(task.name)}</span>
        <div class="card-actions">
          <button class="icon-btn edit-btn"   title="Edit">  <i class="fas fa-pen"></i>   </button>
          <button class="icon-btn delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      ${task.details ? `<p class="task-details-text">${esc(task.details)}</p>` : ''}
      <div class="card-badges">
        <span class="badge ${impClass}">${task.importance} priority</span>
        <span class="badge ${diffClass}">${task.difficulty}</span>
      </div>
      <div class="card-due ${dueInfo.cls}">
        <i class="fas fa-calendar-days"></i>${dueInfo.label}
      </div>
      <div class="card-footer">
        <select class="status-select">
          <option value="pending"     ${task.status === 'pending'     ? 'selected' : ''}>⏸ Pending</option>
          <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>▶ In Progress</option>
          <option value="completed"   ${task.status === 'completed'   ? 'selected' : ''}>✓ Completed</option>
        </select>
      </div>
    `;

    card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task.id));

    card.querySelector('.delete-btn').addEventListener('click', () => {
      pendingDeleteId = task.id;
      confirmOverlay.classList.remove('hidden');
    });

    card.querySelector('.status-select').addEventListener('change', function () {
      const t = tasks.find(x => x.id === task.id);
      if (t) {
        t.status = this.value;
        saveTasks();
        render();
        showToast(`Moved to "${fmtStatus(this.value)}"`);
      }
    });

    return card;
  }

  /* ================================================
     DASHBOARD
     ================================================ */
  function updateDashboard() {
    const today    = new Date().toISOString().split('T')[0];
    const pending  = tasks.filter(t => t.status === 'pending').length;
    const progress = tasks.filter(t => t.status === 'in-progress').length;
    const done     = tasks.filter(t => t.status === 'completed').length;
    const dueToday = tasks.filter(t => t.dueDate === today && t.status !== 'completed').length;

    document.getElementById('pending-count').textContent     = pending;
    document.getElementById('in-progress-count').textContent = progress;
    document.getElementById('completed-count').textContent   = done;
    document.getElementById('due-today-count').textContent   = dueToday;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('mob-all-count',      tasks.length);
    set('mob-pending-count',  pending);
    set('mob-progress-count', progress);
    set('mob-done-count',     done);
    set('due-today-count-mob', dueToday);

    document.querySelectorAll('.mobile-stat-chip').forEach(c =>
      c.classList.toggle('active-filter', c.dataset.filter === currentFilter));
  }

  function updateBadge(count) {
    const el = document.getElementById('total-task-count');
    if (el) el.textContent = `${count} task${count !== 1 ? 's' : ''}`;
  }

  function updateClearBtns() {
    const hasCompleted = tasks.some(t => t.status === 'completed');
    ['clear-completed-sidebar', 'clear-completed-topbar', 'clear-completed-mobile'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = !hasCompleted;
    });
  }

  function updatePageTitle() {
    const map = { all: 'All Tasks', pending: 'Pending', 'in-progress': 'In Progress', completed: 'Completed' };
    const el  = document.getElementById('page-title-display');
    if (el) el.textContent = map[currentFilter] || 'Tasks';
  }

  /* ================================================
     HELPERS
     ================================================ */
  function getDueInfo(dateStr, status) {
    if (status === 'completed') return { label: `Completed — ${fmtDate(dateStr)}`, cls: '' };
    if (!dateStr)               return { label: 'No due date', cls: '' };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due   = new Date(dateStr + 'T00:00:00');
    const diff  = Math.round((due - today) / 86400000);
    if (diff < 0)   return { label: `Overdue by ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''}`, cls: 'overdue'   };
    if (diff === 0) return { label: 'Due today!',   cls: 'due-today' };
    if (diff === 1) return { label: 'Due tomorrow', cls: 'due-soon'  };
    if (diff <= 3)  return { label: `Due in ${diff} days`, cls: 'due-soon' };
    return { label: `Due ${fmtDate(dateStr)}`, cls: '' };
  }

  function fmtDate(str) {
    if (!str) return '';
    return new Date(str + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function fmtStatus(s) {
    return s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1);
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ================================================
     TOAST
     ================================================ */
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  /* ================================================
     INIT
     ================================================ */
  render();

})();
