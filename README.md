# ⚡ TaskFlow — Team Task Manager

> A full-stack team task management app with role-based access control, built with React, Node.js, Express, and MongoDB.

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Frontend** | `https://taskflow-frontend.up.railway.app` |
| **Backend API** | `https://taskflow-backend.up.railway.app` |
| **API Health** | `https://taskflow-backend.up.railway.app/health` |

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | alice@demo.com | admin123 |
| Member | bob@demo.com | member123 |
| Member | carol@demo.com | carol123 |

---

## 🚀 Features

### Authentication
- JWT-based signup & login
- Passwords hashed with bcrypt (12 rounds)
- Token stored in localStorage, auto-refreshed
- Protected routes — 401 auto-logout

### Role-Based Access Control (RBAC)
| Action | Admin | Member |
|--------|-------|--------|
| Create/delete projects | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Create tasks | ✅ | ✅ (own projects) |
| Edit any task | ✅ | Own tasks only |
| Delete any task | ✅ | Own tasks only |
| Manage users | ✅ | ❌ |
| View team | ✅ | ✅ |

### Projects
- Create projects with name, description, color
- Add/remove team members per project
- Progress tracking (task completion %)
- Cascade delete tasks on project deletion

### Tasks (Kanban Board)
- Three-column board: Todo → In Progress → Done
- Priority levels: Low / Medium / High
- Due date tracking with automatic overdue detection
- Filter by status and assignee
- One-click status cycling

### Dashboard
- Live stats: total, in-progress, done, overdue
- My assigned tasks summary
- Per-project progress bars

### Team Management
- View all team members (Admin)
- Add new members via signup flow
- Soft-delete (deactivate) users

---

## 🏗️ Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express.js 4 |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit |
| Logging | morgan |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| HTTP Client | Axios (with interceptors) |
| State | React Context + useState |
| Styling | Inline styles (zero deps) |
| Auth | JWT in localStorage |

### Deployment
| Service | Platform |
|---------|----------|
| Backend | Railway (Node.js) |
| Frontend | Railway (serve) |
| Database | Railway (MongoDB plugin) |

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js    # signup, login, me
│   │   │   ├── userController.js    # user CRUD (admin)
│   │   │   ├── projectController.js # project CRUD + members
│   │   │   └── taskController.js    # task CRUD + dashboard stats
│   │   ├── middleware/
│   │   │   ├── auth.js              # protect, adminOnly, projectMember
│   │   │   └── errorHandler.js      # validation, 404, global error
│   │   ├── models/
│   │   │   ├── User.js              # bcrypt hashing, avatar auto-gen
│   │   │   ├── Project.js           # members[], cascade relations
│   │   │   └── Task.js              # status lifecycle, isOverdue virtual
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── projects.js
│   │   │   └── tasks.js
│   │   ├── utils/
│   │   │   └── seed.js              # Demo data seeder
│   │   └── server.js                # Express app entry point
│   ├── .env.example
│   ├── railway.json
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.js       # login, signup, logout, session restore
    │   ├── utils/
    │   │   └── api.js               # Axios client + all API calls
    │   ├── App.js                   # All views + layout
    │   └── index.js
    ├── .env.example
    ├── railway.json
    └── package.json
```

---

## 🔌 REST API Reference

### Auth
```
POST   /api/auth/signup     Register new user
POST   /api/auth/login      Login, returns JWT
GET    /api/auth/me         Get current user (🔒)
PATCH  /api/auth/me         Update profile (🔒)
```

### Users (🔒 Auth required)
```
GET    /api/users           List all active users
GET    /api/users/:id       Get user by ID
GET    /api/users/:id/stats Task stats for user
PATCH  /api/users/:id       Update user role (👑 Admin)
DELETE /api/users/:id       Deactivate user (👑 Admin)
```

### Projects (🔒 Auth required)
```
GET    /api/projects              List accessible projects
GET    /api/projects/:id          Get project details
GET    /api/projects/:id/stats    Task stats for project
POST   /api/projects              Create project (👑 Admin)
PATCH  /api/projects/:id          Update project (👑 Admin)
DELETE /api/projects/:id          Delete project + tasks (👑 Admin)
POST   /api/projects/:id/members          Add member (👑 Admin)
DELETE /api/projects/:id/members/:userId  Remove member (👑 Admin)
```

### Tasks (🔒 Auth required)
```
GET    /api/tasks               List all accessible tasks
GET    /api/tasks/dashboard     Dashboard stats
GET    /api/tasks/:id           Get task by ID
PATCH  /api/tasks/:id           Update task (creator/assignee/admin)
DELETE /api/tasks/:id           Delete task (creator/admin)

