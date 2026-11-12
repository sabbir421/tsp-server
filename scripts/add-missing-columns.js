// Adds columns that exist in the Sequelize models but not in the database.
// Only ADDs columns: never drops, renames or changes existing data.
// Dry run by default; pass --apply to make changes.
require('dotenv').config();
const db = require('../src/config/database');
const sequelize = db.sequelize || db;
require('../src/schema');

const apply = process.argv.includes('--apply');

(async () => {
  const qi = sequelize.getQueryInterface();
  const cols = await sequelize.query(
    'SELECT TABLE_NAME t, COLUMN_NAME c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()',
    { type: 'SELECT' }
  );
  const existing = {};
  cols.forEach((r) => (existing[r.t] = existing[r.t] || new Set()).add(r.c));

  let count = 0;
  for (const model of Object.values(sequelize.models)) {
    const name = model.getTableName();
    const table = typeof name === 'string' ? name : name.tableName;
    if (!existing[table]) {
      console.log(`Table ${table} missing - run the server once to create it`);
      continue;
    }
    for (const attr of Object.values(model.rawAttributes)) {
      if (existing[table].has(attr.field)) continue;
      count++;
      console.log(`${apply ? 'Adding' : 'Missing'}: ${table}.${attr.field}`);
      if (apply) {
        const { type, allowNull, defaultValue } = attr;
        // New columns must accept existing rows, so they are nullable unless a default is set
        await qi.addColumn(table, attr.field, {
          type,
          allowNull: defaultValue === undefined ? true : allowNull !== false ? true : false,
          ...(defaultValue !== undefined && typeof defaultValue !== 'object' ? { defaultValue } : {}),
        });
      }
    }
  }
  console.log(`${apply ? 'Added' : 'Would add'} ${count} columns`);
  process.exit(0);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
