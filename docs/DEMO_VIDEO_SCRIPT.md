# 🎬 TaskFlow Demo Video Script
## Duration: 3–4 minutes

---

### INTRO (0:00–0:20)
**[Screen: Live frontend URL in browser]**

> "Hi! This is TaskFlow — a full-stack team task manager built with React, Node.js, Express, and MongoDB, deployed on Railway. Let me walk you through the key features."

---

### SIGN UP (0:20–0:50)
**[Screen: Auth page → Sign Up tab]**

> "First, real user signup. I'll create a new account — fill in name, email, password, choose a role, and hit Create Account."

- Click **Sign Up** tab
- Enter: Name = "Demo User", Email = demo@test.com, Password = demo1234
- Click **Create Account**
- Show: auto-signed in, redirected to Dashboard

> "The account is created in MongoDB, password hashed with bcrypt, and I get a JWT token back — all via a real REST API."

---

### DASHBOARD (0:50–1:20)
**[Screen: Dashboard]**

> "The dashboard shows live stats pulled from the API — total tasks, in-progress, completed, and overdue. Below that, my assigned tasks and project progress."

- Point to the 4 stat cards
- Point to "My Assigned Tasks"
- Point to project progress bars

---

### ADMIN FEATURES (1:20–2:10)
**[Screen: Sign in as alice@demo.com / admin123]**

> "Let me login as Alice, who has Admin role. Admins can do everything."

**[Screen: Projects]**
> "I can create a new project, pick a color, add team members."

- Click **+ New Project**
- Fill in name "Q2 Marketing", description, pick green color, check Bob and Carol
- Click **Create Project**
- Click into the project

**[Screen: Kanban board]**
> "Inside a project is a Kanban board. Let me add a task."

- Click **+ Add Task**
- Fill: title "Write blog post", priority High, due date (past date for overdue demo), assign to Bob
- Show the task appearing in Todo column
- Click **→** to cycle it to In Progress, then Done

> "Tasks have priority badges, due dates, and overdue detection is automatic."

---

### ROLE-BASED ACCESS (2:10–2:50)
**[Screen: Sign in as bob@demo.com / member123]**

> "Now logging in as Bob, a Member. Notice — no 'New Project' button. Members can't create projects."

- Show Projects page — no create button
- Open a project — show tasks
- Try to edit a task not assigned to Bob — show it's restricted
- Edit an assigned task — show it works

> "Members can only edit tasks they created or are assigned to. The API enforces this on the backend, not just the UI."

---

### API DEMO (2:50–3:20)
**[Screen: Browser address bar or Postman]**

> "The backend is a real REST API. Let me hit a few endpoints."

- Open: `https://taskflow-backend.up.railway.app/health`
  - Show: `{"status":"ok","app":"TaskFlow API",...}`
- Open: `https://taskflow-backend.up.railway.app/api`
  - Show: endpoint list
- (Optional) Show Postman: GET /api/tasks with Bearer token → JSON response

---

### DATABASE (3:20–3:40)
**[Screen: Railway dashboard (MongoDB plugin)]**

> "Data is stored in MongoDB on Railway. Users, projects, and tasks are all separate collections with proper references and validations."

- Show Railway MongoDB plugin OR show a quick Mongoose model snippet

---

### OUTRO (3:40–4:00)
**[Screen: README on GitHub]**

> "The full source code is on GitHub with a detailed README covering all API endpoints, local setup, and Railway deployment steps. Thanks for watching!"

---

## Recording Tips
- Use **Loom** (free) or **OBS Studio**
- Resolution: 1920×1080, 30fps
- Show browser address bar at all times so live URL is visible
- Keep Railway dashboard open in another tab to prove deployment
- Speak clearly, don't rush
