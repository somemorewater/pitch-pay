const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');
const auditLog = require('../middleware/audit');

// POST /api/admin/players
router.post('/', auth, async (req, res) => {
  const { full_name, jersey_number, position, profile_photo } = req.body;
  if (!full_name || !jersey_number || !position) {
    return res.status(400).json({ error: 'full_name, jersey_number, and position are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO players (full_name, jersey_number, position, profile_photo)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [full_name, jersey_number, position, profile_photo || null]
    );

    const player = result.rows[0];
    await auditLog(req.admin.id, 'PLAYER_CREATED', { player_id: player.id, full_name });

    res.status(201).json({ player });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Jersey number already taken' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/players
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const result = await pool.query(`
      SELECT 
        p.*,
        COALESCE(pay.status, 'unpaid') AS current_payment_status,
        pay.paid_at
      FROM players p
      LEFT JOIN payments pay 
        ON pay.player_id = p.id AND pay.month = $1 AND pay.year = $2
      ORDER BY p.jersey_number
    `, [month, year]);

    res.json({ players: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/players/:id
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { full_name, jersey_number, position, profile_photo, is_active } = req.body;

  try {
    const result = await pool.query(
      `UPDATE players SET 
        full_name = COALESCE($1, full_name),
        jersey_number = COALESCE($2, jersey_number),
        position = COALESCE($3, position),
        profile_photo = COALESCE($4, profile_photo),
        is_active = COALESCE($5, is_active)
       WHERE id = $6 RETURNING *`,
      [full_name, jersey_number, position, profile_photo, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    await auditLog(req.admin.id, 'PLAYER_UPDATED', { player_id: id });
    res.json({ player: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/players/:id
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE players SET is_active = FALSE WHERE id = $1 RETURNING id, full_name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    await auditLog(req.admin.id, 'PLAYER_DEACTIVATED', { player_id: id });
    res.json({ message: 'Player deactivated', player: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
