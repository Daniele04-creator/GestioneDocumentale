'use strict';

const path = require('path');
const dotenv = require('dotenv');
const pg = require('pg');
const { PROJECT_ROOT } = require('./paths');

dotenv.config({
  path: path.join(PROJECT_ROOT, '.env'),
});

const pool = new pg.Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'documentale',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

function query(text, params) {
  return pool.query(text, params);
}

async function close() {
  await pool.end();
}

module.exports = {
  query,
  close,
};
