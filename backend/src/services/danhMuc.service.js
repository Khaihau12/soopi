const mongoose = require('mongoose');
const DanhMuc = require('../models/danhMuc.model');
const SanPham = require('../models/sanPham.model');
const { DO_DAI_TOI_DA } = require('../constants/cauHinh.constant');
const { taoLoi } = require('../utils/taoLoi');

const COLLATION_VI = { locale: 'vi', strength: 2 };

const kiemTraTenDanhMuc = (tenDanhMuc) => {
  if (typeof tenDanhMuc !== 'string' || !tenDanhMuc.trim()) throw taoLoi(400, 'Vui lòng nhập tên danh mục.');
  const tenChuan = tenDanhMuc.trim();
  if (tenChuan.length > DO_DAI_TOI_DA.TEN_DANH_MUC) {
    throw taoLoi(400, `Tên danh mục không được quá ${DO_DAI_TOI_DA.TEN_DANH_MUC} ký tự.`);
  }
  return tenChuan;
};

const kiemTraId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID danh mục không hợp lệ.');
};

const kiemTraTenTrung = async (tenDanhMuc, idBoQua) => {
  const dieuKien = { tenDanhMuc };
  if (idBoQua) dieuKien._id = { $ne: idBoQua };
  if (await DanhMuc.exists(dieuKien).collation(COLLATION_VI)) throw taoLoi(409, 'Danh mục này đã tồn tại.');
};

const layDanhSachDanhMuc = () => DanhMuc.find({}, '_id tenDanhMuc').collation(COLLATION_VI).sort({ tenDanhMuc: 1 }).lean();

const quanTriLayDanhSachDanhMuc = async () => {
  const [danhSach, soLuongTheoDanhMuc] = await Promise.all([
    layDanhSachDanhMuc(),
    SanPham.aggregate([
      // Gom một lần để không truy vấn riêng cho từng danh mục.
      { $group: { _id: '$danhMucId', soSanPham: { $sum: 1 } } },
    ]),
  ]);
  const soLuong = new Map(soLuongTheoDanhMuc.map(({ _id, soSanPham }) => [_id?.toString(), soSanPham]));
  return danhSach.map((danhMuc) => ({ ...danhMuc, soSanPham: soLuong.get(danhMuc._id.toString()) || 0 }));
};

const quanTriTaoDanhMuc = async (body = {}) => {
  const tenChuan = kiemTraTenDanhMuc(body?.tenDanhMuc);
  await kiemTraTenTrung(tenChuan);
  return DanhMuc.create({ tenDanhMuc: tenChuan });
};

const quanTriSuaDanhMuc = async (id, body = {}) => {
  kiemTraId(id);
  const tenChuan = kiemTraTenDanhMuc(body?.tenDanhMuc);
  const hienTai = await DanhMuc.findById(id);
  if (!hienTai) throw taoLoi(404, 'Không tìm thấy danh mục.');
  await kiemTraTenTrung(tenChuan, hienTai._id);
  hienTai.tenDanhMuc = tenChuan;
  await hienTai.save();
  return hienTai;
};

const quanTriXoaDanhMuc = async (id) => {
  kiemTraId(id);
  const danhMuc = await DanhMuc.findById(id);
  if (!danhMuc) throw taoLoi(404, 'Không tìm thấy danh mục.');
  const soSanPham = await SanPham.countDocuments({ danhMucId: danhMuc._id });
  if (soSanPham > 0) {
    throw taoLoi(409, `Danh mục đang có ${soSanPham} sản phẩm nên không thể xóa. Hãy chuyển các sản phẩm sang danh mục khác trước.`);
  }
  await danhMuc.deleteOne();
};

module.exports = { layDanhSachDanhMuc, quanTriLayDanhSachDanhMuc, quanTriTaoDanhMuc, quanTriSuaDanhMuc, quanTriXoaDanhMuc };
