# Taskflow — Task Manager

A clean, dark-themed task manager that works in any browser. No frameworks, no dependencies — just HTML, CSS, and vanilla JS.

---

## Files

```
index.html      Main app
styles.css      All styling
script.js       All logic
manifest.json   PWA manifest (for add-to-homescreen)
```

---

## Features

- **Add / Edit / Delete tasks** — full CRUD with a confirmation step before deleting
- **Task fields** — name, details, due date, status, importance (High / Medium / Low), difficulty (Hard / Medium / Easy)
- **Dashboard** — live counts for Pending, In Progress, Due Today, and Completed
- **Filter** — view All, Pending, In Progress, or Completed tasks
- **Sort** — by Due Date, Importance, Difficulty, or Name (A–Z)
- **Search** — live search across task name and details
- **Clear Completed** — removes all completed tasks at once (with confirmation)
- **Overdue detection** — cards show "Overdue by X days", "Due today", or "Due tomorrow"
- **Responsive** — full-featured on both desktop and mobile
- **Persists data** — tasks are saved to `localStorage`, so they survive page refreshes

---

## How to Run

No build step needed. Just open `index.html` in a browser.

```bash
# Option 1 — open directly
open index.html

# Option 2 — serve locally (avoids any browser file:// quirks)
npx serve .
# or
python3 -m http.server 8000
```

---

## Mobile

On small screens the sidebar is replaced with:
- A **sticky search bar** at the top
- A **scrollable stats strip** (tap any chip to filter)
- A **filter + sort row** with a Clear Done button
- A **bottom navigation bar** for switching views and adding tasks

---

## Data

Tasks are stored in `localStorage` under the key `tf_tasks`. To reset everything, run this in the browser console:

```js
localStorage.removeItem('tf_tasks')
```

<img src="taskflow_logo_v2.svg" alt="Taskflow — Task Manager" style="max-width:380px; width:100%;">
