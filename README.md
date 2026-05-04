# 🎓 Prathamesh Sir's LMS Portal

A secure, feature-rich Learning Management System built for JEE, NEET, and board exam preparation.

## ✨ Features

- 🔐 **2-Device IP Lock** - Students can only access from 2 registered devices
- 🛡️ **DRM Protection** - Secure video streaming with 5-minute signed URLs
- 🚫 **Anti-Piracy** - Disable right-click, DevTools detection, screenshot prevention
- 📹 **Bunny.net CDN** - Fast, reliable video streaming worldwide
- 👨‍🏫 **Admin Dashboard** - Complete student, batch, and video management
- 📊 **Real-time Analytics** - Track video views and student progress

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router |
| **Backend** | Node.js, Vercel Serverless Functions |
| **Database** | Neon PostgreSQL |
| **CDN** | Bunny.net Video Streaming |
| **Auth** | JWT with IP tracking |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Neon PostgreSQL account
- Bunny.net account

### Installation

```bash
# Backend
cd backend
npm run setup
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Database setup

- Run the SQL in `backend/database/schema.sql` in your Neon SQL editor.
