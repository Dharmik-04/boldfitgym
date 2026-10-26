# 🏋️‍♂️ BoldFit Gym Management Platform

A modern, full-stack Gym Management & Member Portal platform built with **Next.js (App Router, React 19, TypeScript, Tailwind CSS, Framer Motion)** and an **Express.js / Supabase** backend.

---

## 🚀 Features

### 🌟 Public Landing Page
- High-performance, responsive hero section with interactive 3D media scroll effects.
- Dynamic Membership Plans fetched directly from the database.
- Featured programs, expert trainers, facilities preview, and quick contact inquiry.

### 🛡️ Admin Management Dashboard
- **Analytics & Key Metrics**: Revenue overview, active memberships, today's attendance, and expired subscriptions.
- **Member Management**: Registration, profile editing, search, filters, and status toggles.
- **Membership Plans**: Tiered pricing, duration configuration, features, and popularity badges.
- **Membership Assignments**: Assign members to plans with auto-calculated start and expiration dates.
- **Payment Processing**: Record cash/online payments, generate professional PDF invoices, and trigger email/SMS/WhatsApp receipts.
- **Trainer Management & Assignments**: Trainer directory, specialty tags, client capacity, and 1-on-1 member pairings.
- **Attendance Tracking**: Real-time member check-in/check-out tracking with device and timestamp logging.
- **Notification System**: Automated renewal alerts, payment reminders, and custom broadcast notices.
- **Financial & Attendance Reports**: Exportable data summaries and performance tracking.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Lucide Icons, jsPDF
- **Backend**: Node.js, Express.js 5, Supabase (PostgreSQL), JWT Authentication, Helmet, Morgan, PDFKit, Nodemailer, Twilio

---

## 📂 Project Structure

```text
├── app/                  # Next.js App Router (Landing page & Admin portal)
├── components/           # UI and Admin tab components
│   ├── admin/            # Admin management tabs (Members, Payments, Attendance, etc.)
│   └── ui/               # Reusable UI components
├── context/              # React Context (AppContext)
├── lib/                  # Utilities and API configuration
│   └── apiConfig.ts      # Dynamic API base URL resolver (supports local & Vercel deployment)
├── public/               # Static assets (3D video, hero images, icons)
├── backend/              # Express.js REST API & Database services
│   ├── src/
│   │   ├── config/       # Supabase and app configuration
│   │   ├── controllers/  # API route controllers
│   │   ├── middleware/   # JWT authentication and validation middleware
│   │   ├── routes/       # Express route handlers
│   │   ├── services/     # Business logic, PDF generator, email/SMS services
│   │   └── validators/   # Request validation schemas
│   ├── scripts/          # Database seeding and test scripts
│   ├── server.js         # Backend server entrypoint
│   └── .env.example      # Backend environment variables template
├── .env.example          # Frontend environment variables template
└── README.md
```

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js (v18 or newer recommended)
- Git
- A Supabase project

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your environment file from the example:
   ```bash
   cp .env.example .env
   ```
4. Fill in your credentials in `backend/.env`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   DATABASE_URL=postgresql://postgres:yourpassword@db.your-project.supabase.co:5432/postgres
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```
5. Start the backend server:
   ```bash
   npm run dev
   # Runs on http://localhost:5000
   ```

### 3. Frontend Setup
1. In the root directory, install dependencies:
   ```bash
   npm install
   ```
2. (Optional) Create `.env.local` for local customization:
   ```bash
   cp .env.example .env.local
   ```
   *By default, if `NEXT_PUBLIC_API_URL` is omitted, it automatically falls back to `http://localhost:5000`.*
3. Start the Next.js development server:
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

---

## 🚢 Deployment to Vercel

### Step 1: Deploy Frontend on Vercel
1. Push this repository to GitHub (e.g., `https://github.com/Dharmik-04/boldfitgym.git`).
2. Go to [Vercel](https://vercel.com) and log in.
3. Click **"Add New..."** -> **"Project"**.
4. Select the **`boldfitgym`** repository.
5. In **Framework Preset**, select **Next.js** (detected automatically).
6. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend production URL (e.g., `https://boldfitgym-api.onrender.com`).
7. Click **Deploy**.

---

### Step 2: Deploy Backend (Render / Railway / Koyeb)

The `backend` directory is a standard Express.js application designed to run 24/7 on services like [Render](https://render.com) or [Railway](https://railway.app):

#### Deploying on Render:
1. Log in to Render and select **New Web Service**.
2. Connect your GitHub repository: `Dharmik-04/boldfitgym`.
3. Set the following settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `SUPABASE_URL`: `https://your-project.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: `your_key`
   - `JWT_SECRET`: `your_secret`
5. Click **Create Web Service**.
6. Copy the provided Render URL (e.g., `https://boldfitgym-api.onrender.com`) and paste it as `NEXT_PUBLIC_API_URL` in your Vercel project settings!

---

## 📄 License
ISC / Private
