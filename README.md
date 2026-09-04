# Grow Wealth

USDT BEP-20 investment & member platform — **full stack deployable on Vercel**.

## Live deployment

| | URL |
|--|-----|
| **Website** | https://grow-wealth-neon.vercel.app |
| **API Health** | https://grow-wealth-neon.vercel.app/api/health |
| **GitHub** | https://github.com/Lakshyaprajapat6990/Grow_Wealth |
| **Vercel Dashboard** | https://vercel.com/lakshyas-projects-ccb3a0a8/grow-wealth |

---

## Demo logins

| Role | User ID | Password |
|------|---------|----------|
| Super Admin | `GW0000001` | `Admin@123` |
| Demo Client | `GW9999999` | `Client@123` |

Transaction password (demo client): `123456`

## Local development

```bash
npm run install:all
cp .env.example .env   # fill MongoDB + secrets
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000

Seed accounts:

```bash
npm run seed --prefix server
npm run seed:demo --prefix server
```

---

## Full deploy on Vercel

Repo: https://github.com/devlakshya6990-alt/Grow_Wealth

### 1. Push to GitHub

```bash
git add .
git commit -m "Vercel full stack deploy"
git push -u origin main
```

### 2. Import on Vercel

1. Open [Vercel Dashboard](https://vercel.com/devlakshya6990-9244)
2. **Add New → Project**
3. Import **`devlakshya6990-alt/Grow_Wealth`**
4. Leave **Root Directory** as `.` (project root)
5. Vercel reads `vercel.json` automatically

### 3. Environment variables (Vercel → Settings → Environment Variables)

| Variable | Example | Required |
|----------|---------|----------|
| `MONGODB_URI` | `mongodb+srv://.../growwealth` | Yes |
| `JWT_SECRET` | long random string | Yes |
| `JWT_EXPIRES` | `7d` | Yes |
| `APP_NAME` | `Grow Wealth` | Yes |
| `JOINING_AMOUNT` | `1` | Yes |
| `ROI_PERCENT` | `1` | Yes |
| `FIRST_WITHDRAW_MIN` | `10` | Yes |
| `DEPOSIT_ADDRESS` | `0xYourBep20Address` | Yes |
| `CLIENT_URL` | `https://your-app.vercel.app` | Yes (set after first deploy) |

> After first deploy, copy your Vercel URL and set `CLIENT_URL` to it, then redeploy.

### 4. Deploy

Click **Deploy**. One URL serves both:

- **Website:** `https://your-app.vercel.app`
- **API:** `https://your-app.vercel.app/api/health`

No separate backend host needed — frontend and API run on the same Vercel project.

### 5. Seed production database (run once locally)

```bash
# Use production MONGODB_URI in .env, then:
npm run seed --prefix server
npm run seed:demo --prefix server
```

---

## Architecture on Vercel

```
your-app.vercel.app
├── /              → React app (client/dist)
├── /dashboard   → React SPA routes
└── /api/*       → Express serverless (api/index.js)
```

## Stack

- **Client:** Vite + React (`client/`)
- **API:** Express serverless (`api/` + `server/src/`)
- **Database:** MongoDB Atlas (`growwealth`)
