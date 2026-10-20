const { Server } = require('socket.io');
const CuaHang = require('../models/cuaHang.model');
const TaiKhoan = require('../models/taiKhoan.model');
const { layTaiKhoanTuToken } = require('../middlewares/auth.middleware');
const { TEN_COOKIE_TOKEN } = require('../constants/cauHinh.constant');
const { TRANG_THAI_TAI_KHOAN } = require('../constants/trangThai.constant');

let io;
const phongTaiKhoan = (taiKhoan) => `tai-khoan:${taiKhoan._id}:${taiKhoan.phienBanToken || 0}`;

const khoiTaoSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true },
    allowRequest: (req, done) => done(null, !req.headers.origin || req.headers.origin === process.env.FRONTEND_URL),
  });
  io.use(async (socket, next) => {
    try {
      const cookies = require('cookie').parseCookie(socket.request.headers.cookie || '');
      const taiKhoan = await layTaiKhoanTuToken(cookies[TEN_COOKIE_TOKEN]);
      socket.data.taiKhoan = { _id: taiKhoan._id, phienBanToken: taiKhoan.phienBanToken || 0 };
      next();
    } catch { next(new Error('Vui lòng đăng nhập để tiếp tục')); }
  });
  io.on('connection', (socket) => socket.join(phongTaiKhoan(socket.data.taiKhoan)));
  return io;
};

const phatTinNhanMoi = async (cuocTroChuyen, tinNhan) => {
  if (!io) return;
  try {
    const cuaHang = await CuaHang.findById(cuocTroChuyen.cuaHangId).select('taiKhoanId').lean();
    if (!cuaHang) return;
    const taiKhoan = await TaiKhoan.find({ _id: { $in: [cuocTroChuyen.taiKhoanId, cuaHang.taiKhoanId] },
      trangThaiTaiKhoan: { $ne: TRANG_THAI_TAI_KHOAN.BI_KHOA } }).select('_id phienBanToken').lean();
    for (const item of taiKhoan) io.to(phongTaiKhoan(item)).emit('tin-nhan-moi', tinNhan);
  } catch (loi) { console.error('Không thể phát thông báo tin nhắn mới:', loi); }
};

module.exports = { khoiTaoSocket, phatTinNhanMoi };
