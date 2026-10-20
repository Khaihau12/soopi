require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const TaiKhoan = require('../src/models/taiKhoan.model');
const { VAI_TRO } = require('../src/constants/vaiTro.constant');
const { DO_DAI_MAT_KHAU_TOI_THIEU, SO_VONG_BAM_MAT_KHAU } = require('../src/constants/cauHinh.constant');

const taoTaiKhoanMau = async (email, matKhau, hoTen, vaiTro) => {
  const taiKhoanCu = await TaiKhoan.findOne({ email }).select('vaiTro');
  if (taiKhoanCu) {
    if (!taiKhoanCu.vaiTro.includes(vaiTro)) throw new Error(`Email ${email} đã thuộc tài khoản có vai trò khác.`);
    console.log(`Đã có tài khoản mẫu: ${email}`);
    return;
  }
  const matKhauBam = await bcrypt.hash(matKhau, SO_VONG_BAM_MAT_KHAU);
  try {
    await TaiKhoan.create({ email, matKhau: matKhauBam, hoTen, vaiTro: [vaiTro] });
    console.log(`Đã tạo tài khoản mẫu: ${email}`);
  } catch (loi) {
    if (loi.code === 11000) throw new Error(`Email ${email} đã tồn tại. Vui lòng kiểm tra tài khoản trước khi chạy lại.`);
    throw loi;
  }
};

const main = async () => {
  if (process.env.NODE_ENV === 'production') throw new Error('Chỉ được tạo tài khoản mẫu trong môi trường local.');
  const cauHinh = [
    { email: process.env.DEMO_ADMIN_EMAIL, matKhau: process.env.DEMO_ADMIN_PASSWORD, hoTen: 'Quản trị viên mẫu', vaiTro: VAI_TRO.QUAN_TRI_VIEN },
    { email: process.env.DEMO_USER_EMAIL, matKhau: process.env.DEMO_USER_PASSWORD, hoTen: 'Người dùng mẫu', vaiTro: VAI_TRO.NGUOI_DUNG },
  ];
  if (!process.env.MONGODB_URI || cauHinh.some(({ email, matKhau }) => !email?.trim() || !matKhau || matKhau.length < DO_DAI_MAT_KHAU_TOI_THIEU)) {
    throw new Error('Cần MONGODB_URI và email/mật khẩu (ít nhất 8 ký tự) cho DEMO_ADMIN, DEMO_USER trong backend/.env.');
  }
  const [admin, user] = cauHinh.map((item) => ({ ...item, email: item.email.trim().toLowerCase() }));
  if (admin.email === user.email) throw new Error('Email mẫu Admin và Người dùng phải khác nhau.');
  await mongoose.connect(process.env.MONGODB_URI);
  await taoTaiKhoanMau(admin.email, admin.matKhau, admin.hoTen, admin.vaiTro);
  await taoTaiKhoanMau(user.email, user.matKhau, user.hoTen, user.vaiTro);
};

main().catch((loi) => { console.error('Không thể tạo tài khoản mẫu:', loi.message); process.exitCode = 1; })
  .finally(async () => { if (mongoose.connection.readyState !== 0) await mongoose.disconnect(); });
