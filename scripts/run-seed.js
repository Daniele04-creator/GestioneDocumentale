require('dotenv/config');

const fs = require('fs');
const path = require('path');
const pg = require('pg');

const { Pool } = pg;

const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');
const seedSql = fs.readFileSync(seedPath, 'utf8');

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'documentale',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool
  .query(seedSql)
  .then(() => {
    console.log('Database seed applied.');
  })
  .catch((error) => {
    console.error('Failed to apply database seed.');
    console.error(error.stack || error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
