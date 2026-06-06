const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');
const auditLog = require('../middleware/audit');

// POST /api/admin/expenses
router.post('/', auth, async (req, res) => {
  const { title, description, amount, date } = req.body;
  if (!title || !amount || !date) {
    return res.status(400).json({ error: 'title, amount, and date are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO expenses (title, description, amount, date, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description || null, amount, date, req.admin.id]
    );

    const expense = result.rows[0];
    await auditLog(req.admin.id, 'EXPENSE_ADDED', { expense_id: expense.id, title, amount });

    res.status(201).json({ expense });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/expenses
router.get('/', auth, async (req, res) => {
  const { month, year } = req.query;

  try {
    let query = `
      SELECT e.*, a.username AS added_by
      FROM expenses e
      LEFT JOIN admins a ON a.id = e.created_by
    `;
    const params = [];

    if (month && year) {
      query += ' WHERE EXTRACT(MONTH FROM e.date) = $1 AND EXTRACT(YEAR FROM e.date) = $2';
      params.push(month, year);
    }

    query += ' ORDER BY e.date DESC';

    const result = await pool.query(query, params);
    const total = result.rows.reduce((sum, r) => sum + parseFloat(r.amount), 0);

    res.json({ expenses: result.rows, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/expenses/:id
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING id, title', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    await auditLog(req.admin.id, 'EXPENSE_DELETED', { expense_id: id });
    res.json({ message: 'Expense deleted', expense: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
