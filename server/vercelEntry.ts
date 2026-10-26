import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApiApp } from './apiApp';

const app = createApiApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  return app(req as any, res as any);
}
