# iWa — Мессенджер / Messenger

> Современный полнофункциональный мессенджер с чатами в реальном времени, групповыми разговорами и каналами.

---

## 🇷🇺 Русский

### Описание
**iWa** — это веб-мессенджер с открытым исходным кодом, построенный на стеке React + Node.js. Поддерживает личные чаты, групповые беседы, публичные каналы, обмен файлами и многое другое.

### Возможности
- 🔐 Регистрация и авторизация (JWT)
- 💬 Личные чаты и групповые беседы
- 📢 Публичные и приватные каналы
- ⚡ Сообщения в реальном времени (Socket.io)
- 📎 Обмен файлами и изображениями
- 😀 Реакции на сообщения
- 📌 Закреплённые сообщения
- ✏️ Редактирование и удаление сообщений
- ↩️ Ответ на сообщения и пересылка
- 🔍 Глобальный поиск (Ctrl+K)
- 🌙 Тёмная/светлая тема
- 🌐 Русский и английский интерфейс
- 📱 Адаптивный дизайн

### Технологии
| Компонент | Технология |
|-----------|-----------|
| Frontend | React 18 + Vite + TypeScript + TailwindCSS |
| Backend | Node.js + Express + Socket.io |
| База данных | SQLite (better-sqlite3) |
| Аутентификация | JWT + bcryptjs |
| Маршрутизация | React Router v6 |

### Установка

```bash
# 1. Клонировать репозиторий
git clone <repo-url>
cd iWa

# 2. Установить зависимости
npm install

# 3. Запустить в режиме разработки
npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

### Переменные окружения

Создайте файл `server/.env`:
```env
PORT=3001
JWT_SECRET=your-secret-key-here
CLIENT_URL=http://localhost:5173
```

### Сборка для продакшена

```bash
npm run build
npm start
```

---

## 🇬🇧 English

### Description
**iWa** is an open-source web messenger built with React + Node.js. Supports direct chats, group conversations, public channels, file sharing, and much more.

### Features
- 🔐 Registration and authentication (JWT)
- 💬 Direct chats and group conversations
- 📢 Public and private channels
- ⚡ Real-time messaging (Socket.io)
- 📎 File and image sharing
- 😀 Message reactions
- 📌 Pinned messages
- ✏️ Edit and delete messages
- ↩️ Reply to messages and forwarding
- 🔍 Global search (Ctrl+K)
- 🌙 Dark/light theme
- 🌐 Russian and English UI
- 📱 Responsive design

### Tech Stack
| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + Vite + TypeScript + TailwindCSS |
| Backend | Node.js + Express + Socket.io |
| Database | SQLite (better-sqlite3) |
| Authentication | JWT + bcryptjs |
| Routing | React Router v6 |

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd iWa

# 2. Install dependencies
npm install

# 3. Run in development mode (starts both server and client)
npm run dev
```

App available at: http://localhost:5173

### Environment Variables

Create `server/.env`:
```env
PORT=3001
JWT_SECRET=your-secret-key-here
CLIENT_URL=http://localhost:5173
```

### Production Build

```bash
npm run build
npm start
```

### Project Structure

```
iWa/
├── package.json          # Root workspace config
├── server/               # Express + Socket.io backend
│   └── src/
│       ├── db/           # SQLite database
│       ├── middleware/   # JWT auth middleware
│       ├── routes/       # API routes
│       ├── socket/       # Socket.io handlers
│       └── types/        # TypeScript types
└── client/               # React frontend
    └── src/
        ├── components/   # UI components
        ├── contexts/     # React contexts
        ├── hooks/        # Custom hooks
        ├── pages/        # Page components
        └── services/     # API service
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/users/search | Search users |
| GET | /api/chats | List user chats |
| POST | /api/chats/direct | Create direct chat |
| POST | /api/chats/group | Create group chat |
| GET | /api/messages/:chatId | Get messages |
| POST | /api/messages/:chatId | Send message |
| GET | /api/channels/public | List public channels |
