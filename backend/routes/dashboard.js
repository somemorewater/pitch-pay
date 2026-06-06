const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// GET /api/admin/dashboard
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Player stats
    const playerStats = await pool.query(`
      SELECT
        COUNT(*) AS total_players,
        COUNT(CASE WHEN pay.status = 'paid' THEN 1 END) AS paid_this_month,
        COUNT(CASE WHEN pay.status = 'unpaid' OR pay.status IS NULL THEN 1 END) AS unpaid_this_month
      FROM players p
      LEFT JOIN payments pay ON pay.player_id = p.id AND pay.month = $1 AND pay.year = $2
      WHERE p.is_active = TRUE
    `, [month, year]);

    // Finance summary
    const finance = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_income,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS total_expenses
      FROM payments
    `);

    const income = parseFloat(finance.rows[0].total_income);
    const expenses = parseFloat(finance.rows[0].total_expenses);

    // This month income
    const monthIncome = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM payments
      WHERE status = 'paid' AND month = $1 AND year = $2
    `, [month, year]);

    // This month expenses
    const monthExpenses = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE EXTRACT(MONTH FROM date) = $1 AND EXTRACT(YEAR FROM date) = $2
    `, [month, year]);

    // Monthly trend (last 6 months)
    const trend = await pool.query(`
      SELECT 
        year, month,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS income,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paid_count,
        COUNT(*) AS total
      FROM payments
      GROUP BY year, month
      ORDER BY year DESC, month DESC
      LIMIT 6
    `);

    // Recent audit logs
    const logs = await pool.query(`
      SELECT al.*, a.username
      FROM audit_logs al
      LEFT JOIN admins a ON a.id = al.admin_id
      ORDER BY al.timestamp DESC
      LIMIT 10
    `);

    // Top payers (most consistent)
    const topPayers = await pool.query(`
      SELECT 
        p.full_name, p.jersey_number, p.position, p.profile_photo,
        COUNT(pay.id) FILTER (WHERE pay.status = 'paid') AS paid_count,
        COUNT(pay.id) AS total_count
      FROM players p
      LEFT JOIN payments pay ON pay.player_id = p.id
      WHERE p.is_active = TRUE
      GROUP BY p.id
      ORDER BY paid_count DESC
      LIMIT 5
    `);

    const stats = playerStats.rows[0];
    const paymentRate = stats.total_players > 0
      ? Math.round((stats.paid_this_month / stats.total_players) * 100)
      : 0;

    res.json({
      players: { ...stats, payment_rate: paymentRate },
      finance: {
        total_income: income,
        total_expenses: expenses,
        balance: income - expenses,
        month_income: parseFloat(monthIncome.rows[0].total),
        month_expenses: parseFloat(monthExpenses.rows[0].total),
      },
      trend: trend.rows.reverse(),
      recentActivity: logs.rows,
      topPayers: topPayers.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/audit-logs
router.get('/audit-logs', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT al.*, a.username
      FROM audit_logs al
      LEFT JOIN admins a ON a.id = al.admin_id
      ORDER BY al.timestamp DESC
      LIMIT 50
    `);
    res.json({ logs: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
