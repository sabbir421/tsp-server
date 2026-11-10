// Removes duplicate unique indexes (email_2, phone_3, ...) left by sequelize.sync({ alter: true }).
// Keeps the original index on each column. Dry run by default; pass --apply to drop.
require('dotenv').config();
const db = require('../src/config/database');
const sequelize = db.sequelize || db;
const apply = process.argv.includes('--apply');

(async () => {
  const rows = await sequelize.query(
    `SELECT TABLE_NAME t, INDEX_NAME i, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) cols, MAX(NON_UNIQUE) nu
       FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
      GROUP BY TABLE_NAME, INDEX_NAME`,
    { type: 'SELECT' }
  );
  const byKey = new Map();
  rows.forEach((r) => byKey.set(`${r.t}.${r.i}`, r));
  let count = 0;
  for (const r of rows) {
    const m = /^(.+)_(\d+)$/.exec(r.i);
    if (!m) continue;
    const base = byKey.get(`${r.t}.${m[1]}`);
    // Only drop when an identical original index exists on the same columns
    if (!base || base.cols !== r.cols || base.nu !== r.nu) continue;
    count++;
    if (apply) await sequelize.query(`ALTER TABLE \`${r.t}\` DROP INDEX \`${r.i}\``);
  }
  console.log(`${apply ? 'Dropped' : 'Would drop'} ${count} duplicate indexes`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
