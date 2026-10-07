import { buildApp } from './app.mjs';
try { const app = await buildApp(); await app.listen({port:Number(process.env.PORT)||3001,host:process.env.HOST||'127.0.0.1'}); console.log('Renso server ready'); }
catch { console.error('Renso startup failed. Check environment and database migrations.'); process.exit(1); }
