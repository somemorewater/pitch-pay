require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1);

// Routes
app.use('/api/public', require('./routes/public'));
app.use('/api/admin', require('./routes/auth'));
app.use('/api/admin/players', require('./routes/players'));
app.use('/api/admin/payments', require('./routes/payments'));
app.use('/api/admin/expenses', require('./routes/expenses'));
app.use('/api/admin/dashboard', require('./routes/dashboard'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start
const start = async () => {
  await initDB();
  app.listen(PORT, () => {
    console.log(`PitchPay API running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
};

start().catch(console.error);
