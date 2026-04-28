/**
 * Validación de variables de entorno requeridas.
 *
 * Importar este módulo lo más temprano posible (e.g. en layout)
 * para fallar rápido si faltan credenciales.
 */

const requiredEnvVars = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", hint: "Supabase → Settings → API → Project URL" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", hint: "Supabase → Settings → API → Project API Keys → anon" },
];

// Con Supabase JS no necesitamos DATABASE_URL en el cliente ni en el server, 
// solo las URLs y Keys de la API.
const missing = requiredEnvVars.filter(({ key }) => !process.env[key]);

if (missing.length > 0) {
  const details = missing
    .map(({ key, hint }) => `  • ${key}  →  ${hint}`)
    .join("\n");

  throw new Error(
    `\n\n🔒 Faltan variables de entorno requeridas para Supabase:\n\n${details}\n\n` +
    `Copia .env.example como .env.local y completa los valores.\n`
  );
}

if (
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("[TU-PROYECTO]") ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("[TU-ANON-KEY]")
) {
  throw new Error(
    `\n\n🔒 Tus variables de Supabase todavía contienen placeholders.\n` +
    `Reemplázalos con tus credenciales reales.\n`
  );
}

export const env = Object.freeze({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
