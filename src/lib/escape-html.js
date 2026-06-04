/**
 * Utilidad para escapar HTML y prevenir inyección XSS en correos electrónicos.
 * Debe usarse en TODA cadena de texto proporcionada por el usuario
 * antes de interpolarla en plantillas HTML.
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
