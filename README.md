# ExpenseFlow

A full-stack personal finance tracker for logging expenses and income, organising them with custom categories, and seeing where your money goes.

<!-- Add screenshots here, e.g. ![Dashboard](docs/dashboard.png) -->
<!-- Live demo: https://your-app.vercel.app -->

## Features

- **Secure accounts:** email-verified registration, one-time email codes at login, and password reset by email
- **Expenses and income:** add, edit and delete entries, each with its own custom categories
- **Dashboard:** summary cards and charts, plus search, sorting and CSV export
- **Profile:** edit your name and upload a profile picture
- **Light and dark themes**, responsive down to mobile

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 19, Vite, Recharts |
| Backend  | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Auth     | JWT access tokens, rotating refresh tokens in httpOnly cookies, bcrypt |
| Security | helmet, CORS allow-list, CSRF origin check, rate limiting, zod validation |
| Email    | Nodemailer (SMTP) |
| Testing  | Vitest, Supertest |
| Storage  | Cloudinary (profile pictures) |

## Project structure

```
ExpenseFlow/
├── backend/    Express + TypeScript API
│   ├── src/
│   └── db/schema.sql
└── frontend/   React + Vite app
```

## Getting started

### Prerequisites

- Node.js 22 or newer
- PostgreSQL 13 or newer
- An SMTP account for sending emails (a Gmail app password works for development)

### 1. Clone

```bash
git clone https://github.com/singhcodes7/ExpenseFlow.git
cd ExpenseFlow
```

### 2. Database

Create an empty PostgreSQL database, then load the schema:

```bash
psql -U <db_user> -d <db_name> -f backend/db/schema.sql
```

### 3. Backend

```bash
cd backend
cp .env.example .env     # then fill in the values (see below)
npm install
npm run dev              # http://localhost:5000
```

### 4. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

## Environment variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API port | `5000` |
| `NODE_ENV` | `development` or `production` | |
| `DATABASE_URL` | Full Postgres connection string (hosted databases) | |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Used when `DATABASE_URL` is not set | |
| `DB_SSL` | `true` for hosted Postgres that requires SSL | `false` |
| `JWT_SECRET` | Secret used to sign access tokens (required) | |
| `SMTP_USER`, `SMTP_PASS` | SMTP credentials for outgoing email | |
| `FRONTEND_URL` | Allowed browser origin and base URL for email links | `http://localhost:5173` |
| `API_URL` | Public URL of this API, used in email links | `http://localhost:5000` |
| `COOKIE_SAMESITE` | `strict`, `lax` or `none` (see Deployment) | `strict` |
| `CLOUDINARY_URL` | Cloudinary connection string for profile pictures (`cloudinary://<api_key>:<api_secret>@<cloud_name>`) | |
### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:5000` |

## Scripts

| Where | Command | What it does |
|-------|---------|--------------|
| backend | `npm run dev` | Start the API with auto-reload |
| backend | `npm run build` | Compile TypeScript to `dist/` |
| backend | `npm start` | Run the compiled server |
| backend | `npm test` | Run the test suite |
| frontend | `npm run dev` | Start the Vite dev server |
| frontend | `npm run build` | Production build |
| frontend | `npm run lint` | Run ESLint |

## Deployment

A typical free setup:

- **Database:** Neon or Supabase. Set `DATABASE_URL` and `DB_SSL=true` on the backend.
- **Backend:** Render, Railway or Fly. Build with `npm install && npm run build`, start with `npm start`. Use `/health` as the health-check path.
- **Frontend:** Vercel or Netlify. Set `VITE_API_URL` to your deployed API URL.

After deploying, set these on the backend:

- `NODE_ENV=production`
- `FRONTEND_URL` to your frontend's address and `API_URL` to the API's address
- `COOKIE_SAMESITE`:
  - Keep `strict` if the frontend and API share one site (for example `app.example.com` and `api.example.com`).
  - Use `none` only if they are on unrelated domains. This needs HTTPS, and some browsers restrict such cookies.

Profile pictures are stored on Cloudinary. Create a free account and set `CLOUDINARY_URL` on the backend. If it isn't set, the app still runs, but picture uploads return an error.

## Security notes

- Passwords are hashed with bcrypt; one-time codes and tokens are stored only as hashes.
- Refresh tokens are rotated on use and can be revoked.
- State-changing requests must come from the configured frontend origin.
- Login, registration and password-reset endpoints are rate limited.

## License

Add a license of your choice (for example MIT) as a `LICENSE` file.