import pg from 'pg';
import { readFile } from 'node:fs/promises';
if(!process.env.DATABASE_URL) { console.error('DATABASE_URL is required'); process.exit(1); }
const client = new pg.Client({ connectionString:process.env.DATABASE_URL });
try { await client.connect(); for (const name of ['001_initial.sql','002_agent_jobs.sql','003_team_leadership.sql','004_science_content_roles.sql']) await client.query(await readFile(new URL(`../db/${name}`,import.meta.url),'utf8')); console.log('Database migration complete'); }
catch { console.error('Migration failed. Check connection string and database access.'); process.exitCode=1; }
finally { await client.end(); }
