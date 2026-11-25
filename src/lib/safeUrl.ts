/**
 * Valida una URL recibida de la API antes de navegar a ella (evita `javascript:`, `data:` y hosts
 * inesperados si la respuesta se manipula). Solo https y host exacto de la lista; si no, null.
 */
export function safeExternalUrl(raw: unknown, allowedHosts: string[]): string | null {
  if (typeof raw !== 'string') return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    return allowedHosts.includes(u.hostname) ? u.toString() : null;
  } catch {
    return null;
  }
}
