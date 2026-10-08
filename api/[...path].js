import { buildApp } from '../server/app.mjs';

let appPromise;
export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  try {
    // Production requires a migrated persistent store; never use instance memory
    // for serverless sessions. Do not disclose startup details to the browser.
    appPromise ??= buildApp().then(async app => { await app.ready(); return app; });
    const app = await appPromise;
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
      const bytes = Buffer.from(chunk);
      size += bytes.length;
      if (size > 4 * 1024 * 1024) {
        response.statusCode = 413;
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({error:'Rekaman atau pesan terlalu besar.'}));
        return;
      }
      chunks.push(bytes);
    }
    const result = await app.inject({
      method: request.method,
      url: request.url,
      headers: request.headers,
      payload: chunks.length ? Buffer.concat(chunks) : undefined,
    });
    response.statusCode = result.statusCode;
    for (const [name, value] of Object.entries(result.headers)) if (value !== undefined) response.setHeader(name, value);
    response.end(result.rawPayload);
  } catch {
    appPromise = undefined;
    response.statusCode = 503;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({error:'Layanan Renso belum siap. Periksa konfigurasi server.'}));
  }
}
