# 💬 iWa — Modern Messenger

> A beautiful, real-time messenger prototype inspired by Telegram and Discord.
> Dark theme · Real-time messaging · Group chats · Channels · Emoji support · File sharing

![iWa Auth Screen](https://github.com/user-attachments/assets/8fe3bacc-a2fb-467b-9bd3-23f235a9c50a)

---

## 🚀 Run in 2 Steps

```bash
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 📖 The Story

iWa was born out of a simple idea: *what if building a modern messenger didn't require a team of 20 engineers?*

The name "iWa" comes from the Yoruba word for "existence" or "presence" — fitting for an app built around real-time human connection. The prototype was created to demonstrate that a fully functional, beautiful messenger can be built with just a handful of well-chosen open-source tools, SQLite as the database, and no Docker, no Kubernetes, no complex infrastructure.

The goal: **a beginner can clone it, run two commands, and have a working messenger.**

---

## ✨ Features

| Feature | Status |
|---|---|
| 🔐 Username/password auth with JWT | ✅ |
| 💬 Direct (1-on-1) messaging | ✅ |
| 👥 Group chats | ✅ |
| 📢 Channels (broadcast) | ✅ |
| ⚡ Real-time messages via WebSocket | ✅ |
| ✍️ Typing indicators | ✅ |
| 🟢 Online/offline status | ✅ |
| 📜 Message history (SQLite) | ✅ |
| 😊 Emoji picker | ✅ |
| 📎 File & image sharing | ✅ |
| 🔍 Conversation search | ✅ |
| 🎨 Dark theme (Telegram-style) | ✅ |
| 📱 Responsive layout | ✅ |

---

## 🏗️ Architecture

```
iWa/
├── package.json          ← Root: npm workspaces + concurrently
├── client/               ← React + Vite + TypeScript + TailwindCSS
│   ├── src/
│   │   ├── App.tsx                    ← Root component + routing logic
│   │   ├── api/index.ts               ← Axios HTTP client (auto-attaches JWT)
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        ← Login/register/logout state
│   │   │   └── SocketContext.tsx      ← Socket.io connection + online users
│   │   ├── types/index.ts             ← TypeScript interfaces
│   │   └── components/
│   │       ├── Auth/AuthPage.tsx      ← Login & Register form
│   │       ├── Common/Avatar.tsx      ← Colored letter avatar
│   │       ├── Sidebar/
│   │       │   ├── Sidebar.tsx              ← Left panel + user footer
│   │       │   ├── ConversationItem.tsx     ← Single chat row
│   │       │   └── NewConversationModal.tsx ← Create direct/group/channel
│   │       └── Chat/
│   │           ├── ChatWindow.tsx     ← Main chat area
│   │           ├── ChatHeader.tsx     ← Name + online status bar
│   │           ├── MessageBubble.tsx  ← Individual message (own/other)
│   │           ├── MessageInput.tsx   ← Text input + emoji + file upload
│   │           └── TypingIndicator.tsx ← Animated "X is typing..."
└── server/               ← Node.js + Express + Socket.io + SQLite
    ├── src/
    │   ├── index.js           ← Express app + Socket.io server entry
    │   ├── db.js              ← SQLite setup + schema creation
    │   ├── middleware/
    │   │   └── auth.js        ← JWT verification middleware
    │   ├── routes/
    │   │   ├── auth.js        ← POST /register, POST /login
    │   │   ├── users.js       ← GET /users, GET /users/me
    │   │   ├── conversations.js ← CRUD + message history
    │   │   └── upload.js      ← POST /upload (multer)
    │   └── socket/
    │       └── index.js       ← All real-time event handlers
    ├── data/iwa.db            ← SQLite database (auto-created)
    └── uploads/               ← Uploaded files (auto-created)
```

### Database Schema

```sql
users                  -- id, username, password (bcrypt), avatar_color, last_seen
conversations          -- id, type (direct/group/channel), name, avatar_color, created_by
conversation_members   -- conversation_id, user_id, role (admin/member)
messages               -- id, conversation_id, sender_id, content, type, file_url, created_at
```

### Real-time Events (Socket.io)

| Client → Server | Description |
|---|---|
| `send_message` | Send a new message |
| `typing_start` | Started typing in a conversation |
| `typing_stop` | Stopped typing |
| `join_conversation` | Join a room |

| Server → Client | Description |
|---|---|
| `new_message` | Broadcast new message to room |
| `user_typing` | Someone started typing |
| `user_stopped_typing` | Someone stopped typing |
| `user_online` | User connected |
| `user_offline` | User disconnected |

---

## 📋 Detailed Launch Instructions

### Prerequisites

- **Node.js v18+** — download from https://nodejs.org  
  Verify: `node --version` (should show v18.x or higher)
- **npm v9+** — comes with Node.js  
  Verify: `npm --version`

---

### Windows (PowerShell)

```powershell
# 1. Clone the repository
git clone https://github.com/bum3n/iWa.git
cd iWa

# 2. Install all dependencies (installs both /client and /server)
npm install

# 3. Start the app (opens both server on :3001 and client on :5173)
npm run dev

# 4. Open your browser
start http://localhost:5173
```

If you see an error about execution policy:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### macOS / Linux (Terminal)

```bash
# 1. Clone the repository
git clone https://github.com/bum3n/iWa.git
cd iWa

# 2. Install all dependencies
npm install

# 3. Start the app
npm run dev

# 4. Open your browser at http://localhost:5173
```

---

### What Happens When You Run `npm run dev`

Two processes start simultaneously:
- **Server** → `http://localhost:3001` (Express + Socket.io API)
- **Client** → `http://localhost:5173` (React + Vite dev server with HMR)

The Vite dev server **proxies** all `/api` and `/uploads` requests to the server, so you only ever visit `http://localhost:5173`.

---

## 🔧 Troubleshooting

### Port already in use
```bash
# Kill whatever is on port 3001 or 5173
# macOS/Linux:
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Windows PowerShell:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### `npm install` fails with peer dependency errors
```bash
npm install --legacy-peer-deps
```

### SQLite native module error
```bash
cd server
npm rebuild better-sqlite3
cd ..
npm run dev
```

### Database is corrupted / want a fresh start
```bash
rm server/data/iwa.db
npm run dev   # database is recreated automatically
```

### `concurrently` not found
```bash
npm install --save-dev concurrently
npm run dev
```

### Nothing loads at localhost:5173
Make sure the server is running first (check for `🚀 iWa server running` in the terminal). The client proxies API calls to `:3001`.

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend framework | React 18 + TypeScript | Industry standard, great DX |
| Build tool | Vite 5 | Instant HMR, fast builds |
| Styling | TailwindCSS 3 | Utility-first, no CSS files needed |
| Real-time | Socket.io | Reliable WebSocket with fallbacks |
| HTTP client | Axios | Simple, interceptors for JWT |
| Emoji | emoji-picker-react | Easy drop-in emoji picker |
| Dates | date-fns | Lightweight date formatting |
| Backend | Node.js + Express | Simple, widely known |
| Database | SQLite (better-sqlite3) | Zero config, file-based, sync API |
| Auth | bcryptjs + JWT | Secure password hashing, stateless auth |
| File upload | multer | Simple multipart form handling |
| Dev runner | concurrently | Run client + server with one command |

---

## 📁 Folder Guide

| Folder / File | What it does |
|---|---|
| `/client` | Everything the user sees in the browser |
| `/client/src/context` | Global state (auth, socket connection) |
| `/client/src/components` | All React UI components |
| `/client/src/api` | Axios instance with auto JWT headers |
| `/server` | Everything that runs on the backend |
| `/server/src/routes` | REST API endpoints |
| `/server/src/socket` | Real-time WebSocket event logic |
| `/server/data/` | SQLite database file (auto-created) |
| `/server/uploads/` | User-uploaded files (auto-created) |

---

## 🎨 Screenshots

**Login Screen**  
![Login](https://github.com/user-attachments/assets/8fe3bacc-a2fb-467b-9bd3-23f235a9c50a)

**Main Layout — Sidebar + Welcome Screen**  
![Main Layout](https://github.com/user-attachments/assets/8fd36536-f00a-4f87-b917-6e433af40499)

**Live Chat with Message Bubbles**  
![Chat](https://github.com/user-attachments/assets/18273bee-58b5-43bd-bbd5-29b1913d6b3d)

---

## 🔒 Security Notes

This is a **prototype** — not production-ready. For production use:
- Move `JWT_SECRET` to a secure environment variable (never commit it)
- Add rate limiting (`express-rate-limit`)
- Add input sanitization
- Serve over HTTPS
- Use a proper file storage service (S3, Cloudflare R2) instead of local `uploads/`

---

## 📄 License

MIT — free to use, modify, and distribute.
