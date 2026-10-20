const { TEN_COOKIE_TOKEN, SO_NGAY_HET_HAN_TOKEN } = require('../constants/cauHinh.constant');

const tuyChonCookie = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
});

const datCookieDangNhap = (res, token) => {
  res.cookie(TEN_COOKIE_TOKEN, token, {
    ...tuyChonCookie(),
    maxAge: SO_NGAY_HET_HAN_TOKEN * 24 * 60 * 60 * 1000,
  });
};

const xoaCookieDangNhap = (res) => {
  res.clearCookie(TEN_COOKIE_TOKEN, tuyChonCookie());
};

module.exports = { datCookieDangNhap, xoaCookieDangNhap };
