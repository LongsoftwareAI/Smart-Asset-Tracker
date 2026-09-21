# Smart Asset Tracker

Smart Asset Tracker is a React/Vite frontend served by an Express API. PostgreSQL stores authentication data, including user accounts and refresh-token sessions.

## Run with Docker

Prerequisite: Docker Desktop must be running.

1. Create a Docker-specific environment file without replacing the existing local `.env` file.

   ```powershell
   Copy-Item .env.docker.example .env.docker
   ```

2. Edit `.env.docker` and replace `POSTGRES_PASSWORD` and `JWT_ACCESS_SECRET` with distinct, long, URL-safe values.

3. Build and start the stack.

   ```powershell
   docker compose --env-file .env.docker up --build
   ```

4. Open [http://localhost:3000](http://localhost:3000), select **Tạo tài khoản**, then sign in. New accounts are created as `STAFF`.

The Compose stack starts PostgreSQL, applies `database/schema.sql` through the existing migration script, and then starts the app. PostgreSQL is not exposed to the host; only the app is available on port 3000.

## Operations

```powershell
# Start in the background
docker compose --env-file .env.docker up --build -d

# Check containers and application health
docker compose --env-file .env.docker ps
Invoke-RestMethod http://localhost:3000/api/health

# Stop the stack while keeping PostgreSQL data
docker compose --env-file .env.docker down

# Remove containers and all PostgreSQL data permanently
docker compose --env-file .env.docker down -v
```

## Important data boundary

PostgreSQL currently persists authentication data only. Asset, project, location, transaction, and audit endpoints in `server.ts` still use in-memory seed data, so those changes reset whenever the `app` container restarts. Moving those endpoints to the existing PostgreSQL schema is a separate implementation task.
