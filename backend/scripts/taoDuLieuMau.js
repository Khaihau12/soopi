require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const TaiKhoan = require('../src/models/taiKhoan.model');
const CuaHang = require('../src/models/cuaHang.model');
const DanhMuc = require('../src/models/danhMuc.model');
const SanPham = require('../src/models/sanPham.model');
const KhuyenMai = require('../src/models/khuyenMai.model');
const ChiTietKhuyenMai = require('../src/models/chiTietKhuyenMai.model');
const Voucher = require('../src/models/voucher.model');
const { VAI_TRO } = require('../src/constants/vaiTro.constant');
const {
  LOAI_KHUYEN_MAI, PHAM_VI_KHUYEN_MAI, TRANG_THAI_KHUYEN_MAI,
  LOAI_VOUCHER, KIEU_GIAM,
} = require('../src/constants/trangThai.constant');
const { DO_DAI_MAT_KHAU_TOI_THIEU, SO_VONG_BAM_MAT_KHAU } = require('../src/constants/cauHinh.constant');

const NGUOI_MUA = { email: 'nguoi-mua-f29@soopi.test', hoTen: 'Người mua mẫu F29' };
const NGUOI_BAN = [
  { email: 'nguoi-ban-f29-a@soopi.test', hoTen: 'Người bán A', tenCuaHang: 'Soopi Thời trang A', diaChi: 'Hà Nội' },
  { email: 'nguoi-ban-f29-b@soopi.test', hoTen: 'Người bán B', tenCuaHang: 'Soopi Gia dụng B', diaChi: 'Đà Nẵng' },
  { email: 'nguoi-ban-f29-c@soopi.test', hoTen: 'Người bán C', tenCuaHang: 'Soopi Phụ kiện C', diaChi: 'TP. Hồ Chí Minh' },
];
const TEN_DANH_MUC = ['Thời trang', 'Gia dụng', 'Phụ kiện'];
const SAN_PHAM = [
  ['Áo thun cotton', 129000, 20, 0, 0],
  ['Áo sơ mi trắng', 199000, 14, 0, 0],
  ['Quần jean xanh', 299000, 12, 0, 0],
  ['Áo khoác nhẹ', 349000, 8, 0, 0],
  ['Bình nước giữ nhiệt', 159000, 18, 1, 1],
  ['Đèn bàn học', 249000, 10, 1, 1],
  ['Hộp đựng thực phẩm', 89000, 25, 1, 1],
  ['Túi vải đi chợ', 59000, 30, 2, 2],
  ['Sổ tay bìa cứng', 79000, 22, 2, 2],
  ['Ốp điện thoại', 99000, 16, 2, 2],
];

async function timHoacTao(Model, dieuKien, duLieu) {
  const daCo = await Model.findOne(dieuKien);
  return daCo || Model.create(duLieu);
}

