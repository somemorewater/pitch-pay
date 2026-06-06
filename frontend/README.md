Frontend environment
--------------------

This folder is a Create React App; environment variables must be prefixed with `REACT_APP_`.

Setup:

1. Copy the example env into a local `.env` file (do not commit your `.env`):

```bash
cd frontend
cp .env.example .env
# edit .env as needed (set REACT_APP_API_URL)
```

2. Start the dev server:

```bash
npm install
npm start
```

Usage:

- `REACT_APP_API_URL` — base URL for API requests (e.g. `http://localhost:5000/api`). The frontend's API client already falls back to `/api` when this is not set.
