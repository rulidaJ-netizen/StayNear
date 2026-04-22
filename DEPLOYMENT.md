# StayNear Deployment

This project uses:

- Vercel for the Vite frontend
- Railway for the Express backend
- Railway MySQL for the production database

## Production Bug

The frontend can end up calling `localhost:5000` in production for one specific reason:

- `.env` is currently tracked in git in this repository
- that tracked `.env` contains `VITE_API_URL=http://localhost:5000`
- Vite bakes `VITE_*` variables into the production frontend bundle at build time
- if Vercel builds from a repo that still includes that tracked `.env`, the production bundle ships a localhost API URL

Fix that first:

```bash
git rm --cached .env
```

Then commit the removal so Vercel no longer receives `.env` from the repository.

If any real secrets were ever committed, rotate them.

## Architecture

- Railway runs `src/server/server.js`
- `package.json` already has the correct production start command: `npm run start`
- `npm run start` runs `node src/server/server.js`
- Vercel builds the frontend from `dist`
- the frontend talks to Railway through `VITE_API_URL`
- uploads and profile metadata can live on a Railway volume mounted at `/data`

## Railway Backend Setup

1. Create a Railway project.
2. Add a MySQL service.
3. Add a backend service from this repository root.
4. Attach a volume and mount it at `/data`.
5. Make sure Railway uses the repo root `railway.json`.
6. Keep the backend start command as `npm run start`.

Railway backend environment variables:

```env
NODE_ENV=production
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=replace_with_a_long_random_secret
DATA_DIR=/data
CORS_ORIGIN=https://your-app.vercel.app,https://your-custom-domain.com
```

Important notes:

- Do not set `VITE_API_URL` or `VITE_IMAGE_BASE_URL` in Railway
- Do not use `localhost` or `127.0.0.1` for database values in Railway
- Railway provides `PORT` automatically, so do not force `PORT=5000` there
- `railway.json` now health-checks `/api/health`

If you prefer individual DB variables instead of a single URL, Railway provides equivalents like:

```env
DB_HOST=<Railway MySQL host>
DB_PORT=<Railway MySQL port>
DB_USER=<Railway MySQL user>
DB_PASSWORD=<Railway MySQL password>
DB_NAME=<Railway MySQL database>
```

This codebase and Prisma prefer `DATABASE_URL`.

### Backend URL

Your public backend URL should look like:

```text
https://your-backend.up.railway.app
```

### Prisma on Railway

Run migrations before the first production start:

```bash
npm run prisma:migrate:deploy
```

If Railway becomes the source of truth for schema/data, pull it locally with:

```bash
npx prisma db pull
npx prisma generate
```

## Railway MySQL Data Import

If your local MySQL data needs to move into Railway:

1. Export your local database.
2. Import it into the Railway MySQL instance.
3. Confirm the imported tables match the Prisma models.
4. Run `npm run prisma:migrate:deploy` if pending migrations still exist.

## Vercel Frontend Setup

1. Import this repo into Vercel as the frontend project.
2. Let Vercel build the app with the root `vercel.json`.
3. Add these frontend environment variables in Vercel:

```env
VITE_API_URL=https://your-backend.up.railway.app
VITE_IMAGE_BASE_URL=https://your-backend.up.railway.app
```

Notes:

- Do not include a trailing slash
- apply them to `Production`
- apply them to `Preview` too if preview deployments should hit Railway
- `src/client/shared/api/client.js` now accepts either the Railway origin or a full `/api` URL
- if `VITE_API_URL` is set to a bare origin, the client automatically uses its `/api` routes

## CORS

The backend now uses safer environment-based CORS behavior:

- local development automatically allows common Vite origins
- production only allows origins listed in `CORS_ORIGIN`
- requests without a browser `Origin` header, like health checks, still work

Recommended Railway production value:

```env
CORS_ORIGIN=https://your-app.vercel.app,https://your-custom-domain.com
```

If you want Vercel preview deployments to work against Railway, add those preview origins too.

## Local Development

Copy `.env.example` to `.env` and update the database credentials for your local machine.

Recommended local frontend values:

```env
VITE_API_URL=/api
VITE_IMAGE_BASE_URL=http://localhost:5000
```

Vite already proxies `/api` and `/uploads` to the local Express server through `vite.config.js`.

## Verification Checklist

1. Remove `.env` from git tracking with `git rm --cached .env`
2. Push the repo changes to GitHub
3. Redeploy Railway from this repo
4. Open `https://your-backend.up.railway.app/` and confirm it returns `Server is running`
5. Open `https://your-backend.up.railway.app/api/health` and confirm it returns a healthy JSON response
6. Set `VITE_API_URL` and `VITE_IMAGE_BASE_URL` in Vercel
7. Redeploy the Vercel frontend
8. Open the production site and confirm API calls go to Railway, not `localhost`
9. Confirm uploads load from the Railway origin

## Recommended Order

1. Fix the repo by untracking `.env`
2. Push the repo to GitHub
3. Deploy Railway backend and MySQL
4. Run Prisma migrations on Railway
5. Confirm Railway health endpoints work
6. Configure Vercel frontend environment variables
7. Redeploy Vercel
8. Test login and authenticated API calls in production