async function taoTaiKhoan(email, hoTen, vaiTro, matKhauBam) {
  const daCo = await TaiKhoan.findOne({ email });
  if (daCo) {
    if (!vaiTro.every((vaiTroCan) => daCo.vaiTro.includes(vaiTroCan))) {
      throw new Error(`Tài khoản ${email} đã tồn tại nhưng không có đúng vai trò mẫu.`);
    }
    return daCo;
  }
  return TaiKhoan.create({ email, hoTen, matKhau: matKhauBam, vaiTro });
}

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Không tạo dữ liệu mẫu trong production.');
  if (!process.env.MONGODB_URI || !process.env.DEMO_PASSWORD || process.env.DEMO_PASSWORD.length < DO_DAI_MAT_KHAU_TOI_THIEU) {
    throw new Error('Cần MONGODB_URI và DEMO_PASSWORD (ít nhất 8 ký tự) trong backend/.env.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const matKhauBam = await bcrypt.hash(process.env.DEMO_PASSWORD, SO_VONG_BAM_MAT_KHAU);
  await taoTaiKhoan(NGUOI_MUA.email, NGUOI_MUA.hoTen, [VAI_TRO.NGUOI_DUNG], matKhauBam);
  const taiKhoanBan = [];
  for (const nguoiBan of NGUOI_BAN) {
    taiKhoanBan.push(await taoTaiKhoan(nguoiBan.email, nguoiBan.hoTen, [VAI_TRO.NGUOI_DUNG, VAI_TRO.NGUOI_BAN], matKhauBam));
  }

  const cuaHang = [];
  for (let i = 0; i < NGUOI_BAN.length; i += 1) {
    const nguoiBan = NGUOI_BAN[i];
    cuaHang.push(await timHoacTao(CuaHang, { taiKhoanId: taiKhoanBan[i]._id }, {
      taiKhoanId: taiKhoanBan[i]._id, tenCuaHang: nguoiBan.tenCuaHang, diaChi: nguoiBan.diaChi,
    }));
  }

  const danhMuc = [];
  for (const tenDanhMuc of TEN_DANH_MUC) {
    danhMuc.push(await timHoacTao(DanhMuc, { tenDanhMuc }, { tenDanhMuc }));
  }

  const sanPham = [];
  for (const [tenSanPham, giaGoc, soLuongTon, chiSoCuaHang, chiSoDanhMuc] of SAN_PHAM) {
    sanPham.push(await timHoacTao(SanPham, { tenSanPham, cuaHangId: cuaHang[chiSoCuaHang]._id }, {
      tenSanPham, giaGoc, soLuongTon, cuaHangId: cuaHang[chiSoCuaHang]._id,
      danhMucId: danhMuc[chiSoDanhMuc]._id, hinhAnh: [],
      moTa: `Sản phẩm mẫu ${tenSanPham.toLowerCase()} để thử luồng mua hàng Soopi.`,
    }));
  }

  const hienTai = Date.now();
  const ngayBatDau = new Date(hienTai - 24 * 60 * 60 * 1000);
  const ngayKetThuc = new Date(hienTai + 30 * 24 * 60 * 60 * 1000);
  const chuongTrinh = [
    { tenKhuyenMai: 'Giảm giá thời trang F29', loaiKhuyenMai: LOAI_KHUYEN_MAI.GIAM_GIA, phamVi: PHAM_VI_KHUYEN_MAI.CUA_HANG, cuaHangId: cuaHang[0]._id, sanPhamId: sanPham[0]._id, tyLeGiam: 10 },
    { tenKhuyenMai: 'Flash Sale gia dụng F29', loaiKhuyenMai: LOAI_KHUYEN_MAI.FLASH_SALE, phamVi: PHAM_VI_KHUYEN_MAI.CUA_HANG, cuaHangId: cuaHang[1]._id, sanPhamId: sanPham[4]._id, tyLeGiam: 20 },
  ];
  for (const item of chuongTrinh) {
    const khuyenMai = await timHoacTao(KhuyenMai, { tenKhuyenMai: item.tenKhuyenMai, cuaHangId: item.cuaHangId }, {
      tenKhuyenMai: item.tenKhuyenMai, loaiKhuyenMai: item.loaiKhuyenMai,
      phamVi: item.phamVi, cuaHangId: item.cuaHangId,
      ngayBatDau, ngayKetThuc, trangThai: TRANG_THAI_KHUYEN_MAI.DANG_HOAT_DONG,
    });
    await timHoacTao(ChiTietKhuyenMai, { khuyenMaiId: khuyenMai._id, sanPhamId: item.sanPhamId }, {
      khuyenMaiId: khuyenMai._id, sanPhamId: item.sanPhamId, tyLeGiam: item.tyLeGiam,
    });
  }

  const voucher = [
    { maVoucher: 'F29FREESHIP', tenVoucher: 'Freeship mẫu F29', loaiVoucher: LOAI_VOUCHER.FREESHIP, kieuGiam: KIEU_GIAM.SO_TIEN_CO_DINH, giaTriGiam: 30000, giamToiDa: 30000, giaTriDonToiThieu: 100000, soLuong: 50 },
    { maVoucher: 'F29TOANSAN', tenVoucher: 'Toàn sàn mẫu F29', loaiVoucher: LOAI_VOUCHER.TOAN_SAN, kieuGiam: KIEU_GIAM.PHAN_TRAM, giaTriGiam: 10, giamToiDa: 50000, giaTriDonToiThieu: 200000, soLuong: 50 },
    { maVoucher: 'F29SHOPA', tenVoucher: 'Cửa hàng A mẫu F29', loaiVoucher: LOAI_VOUCHER.CUA_HANG, kieuGiam: KIEU_GIAM.SO_TIEN_CO_DINH, giaTriGiam: 20000, giamToiDa: 20000, giaTriDonToiThieu: 150000, soLuong: 30, cuaHangId: cuaHang[0]._id },
    { maVoucher: 'F29SHOPB', tenVoucher: 'Cửa hàng B mẫu F29', loaiVoucher: LOAI_VOUCHER.CUA_HANG, kieuGiam: KIEU_GIAM.SO_TIEN_CO_DINH, giaTriGiam: 15000, giamToiDa: 15000, giaTriDonToiThieu: 100000, soLuong: 30, cuaHangId: cuaHang[1]._id },
  ];
  for (const item of voucher) {
    await timHoacTao(Voucher, { maVoucher: item.maVoucher }, { ...item, ngayBatDau, ngayKetThuc });
  }
  console.info('Dữ liệu mẫu đã sẵn sàng: 1 Người mua, 3 Người bán, 3 cửa hàng, 3 danh mục, 10 sản phẩm, 2 khuyến mãi và 4 voucher.');
}

main().catch((loi) => { console.error('Không thể tạo dữ liệu mẫu:', loi.message); process.exitCode = 1; })
  .finally(async () => { if (mongoose.connection.readyState !== 0) await mongoose.disconnect(); });
