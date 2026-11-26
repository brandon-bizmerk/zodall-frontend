import { handleAuth } from '@/lib/bff';

export const POST = (request: Request) => handleAuth('register', request, { fetch, env: process.env });
