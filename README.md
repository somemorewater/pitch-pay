# ⚽ PitchPay — Football Team Financial Dashboard

A production-ready financial transparency system for football teams.
Track dues, expenses, and player payments with a Stripe-style dark dashboard.

---

## 🚀 Quick Start

### 1. PostgreSQL Setup

Create the database:
```sql
CREATE DATABASE pitchpay;
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET
npm run seed     # Seeds admin + 8 players + sample data
npm run dev      # Starts on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start        # Starts on http://localhost:3000
```

---

## 🔑 Default Credentials

After seeding:
- **Username:** `admin`
- **Password:** `admin123`

Change immediately in production!

---

## 📁 Project Structure

```
pitchpay/
├── backend/
│   ├── db/
│   │   ├── index.js        # DB connection + schema init
│   │   └── seed.js         # Demo data seeder
│   ├── middleware/
│   │   ├── auth.js         # JWT middleware
│   │   └── audit.js        # Audit log helper
│   ├── routes/
│   │   ├── public.js       # Public read-only routes
│   │   ├── auth.js         # Admin register/login
│   │   ├── players.js      # Player CRUD
│   │   ├── payments.js     # Payment management
│   │   ├── expenses.js     # Expense tracking
│   │   └── dashboard.js    # Analytics + audit logs
│   ├── server.js           # Express entry point
│   └── .env.example
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── PublicDashboard.jsx
        │   ├── Squad.jsx
        │   ├── AdminLogin.jsx
        │   └── AdminDashboard.jsx
        ├── components/
        │   └── Avatar.jsx
        ├── lib/
        │   └── api.js
        ├── App.jsx
        └── App.css
```

---

## 🌍 API Reference

### Public (no auth)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/public/players` | All active players + this month's payment status |
| GET | `/api/public/finance` | Income, expenses, balance, 6-month trend |
| GET | `/api/public/payments-summary` | This month's stats |
| GET | `/api/public/month/:month/:year` | Specific month data |

### Admin Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/admin/register` | Register admin |
| POST | `/api/admin/login` | Login → JWT token |

### Players (Bearer token required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/players` | All players |
| POST | `/api/admin/players` | Add player |
| PUT | `/api/admin/players/:id` | Update player |
| DELETE | `/api/admin/players/:id` | Deactivate player |

### Payments
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/payments` | Payments (filter by ?month=&year=) |
| POST | `/api/admin/payments/mark-paid` | Mark player paid |
| POST | `/api/admin/payments/mark-unpaid` | Reverse payment |
| GET | `/api/admin/payments/:player_id` | Player payment history |

### Expenses
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/expenses` | All expenses |
| POST | `/api/admin/expenses` | Add expense |
| DELETE | `/api/admin/expenses/:id` | Delete expense |

### Dashboard
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/dashboard` | Full analytics |
| GET | `/api/admin/dashboard/audit-logs` | Action history |

---

## ⚙️ Environment Variables

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/pitchpay
JWT_SECRET=change_this_to_a_long_random_string
PORT=5000
NODE_ENV=development
MONTHLY_DUES=5000
```

---

## 🔒 Security Features

- bcrypt password hashing (12 rounds)
- JWT tokens (7-day expiry)
- Rate limiting on login (10 req / 15 min)
- Parameterized SQL queries (no injection)
- All admin actions logged to `audit_logs`

---

## 🚢 Deployment Notes

1. Set `NODE_ENV=production` in backend
2. Set `REACT_APP_API_URL=https://your-api-domain.com/api` in frontend build
3. Use a managed Postgres (Railway, Supabase, Neon, etc.)
4. Serve frontend via Vercel / Netlify
5. Backend on Railway / Render / Fly.io

---

## 🔥 Optional Enhancements

- CSV export of payments/expenses
- Monthly email report
- Attendance tracking module
- Player consistency leaderboard (already in analytics)
- Multi-currency support
- Profile photo upload (Cloudinary)
