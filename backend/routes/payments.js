const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');
const auditLog = require('../middleware/audit');

// POST /api/admin/payments/mark-paid
router.post('/mark-paid', auth, async (req, res) => {
  const { player_id, month, year, amount } = req.body;
  const dues = amount || parseFloat(process.env.MONTHLY_DUES) || 5000;

  if (!player_id || !month || !year) {
    return res.status(400).json({ error: 'player_id, month, and year required' });
  }

  try {
    // Check player exists
    const playerCheck = await pool.query('SELECT id, full_name FROM players WHERE id = $1 AND is_active = TRUE', [player_id]);
    if (playerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const result = await pool.query(`
      INSERT INTO payments (player_id, month, year, amount, status, paid_at)
      VALUES ($1, $2, $3, $4, 'paid', NOW())
      ON CONFLICT (player_id, month, year)
      DO UPDATE SET status = 'paid', amount = $4, paid_at = NOW()
      RETURNING *
    `, [player_id, month, year, dues]);

    await auditLog(req.admin.id, 'PAYMENT_MARKED', {
      player_id, player_name: playerCheck.rows[0].full_name, month, year, amount: dues
    });

    res.json({ payment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/payments/mark-unpaid
router.post('/mark-unpaid', auth, async (req, res) => {
  const { player_id, month, year } = req.body;

  try {
    const result = await pool.query(`
      UPDATE payments SET status = 'unpaid', paid_at = NULL
      WHERE player_id = $1 AND month = $2 AND year = $3
      RETURNING *
    `, [player_id, month, year]);

    await auditLog(req.admin.id, 'PAYMENT_UNMARKED', { player_id, month, year });
    res.json({ payment: result.rows[0] || null, message: 'Marked unpaid' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/payments
router.get('/', auth, async (req, res) => {
  const { month, year } = req.query;
  const now = new Date();
  const m = month || now.getMonth() + 1;
  const y = year || now.getFullYear();

  try {
    const result = await pool.query(`
      SELECT 
        p.id AS player_id, p.full_name, p.jersey_number, p.position, p.profile_photo,
        COALESCE(pay.status, 'unpaid') AS status,
        pay.amount, pay.paid_at, pay.id AS payment_id
      FROM players p
      LEFT JOIN payments pay ON pay.player_id = p.id AND pay.month = $1 AND pay.year = $2
      WHERE p.is_active = TRUE
      ORDER BY p.jersey_number
    `, [m, y]);

    const summary = {
      total: result.rows.length,
      paid: result.rows.filter(r => r.status === 'paid').length,
      unpaid: result.rows.filter(r => r.status === 'unpaid').length,
      total_collected: result.rows.reduce((sum, r) => sum + (r.status === 'paid' ? parseFloat(r.amount || 0) : 0), 0),
    };

    res.json({ payments: result.rows, summary, month: m, year: y });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/payments/:player_id
router.get('/:player_id', auth, async (req, res) => {
  const { player_id } = req.params;
  try {
    const result = await pool.query(`
      SELECT * FROM payments WHERE player_id = $1 ORDER BY year DESC, month DESC
    `, [player_id]);

    res.json({ payments: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
