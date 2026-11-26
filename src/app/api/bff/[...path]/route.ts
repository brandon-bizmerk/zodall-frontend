import { handleProxy } from '@/lib/bff';

const handler = (request: Request) => handleProxy(request, { fetch, env: process.env });

export const GET = handler;
export const POST = handler;
export const PUT = handler;
