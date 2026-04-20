# StayNear Deployment

This repo is set up for:

- Vercel: frontend deployment for the Vite React app
- Railway: backend deployment for the Express API

## Architecture

- Vercel serves the compiled frontend from `dist`
- Railway runs `src/server/server.js`
- The frontend talks to Railway through `VITE_API_URL`
- Uploaded files and profile metadata can live on a Railway volume through `DATA_DIR=/data`

## Railway Setup

1. Create a Railway project and add your MySQL database service.
2. Add a service from this repo for the backend.
3. Attach a Railway volume and mount it at `/data`.
4. Set these Railway variables:

```env
NODE_ENV=production
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=replace_with_a_long_random_secret
DATA_DIR=/data
```

5. Set this optional variable if you want to restrict browser access to your frontend domains:

```env
CORS_ORIGIN=https://your-app.vercel.app
```

6. In the Railway service, run migrations before the first production start:

```bash
npm run prisma:migrate:deploy
```

7. Expose the backend with a Railway public domain and copy that URL.

Notes:

- `railway.json` already sets the start command to `npm run start`
- `railway.json` also sets a root health check on `/`
- Uploads and metadata will persist when the volume is mounted at `/data`

## Vercel Setup

1. Import this repo into Vercel as a frontend project.
2. Vercel will use the root `vercel.json` file and build the Vite app into `dist`.
3. Set these Vercel environment variables:

```env
VITE_API_URL=https://your-backend.up.railway.app/api
VITE_IMAGE_BASE_URL=https://your-backend.up.railway.app
```

4. Deploy the frontend.

Notes:

- `vercel.json` includes the SPA rewrite needed for React Router deep links
- If `VITE_IMAGE_BASE_URL` is omitted, the frontend will automatically use the origin from `VITE_API_URL`

## Recommended Order

1. Deploy the Railway backend and database first
2. Run `npm run prisma:migrate:deploy`
3. Confirm the Railway root URL returns `Server is running`
4. Add the Railway API URL to Vercel env vars
5. Deploy Vercel

## Local Development

Copy `.env.example` to `.env` and update the values for your local MySQL setup.
