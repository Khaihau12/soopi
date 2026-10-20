export function layMauToken(tenToken) {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(tenToken).trim();
}
