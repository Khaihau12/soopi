const laSoNguyen = (giaTri) => Number.isInteger(giaTri);
const laDuongDanAnhHopLe = (duongDan) => {
  if (typeof duongDan !== 'string' || !duongDan) return false;
  try {
    const url = new URL(duongDan);
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com'
      && url.pathname.startsWith(`/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`)
      && !url.username && !url.password;
  } catch { return false; }
};

module.exports = { laSoNguyen, laDuongDanAnhHopLe };
