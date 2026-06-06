const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// GET /api/public/players
router.get('/players', async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const result = await pool.query(`
      SELECT 
        p.id, p.full_name, p.jersey_number, p.position, p.profile_photo,
        COALESCE(pay.status, 'unpaid') AS payment_status
      FROM players p
      LEFT JOIN payments pay 
        ON pay.player_id = p.id AND pay.month = $1 AND pay.year = $2
      WHERE p.is_active = TRUE
      ORDER BY p.jersey_number ASC
    `, [month, year]);

    res.json({ players: result.rows, month, year });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public/finance
router.get('/finance', async (req, res) => {
  try {
    const totalIncome = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'paid'`
    );
    const totalExpenses = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses`
    );

    const income = parseFloat(totalIncome.rows[0].total);
    const expenses = parseFloat(totalExpenses.rows[0].total);
    const balance = income - expenses;

    // Monthly breakdown (last 6 months)
    const monthly = await pool.query(`
      SELECT 
        year, month,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS income,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_count,
        COUNT(*) AS total_count
      FROM payments
      GROUP BY year, month
      ORDER BY year DESC, month DESC
      LIMIT 6
    `);

    const monthlyExpenses = await pool.query(`
      SELECT 
        EXTRACT(YEAR FROM date) AS year,
        EXTRACT(MONTH FROM date) AS month,
        SUM(amount) AS total
      FROM expenses
      GROUP BY year, month
      ORDER BY year DESC, month DESC
      LIMIT 6
    `);

    res.json({
      summary: { income, expenses, balance },
      monthly: monthly.rows,
      monthlyExpenses: monthlyExpenses.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public/payments-summary
router.get('/payments-summary', async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const result = await pool.query(`
      SELECT 
        COUNT(*) AS total_players,
        COUNT(CASE WHEN pay.status = 'paid' THEN 1 END) AS paid_count,
        COUNT(CASE WHEN pay.status = 'unpaid' OR pay.status IS NULL THEN 1 END) AS unpaid_count,
        COALESCE(SUM(CASE WHEN pay.status = 'paid' THEN pay.amount ELSE 0 END), 0) AS month_income
      FROM players p
      LEFT JOIN payments pay ON pay.player_id = p.id AND pay.month = $1 AND pay.year = $2
      WHERE p.is_active = TRUE
    `, [month, year]);

    const row = result.rows[0];
    const paymentRate = row.total_players > 0
      ? Math.round((row.paid_count / row.total_players) * 100)
      : 0;

    res.json({ ...row, payment_rate: paymentRate, month, year });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public/month/:month/:year
router.get('/month/:month/:year', async (req, res) => {
  const { month, year } = req.params;
  try {
    const payments = await pool.query(`
      SELECT 
        p.full_name, p.jersey_number, p.position, p.profile_photo,
        COALESCE(pay.status, 'unpaid') AS status,
        pay.amount, pay.paid_at
      FROM players p
      LEFT JOIN payments pay 
        ON pay.player_id = p.id AND pay.month = $1 AND pay.year = $2
      WHERE p.is_active = TRUE
      ORDER BY p.jersey_number
    `, [month, year]);

    const expenses = await pool.query(`
      SELECT title, amount, date 
      FROM expenses 
      WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
      ORDER BY date
    `, [month, year]);

    res.json({ payments: payments.rows, expenses: expenses.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
