'use strict';
/* PESU — database
   PostgreSQL through a pooled connection. `DATABASE_URL` points at the
   database; on Vercel that is the Postgres integration's connection string.

   Serverless invocations are short-lived and can start cold at any moment, so
   schema and seed are applied lazily behind a Postgres advisory lock: whoever
   gets there first does the work, everyone else waits and finds it done. */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

/* Hosted Postgres integrations each pick their own variable name — Neon on
   Vercel sets DATABASE_URL, older Vercel Postgres sets POSTGRES_URL, and some
   set only the unpooled variant. Accept any of them rather than making the
   deploy depend on which one turned up. */
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  throw new Error(
    'No Postgres connection string found. Set DATABASE_URL (or POSTGRES_URL) — ' +
    'see .env.example.'
  );
}

/* Hosted Postgres (Neon, Vercel, Supabase) requires TLS; a local server does
   not offer it. Opt out only for localhost. */
const isLocal = /@(localhost|127\.0\.0\.1)/.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  /* Serverless: keep the pool small and let idle clients go. */
  max: Number(process.env.PG_POOL_MAX || (process.env.VERCEL ? 1 : 5)),
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (err) => console.error('[pg] idle client error', err.message));

function query(text, params) {
  return pool.query(text, params);
}

async function one(text, params) {
  const res = await pool.query(text, params);
  return res.rows[0] || null;
}

async function all(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

/* Run fn inside a transaction on a dedicated client. */
async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) { /* connection already gone */ }
    throw err;
  } finally {
    client.release();
  }
}

let readyPromise = null;

async function ensureReady() {
  if (!readyPromise) readyPromise = initialise();
  return readyPromise;
}

async function initialise() {
  /* pg_advisory_xact_lock, not pg_advisory_lock: hosted Postgres sits behind
     a transaction-mode pooler, where a session-scoped lock can be left on a
     backend that the next statement never sees. A transaction-scoped lock is
     released by COMMIT, whichever backend served it. */
  await transaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(841125)');
    await client.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

    const seeded = await client.query('SELECT COUNT(*)::int AS c FROM products');
    if (seeded.rows[0].c === 0) {
      const { seedWith } = require('./seed');
      await seedWith(client);
      console.log('[db] seeded from data/products.json');
    }

    const { ensureAdmin } = require('./seed');
    await ensureAdmin(client);
  });
}

module.exports = { pool, query, one, all, transaction, ensureReady };
