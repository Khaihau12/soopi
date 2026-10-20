const laSoNguyen = (giaTri) => Number.isInteger(giaTri);
const laDuongDanAnhHopLe = (duongDan) => {
  if (typeof duongDan !== 'string' || !duongDan) return false;
  if (/^\/uploads\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(duongDan)) return true;
  try {
    const url = new URL(duongDan);
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch { return false; }
};

module.exports = { laSoNguyen, laDuongDanAnhHopLe };
