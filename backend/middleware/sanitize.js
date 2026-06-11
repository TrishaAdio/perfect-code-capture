/**
 * Lightweight, dependency-free request sanitizer.
 *
 * - Recursively strips any object key starting with "$" or containing "."
 *   from req.body / req.query / req.params to prevent NoSQL operator
 *   injection (e.g. { email: { "$gt": "" } }).
 * - Caps string lengths defensively (defence-in-depth; route validators
 *   already enforce strict limits).
 *
 * Does NOT remove HTML — XSS is prevented at render time on the frontend
 * (React escapes by default, and we never use dangerouslySetInnerHTML on
 * untrusted data). Strings are left intact so legitimate "$" or "." in
 * VALUES (e.g. emails, prices) still work.
 */

const MAX_STRING_LEN = 10_000;

function sanitizeValue(value) {
  if (value == null) return value;
  if (typeof value === "string") {
    return value.length > MAX_STRING_LEN ? value.slice(0, MAX_STRING_LEN) : value;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = sanitizeValue(value[i]);
    return value;
  }
  if (typeof value === "object") {
    for (const key of Object.keys(value)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete value[key];
        continue;
      }
      value[key] = sanitizeValue(value[key]);
    }
  }
  return value;
}

module.exports = function sanitize(req, _res, next) {
  try {
    if (req.body && typeof req.body === "object") sanitizeValue(req.body);
    if (req.query && typeof req.query === "object") sanitizeValue(req.query);
    if (req.params && typeof req.params === "object") sanitizeValue(req.params);
  } catch {
    /* never block on sanitizer errors */
  }
  next();
};
