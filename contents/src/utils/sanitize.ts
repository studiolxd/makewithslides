import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML con DOMPurify antes de usarlo en dangerouslySetInnerHTML.
 * Permite únicamente etiquetas de contenido seguras: p, ul, ol, li, strong, em, b, i, br, a.
 */
export function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'br', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    FORCE_BODY: false,
  });
}

/**
 * Valida que una URL sea segura para usar en src= o background-image.
 * Solo permite rutas relativas (./ o /) y URLs absolutas con protocolo https.
 */
export function isSafeUrl(url: string | undefined): url is string {
  if (!url) return false;
  return /^(\.\/|\/(?!\/)|https:\/\/)/.test(url);
}
