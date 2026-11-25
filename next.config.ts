import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Origen de la API para llamadas directas del navegador (solo x-api-key del playground y verify-proof público).
// Las llamadas autenticadas del dashboard pasan por el BFF (/api/bff) y no lo necesitan.
function apiOrigin(): string {
  try {
    return process.env.NEXT_PUBLIC_BACKEND_URL ? new URL(process.env.NEXT_PUBLIC_BACKEND_URL).origin : "";
  } catch {
    return "";
  }
}

// CSP estática: el shell es estático (cacheComponents), así que no hay nonce por petición y Next necesita
// 'unsafe-inline' para sus scripts de hidratación. reCAPTCHA v3: www.google.com/recaptcha y www.gstatic.com/recaptcha.
// Stripe Checkout es una redirección de página completa (no carga scripts de Stripe en el dashboard).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.gstatic.com https://www.google.com",
  "font-src 'self'",
  `connect-src 'self' ${apiOrigin()} https://www.google.com/recaptcha/${isDev ? " ws://localhost:* ws://127.0.0.1:*" : ""}`.replace(/\s+/g, " ").trim(),
  "frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
