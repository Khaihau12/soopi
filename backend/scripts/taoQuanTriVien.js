require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const TaiKhoan = require('../src/models/taiKhoan.model');
const { VAI_TRO } = require('../src/constants/vaiTro.constant');
const { DO_DAI_MAT_KHAU_TOI_THIEU, SO_VONG_BAM_MAT_KHAU } = require('../src/constants/cauHinh.constant');

const taoQuanTriVien = async () => {
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_HO_TEN } = process.env;
  const email = ADMIN_EMAIL?.trim().toLowerCase();
  const hoTen = ADMIN_HO_TEN?.trim();
  if (!MONGODB_URI || !email || !hoTen || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < DO_DAI_MAT_KHAU_TOI_THIEU) {
    throw new Error('Cần cấu hình MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD (ít nhất 8 ký tự) và ADMIN_HO_TEN trong .env');
  }
  await mongoose.connect(MONGODB_URI);
  if (await TaiKhoan.exists({ email })) {
    console.log('Email quản trị viên đã tồn tại; không tạo thêm tài khoản.');
    return;
  }
  const matKhau = await bcrypt.hash(ADMIN_PASSWORD, SO_VONG_BAM_MAT_KHAU);
  try {
    await TaiKhoan.create({ email, matKhau, hoTen, vaiTro: [VAI_TRO.QUAN_TRI_VIEN] });
    console.log('Đã tạo tài khoản Quản trị viên đầu tiên.');
  } catch (loi) {
    if (loi.code === 11000) {
      console.log('Email quản trị viên đã tồn tại; không tạo thêm tài khoản.');
      return;
    }
    throw loi;
  }
};

taoQuanTriVien()
  .catch((loi) => { console.error('Không thể tạo Quản trị viên:', loi.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
