// functions/[[route]].ts
// Cloudflare Pages Functions adapter forwarding all non-static requests to Hono app
import { handle } from 'hono/cloudflare-pages';
import { app } from '../src/index';

export const onRequest = handle(app);
