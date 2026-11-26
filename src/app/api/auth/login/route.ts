import { handleAuth } from '@/lib/bff';

export const POST = (request: Request) => handleAuth('login', request, { fetch, env: process.env });
