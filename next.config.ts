import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp (src/app/api/sets/foto/route.ts, limpieza EXIF/GPS server-side, ADR-005/ADR-010) es un
  // binario nativo. Sin esto, Next.js intenta empaquetarlo con el bundler de la función
  // serverless en vez de resolverlo como dependencia externa en tiempo de ejecución -- un
  // problema conocido al desplegar en Vercel que provoca que la función falle o se quede
  // colgada en producción sin que se reproduzca en local (`next dev` no pasa por este
  // empaquetado). serverExternalPackages le dice a Next.js que lo deje fuera del bundle y lo
  // cargue con require() normal desde node_modules en el servidor.
  serverExternalPackages: ["sharp"],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          }
        ],
      },
    ];
  },
};

export default nextConfig;
