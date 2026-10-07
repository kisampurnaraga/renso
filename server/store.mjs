import pg from 'pg';
import { randomUUID } from 'node:crypto';
export function createStore(databaseUrl) {
  const pool = databaseUrl ? new pg.Pool({ connectionString: databaseUrl, max: 3, connectionTimeoutMillis: 5000 }) : null;
  const sessions = new Map();
  const usage = new Map();
  return {
    persistent: !!pool,
    async ready() { if (pool) await pool.query('SELECT token_hash FROM guest_sessions LIMIT 0'); },
    async createSession(hash) {
      const id = randomUUID(); const expires = new Date(Date.now() + 86400_000);
      if (pool) await pool.query('INSERT INTO guest_sessions(id,token_hash,expires_at) VALUES($1,$2,$3)', [id,hash,expires]);
      else sessions.set(hash,{ id, expires });
      return id;
    },
    async findSession(hash) {
      if (pool) return (await pool.query('SELECT id FROM guest_sessions WHERE token_hash=$1 AND expires_at>now()', [hash])).rows[0]?.id;
      const session = sessions.get(hash); return session && session.expires > new Date() ? session.id : undefined;
    },
    async reserve(id, limit) {
      const day = new Date().toISOString().slice(0,10);
      if (pool) return !!(await pool.query('INSERT INTO daily_usage(session_id,day,requests) VALUES($1,$2,1) ON CONFLICT(session_id,day) DO UPDATE SET requests=daily_usage.requests+1 WHERE daily_usage.requests<$3 RETURNING requests', [id,day,limit])).rows.length;
      const key = `${id}:${day}`; const count = usage.get(key) || 0; if(count >= limit) return false; usage.set(key,count+1); return true;
    },
    async refund(id) {
      const day = new Date().toISOString().slice(0,10);
      if(pool) await pool.query('UPDATE daily_usage SET requests=GREATEST(0,requests-1) WHERE session_id=$1 AND day=$2',[id,day]);
      else { const key = `${id}:${day}`; usage.set(key, Math.max(0,(usage.get(key)||0)-1)); }
    },
    async deleteSession(id) {
      if(pool) await pool.query('DELETE FROM guest_sessions WHERE id=$1',[id]);
      else { for(const [hash, session] of sessions) if(session.id === id) sessions.delete(hash); for(const key of usage.keys()) if(key.startsWith(`${id}:`)) usage.delete(key); }
    },
    async cleanup() {
      if(pool) await pool.query('DELETE FROM guest_sessions WHERE expires_at<=now()');
      else { for(const [hash, session] of sessions) if(session.expires <= new Date()) { sessions.delete(hash); for(const key of usage.keys()) if(key.startsWith(`${session.id}:`)) usage.delete(key); } }
    },
    async close() { if(pool) await pool.end(); }
  };
}
