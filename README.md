# Grow Wealth

USDT BEP-20 investment & member platform (React + Express + MongoDB).

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

## Vercel (frontend)

1. Import this repo at [Vercel](https://vercel.com/devlakshya6990-9244)
2. Set **Root Directory** to `client`
3. Add environment variable:
   - `VITE_API_URL` = your live API URL (e.g. `https://your-api.onrender.com/api`)
4. Deploy

> The Express API must be hosted separately (Render, Railway, VPS). Vercel hosts the React client only.

## Stack

- **Client:** Vite + React
- **Server:** Node.js + Express
- **Database:** MongoDB Atlas (`growwealth`)
