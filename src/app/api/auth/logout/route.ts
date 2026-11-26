import { handleLogout } from '@/lib/bff';

export const POST = (request: Request) => handleLogout(request, { fetch, env: process.env });
