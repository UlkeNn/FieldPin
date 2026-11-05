# FieldPin

FieldPin is a field-service management system. Technicians create work orders (new installs,
replacements, fault repairs) for customers in the field, attach objects with photos and GPS location.
Admins manage customers, technicians and service requests, and follow the work on a map.

| Folder | What | Stack |
|---|---|---|
| `api/` | REST API | ASP.NET Core 7, EF Core, SQLite, JWT |
| `web/` | Admin panel | React 19, TypeScript, Vite, MUI, react-query |
| `mobile/` | Technician app | Expo, React Native, TypeScript |
| `docs/` | API reference | Markdown |

## Run locally

### 1. API

```bash
cd api
cp .env.example .env   # then fill in your own values
dotnet run
```

The API listens on `http://localhost:5290`. Swagger is at `/swagger` in Development.
The database (`App_Data/app.db`) is created and seeded on first start:

| Username | Role | Password |
|---|---|---|
| `admin` | Admin | `ADMIN_DEFAULT_PASSWORD` from `.env` (required) |
| `tech-001` | Technician | `TECH_DEFAULT_PASSWORD` from `.env` |

Users are only created when they do not exist yet. To start over, delete `App_Data/app.db*`.

To reach the API from a phone on the same network, run it with `dotnet run --urls "http://0.0.0.0:5290"`.

### 2. Admin web

```bash
cd web
npm install
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:5290
npm run dev
```

Open `http://localhost:5173`. The API must allow this origin in `ALLOWED_CORS_ORIGINS`.

### 3. Mobile

See `mobile/README.md`.

## Docs

- `docs/api/service-requests.md` — service request (talep) API reference

## License

MIT, see `LICENSE`.
