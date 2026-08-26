'use strict';
/* PESU — database
   SQLite through better-sqlite3: synchronous, transactional, and a single
   file we own. `DATABASE_PATH` points at a persistent disk in production. */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const file = process.env.DATABASE_PATH || path.join(__dirname, '..', 'var', 'pesu.db');
fs.mkdirSync(path.dirname(file), { recursive: true });

const db = new Database(file);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function migrate() {
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
}

module.exports = { db, migrate, file };
