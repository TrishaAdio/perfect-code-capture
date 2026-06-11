# SymDeals Backend (Express + MongoDB)

This folder is **NOT run by Lovable**. It exists so you can copy it to a VPS
and run the auth API there. The Lovable frontend talks to it via
`http://localhost:5000` (or whatever host you deploy it to).

## Structure

```
backend/
  config/        db + jwt helpers
  controllers/   request handlers
  middleware/    auth (Bearer JWT)
  models/        Mongoose schemas
  routes/        Express routers
  server.js      entrypoint
  package.json
  .env.example
```

## Run on a VPS

```bash
cd backend
cp .env.example .env       # edit JWT_SECRET, MONGODB_URI, CORS_ORIGIN
npm install
node server.js
```

If `MONGODB_URI` is empty in `.env`, you'll be prompted:

```
Enter MongoDB URI: mongodb://localhost:27017/symdeals
```

## API

| Method | Path                | Body                           | Auth        |
| ------ | ------------------- | ------------------------------ | ----------- |
| POST   | `/api/auth/signup`  | `{ name, email, password }`    | —           |
| POST   | `/api/auth/login`   | `{ email, password }`          | —           |
| GET    | `/api/auth/me`      | —                              | Bearer JWT  |
| GET    | `/health`           | —                              | —           |

Success response:

```json
{ "success": true, "token": "...", "user": { "id": "...", "name": "...", "email": "..." } }
```

Error response:

```json
{ "success": false, "message": "Invalid email or password" }
```

## Frontend integration

The signup/login forms in this project POST to same-origin `/api/auth/{signup|login}`
by default. Override at build time with `VITE_API_URL` only when the API lives
on a separate origin, e.g.:

```bash
VITE_API_URL=https://api.symdeals.store npm run build
```

## Production notes

- Set a strong `JWT_SECRET` (32+ chars). Rotating it invalidates all sessions.
- Lock `CORS_ORIGIN` to `https://symdeals.store,https://www.symdeals.store`.
- Run with PM2: `pm2 start server.js --name symdeals-api`.
- Put Nginx + TLS in front.
