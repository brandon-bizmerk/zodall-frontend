export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

const RECAPTCHA_TIMEOUT_MS = 8000;
const POLL_INTERVAL_MS = 100;

/**
 * Genera un token reCAPTCHA v3 nuevo al momento de la acción (válido 2 min y de un solo uso:
 * nunca se cachea). Devuelve undefined si no hay clave de sitio, si el script no cargó o si
 * execute falla; la API decide entonces si exige el captcha.
 */
export async function getRecaptchaToken(action: 'login' | 'register'): Promise<string | undefined> {
  if (!RECAPTCHA_SITE_KEY || typeof window === 'undefined') return undefined;

  const deadline = Date.now() + RECAPTCHA_TIMEOUT_MS;
  while (!window.grecaptcha && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  const grecaptcha = window.grecaptcha;
  if (!grecaptcha) return undefined;

  const remaining = Math.max(deadline - Date.now(), 1000);
  const execution = new Promise<string | undefined>((resolve) => {
    grecaptcha.ready(() => {
      grecaptcha.execute(RECAPTCHA_SITE_KEY, { action }).then(resolve, () => resolve(undefined));
    });
  });
  const timeout = new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), remaining));
  return Promise.race([execution, timeout]);
}
