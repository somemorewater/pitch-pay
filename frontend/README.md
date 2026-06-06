Frontend environment
--------------------


This frontend uses Vite. Environment variables for Vite must be prefixed with `VITE_`.

Setup:

1. Copy the example env into a local `.env` file (do not commit your `.env`):

```bash
cd frontend
cp .env.example .env
# edit .env as needed (set VITE_API_URL)
```

2. Install and start the dev server:

```bash
pnpm install # or npm install
pnpm dev     # or npm run dev
```

Usage:

- `VITE_API_URL` — base URL for API requests (e.g. `http://localhost:5000/api`). The frontend's API client falls back to `/api` when this is not set.
