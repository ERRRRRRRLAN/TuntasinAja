# 🚀 Setup T3 Stack - TuntasinAja

Panduan setup project TuntasinAja menggunakan T3 Stack (Next.js + TypeScript + tRPC + Prisma + PostgreSQL).

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm atau yarn

## 🔧 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

1. Buat database PostgreSQL:
```sql
CREATE DATABASE tuntasinaja;
```

2. Copy file `.env.example` menjadi `.env`:
```bash
cp env.example .env
```

3. Edit file `.env` dan isi dengan kredensial database Anda:
```
DATABASE_URL="postgresql://user:password@localhost:5432/tuntasinaja?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-random-secret-key-here"
```

4. Generate Prisma Client:
```bash
npm run db:generate
```

5. Push schema ke database:
```bash
npm run db:push
```

### 3. Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 📁 Struktur Project

```
TuntasinAja/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── pages/            # Page components
│   └── threads/          # Thread components
├── lib/                   # Utilities
│   ├── prisma.ts         # Prisma client
│   ├── trpc.ts           # tRPC client setup
│   └── utils.ts          # Helper functions
├── pages/                 # Next.js pages
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth routes
│   │   └── trpc/         # tRPC routes
│   └── auth/             # Auth pages
├── server/                # Server-side code
│   └── trpc/             # tRPC routers
│       ├── routers/      # Feature routers
│       └── root.ts       # Root router
├── prisma/               # Prisma
│   └── schema.prisma     # Database schema
└── types/                 # TypeScript types
```

## 🛠️ Scripts

- `npm run dev` - Run development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push Prisma schema to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Create migration
- `npm run type-check` - Type check TypeScript

## 🔐 Authentication

Project menggunakan NextAuth.js dengan Credentials provider. User dapat:
- Register akun baru
- Login dengan email/password
- Session management otomatis

## 📊 Database Schema

- **User** - Data pengguna
- **Thread** - Thread tugas per mata pelajaran
- **Comment** - Komentar/tugas dalam thread
- **UserStatus** - Status selesai per user
- **History** - History tugas yang sudah selesai

## 🎨 Tech Stack

- **Frontend:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Backend:** Next.js API Routes + tRPC
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js
- **Language:** TypeScript
- **Validation:** Zod

## 📝 Notes

- Pastikan PostgreSQL sudah running sebelum menjalankan `db:push`
- Generate `NEXTAUTH_SECRET` yang aman untuk production
- Database URL harus sesuai dengan konfigurasi PostgreSQL Anda

