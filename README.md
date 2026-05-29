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
| **Database** | PostgreSQL (Supabase/Neon) |
| **CDN** | Bunny.net Video Streaming |
| **Auth** | JWT with IP tracking |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase (Postgres) account (or Neon)
- Bunny.net account

### Installation

```bash
npm install
npm run install:all

# copy .env.example -> .env (repo root) and fill values

npm run dev
```

### Database setup

- Create a Supabase project (Postgres), then copy the project’s Postgres connection string into `.env` (repo root) as `DATABASE_URL`.
- Run the SQL in `backend/database/schema.sql` in the Supabase **SQL Editor** (or Neon SQL editor).

## Vercel (frontend + backend, professional workflow)

- Deploy `backend/` as one Vercel project (uses `backend/vercel.json`)
  - Env vars: `DATABASE_URL`, `JWT_SECRET`, `BUNNY_API_KEY`, `BUNNY_LIBRARY_ID`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `NODE_ENV`, `FRONTEND_URL`
- Deploy `frontend/` as one Vercel project (uses `frontend/vercel.json`)
  - Env vars: `VITE_API_BASE_URL` (set to your deployed backend URL + `/api`), `VITE_BUNNY_LIBRARY_ID` (optional)
