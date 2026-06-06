require('dotenv').config();
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (err) {
  console.warn('bcrypt native load failed, falling back to bcryptjs');
  const bcryptjs = require('bcryptjs');
  bcrypt = {
    hash: (pw, rounds) => Promise.resolve(bcryptjs.hashSync(pw, rounds)),
  };
}
const { pool, initDB } = require('./index');

const seed = async () => {
  await initDB();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Seed admin
    const hash = await bcrypt.hash('admin123', 12);
    await client.query(`
      INSERT INTO admins (username, password_hash) VALUES ($1, $2)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', hash]);

    // Seed players
    const players = [
      ['Emeka Okafor', 1, 'Goalkeeper'],
      ['Chidi Nwosu', 5, 'Defender'],
      ['Tunde Adeleke', 7, 'Midfielder'],
      ['Kemi Balogun', 10, 'Forward'],
      ['Seun Adesanya', 3, 'Defender'],
      ['Femi Okonkwo', 8, 'Midfielder'],
      ['Dayo Lawal', 11, 'Forward'],
      ['Ayo Babatunde', 4, 'Midfielder'],
    ];

    const playerIds = [];
    for (const [name, jersey, position] of players) {
      const res = await client.query(`
        INSERT INTO players (full_name, jersey_number, position)
        VALUES ($1, $2, $3)
        ON CONFLICT (jersey_number) DO UPDATE SET full_name = EXCLUDED.full_name
        RETURNING id
      `, [name, jersey, position]);
      playerIds.push(res.rows[0].id);
    }

    // Seed payments for last 3 months
    const now = new Date();
    for (let m = 0; m < 3; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();

      for (let i = 0; i < playerIds.length; i++) {
        const paid = Math.random() > 0.35;
        await client.query(`
          INSERT INTO payments (player_id, month, year, amount, status, paid_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (player_id, month, year) DO NOTHING
        `, [
          playerIds[i], month, year, 5000,
          paid ? 'paid' : 'unpaid',
          paid ? new Date() : null
        ]);
      }
    }

    // Seed expenses
    const expenses = [
      ['Pitch Rental – June', 'Monthly pitch rental fee', 15000, '2025-06-01'],
      ['New Training Balls (x10)', 'Adidas training balls', 25000, '2025-05-15'],
      ['Jersey Printing', 'Custom jerseys for all players', 40000, '2025-05-01'],
      ['First Aid Kit', 'Medical supplies replenishment', 8500, '2025-04-20'],
      ['Referee Fees – April', 'Referee payment for 4 matches', 12000, '2025-04-05'],
    ];

    const adminRes = await client.query('SELECT id FROM admins LIMIT 1');
    const adminId = adminRes.rows[0]?.id;

    for (const [title, desc, amount, date] of expenses) {
      await client.query(`
        INSERT INTO expenses (title, description, amount, date, created_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [title, desc, amount, date, adminId]);
    }

    await client.query('COMMIT');
    console.log('✅ Seed complete! Admin: admin / admin123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
