'use strict';
/* A session store on the same SQLite database.
   The default MemoryStore leaks and empties every customer's bag on restart;
   connect-sqlite3 would add a second native dependency. This is the whole
   store in forty lines, using the connection we already have. */
const { db } = require('../db');

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid        TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);`);

module.exports = function (session) {
  const Store = session.Store;

  class SqliteStore extends Store {
    constructor(options = {}) {
      super(options);
      this.ttl = options.ttl || 60 * 60 * 24 * 30;      /* seconds */
      /* Sweep expired rows hourly; unref so it never holds the process open. */
      const timer = setInterval(() => this.prune(), 60 * 60 * 1000);
      if (timer.unref) timer.unref();
    }

    expiry(sess) {
      const maxAge = sess && sess.cookie && sess.cookie.maxAge;
      return Date.now() + (maxAge ? Number(maxAge) : this.ttl * 1000);
    }

    get(sid, cb) {
      try {
        const row = db.prepare('SELECT data, expires_at FROM sessions WHERE sid = ?').get(sid);
        if (!row) return cb(null, null);
        if (row.expires_at < Date.now()) {
          this.destroy(sid, () => {});
          return cb(null, null);
        }
        cb(null, JSON.parse(row.data));
      } catch (err) { cb(err); }
    }

    set(sid, sess, cb) {
      try {
        db.prepare(`INSERT INTO sessions (sid, data, expires_at) VALUES (?, ?, ?)
                    ON CONFLICT(sid) DO UPDATE SET data = excluded.data,
                    expires_at = excluded.expires_at`)
          .run(sid, JSON.stringify(sess), this.expiry(sess));
        cb(null);
      } catch (err) { cb(err); }
    }

    touch(sid, sess, cb) {
      try {
        db.prepare('UPDATE sessions SET expires_at = ? WHERE sid = ?').run(this.expiry(sess), sid);
        cb(null);
      } catch (err) { cb(err); }
    }

    destroy(sid, cb) {
      try { db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid); cb(null); }
      catch (err) { cb(err); }
    }

    length(cb) {
      try { cb(null, db.prepare('SELECT COUNT(*) c FROM sessions').get().c); }
      catch (err) { cb(err); }
    }

    clear(cb) {
      try { db.prepare('DELETE FROM sessions').run(); cb(null); }
      catch (err) { cb(err); }
    }

    prune() {
      try { db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now()); }
      catch (err) { /* a failed sweep is not worth taking the shop down */ }
    }
  }

  return SqliteStore;
};
