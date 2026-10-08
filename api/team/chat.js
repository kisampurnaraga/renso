// Explicit nested route: standalone Vercel filesystem dynamic routes do not
// inherit Next.js catch-all semantics. Keep the original URL for Fastify.
export { default } from '../[...path].js';