GET    /api/projects/:pid/tasks  Tasks for a project
POST   /api/projects/:pid/tasks  Create task in project
```

### Query Parameters (GET /api/tasks)
```
?status=Todo|In Progress|Done
?priority=Low|Medium|High
?assignee=<userId>
?project=<projectId>
?overdue=true
```

---

## 🛡️ Validations

### User
- Name: 2–60 characters, required
- Email: valid format, unique
- Password: min 6 characters, bcrypt hashed

### Project
- Name: 2–100 characters, required
- Description: max 500 characters
- Color: valid hex (#RRGGBB)
- Creator always included as member

### Task
- Title: 2–200 characters, required
- Status: enum [Todo, In Progress, Done]
- Priority: enum [Low, Medium, High]
- Due date: valid ISO 8601 date
- Assignee must be a project member

---

## ⚙️ Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm install
npm run seed      # Load demo data
npm run dev       # Start on :5000
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env
# Edit .env — set REACT_APP_API_URL=http://localhost:5000/api
npm install
npm start         # Start on :3000
```

---

## 🚂 Railway Deployment (Step-by-Step)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "feat: initial TaskFlow full-stack app"
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

### 2. Deploy Backend on Railway
1. Go to [railway.app](https://railway.app) → **New Project**
2. Click **Deploy from GitHub repo** → select your repo
3. Set **Root Directory** to `backend`
4. Add a **MongoDB** plugin from the Railway dashboard
5. Set environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=<generate a 32+ char random string>
   JWT_EXPIRES_IN=7d
   CLIENT_URL=https://taskflow-frontend.up.railway.app
   MONGODB_URI=<copied from MongoDB plugin → Connect>
   ```
6. Deploy → note the generated URL (e.g. `https://taskflow-backend.up.railway.app`)
7. Run seed: In Railway shell → `node src/utils/seed.js`

### 3. Deploy Frontend on Railway
1. **New Service** in same project → GitHub repo
2. Set **Root Directory** to `frontend`
3. Set environment variables:
   ```
   REACT_APP_API_URL=https://taskflow-backend.up.railway.app/api
   ```
4. Deploy → get your frontend URL

### 4. Update CORS
Go back to backend service → update `CLIENT_URL` to your frontend Railway URL.

### Verify
- Visit `/health` on backend URL → should return `{"status":"ok"}`
- Open frontend URL → login with demo accounts

---

## 🔐 Security Features

- **Helmet.js** — sets secure HTTP headers
- **CORS** — whitelist only frontend domain
- **Rate limiting** — 200 req/15min global, 20 req/15min on auth routes
- **bcrypt** — passwords hashed with 12 salt rounds
- **JWT** — stateless auth, 7-day expiry
- **Input validation** — express-validator on all POST/PATCH routes
- **Mongoose sanitization** — schema-level type enforcement
- **Soft deletes** — users deactivated, not destroyed

---

## 📹 Demo Video Script (2–5 min)

1. **Show live URL** in browser (30s)
2. **Sign up** as a new user (30s)
3. **Login as Admin** (alice@demo.com) (20s)
4. **Dashboard** — walk through stats cards and project progress (30s)
5. **Create a project**, add members (45s)
6. **Create tasks** with different priorities and due dates (45s)
7. **Kanban board** — cycle task statuses, show overdue detection (30s)
8. **Login as Member** (bob@demo.com) — show restricted access (45s)
9. **Team view** — show member cards (20s)
10. **API demo** — open `/health` and `/api` in browser (20s)

---

## 📬 Submission Checklist

- [x] Live URL (Railway frontend)
- [x] GitHub repository (public)
- [x] README with setup instructions
- [ ] 2–5 min demo video (record with Loom or OBS)

---

## 👤 Author

Built for the Team Task Manager Full-Stack Assignment.

**Stack:** React · Node.js · Express · MongoDB · Railway
