const { pool } = require('../db');

const auditLog = async (adminId, action, metadata = {}) => {
  try {
    await pool.query(
      'INSERT INTO audit_logs (action, admin_id, metadata) VALUES ($1, $2, $3)',
      [action, adminId, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = auditLog;
