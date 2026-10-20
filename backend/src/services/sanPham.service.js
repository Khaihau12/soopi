const mongoose = require('mongoose');
const SanPham = require('../models/sanPham.model');
const CuaHang = require('../models/cuaHang.model');
const TaiKhoan = require('../models/taiKhoan.model');
const DanhMuc = require('../models/danhMuc.model');
const ChiTietDonHang = require('../models/chiTietDonHang.model');
const DanhGia = require('../models/danhGia.model');
const ChiTietKhuyenMai = require('../models/chiTietKhuyenMai.model');
const ChiTietGioHang = require('../models/chiTietGioHang.model');
const KhuyenMai = require('../models/khuyenMai.model');
const { TRANG_THAI_KINH_DOANH, TRANG_THAI_HOAT_DONG_CUA_HANG, TRANG_THAI_KHUYEN_MAI } = require('../constants/trangThai.constant');
const { PHAN_TRANG, DO_DAI_TOI_DA, ANH } = require('../constants/cauHinh.constant');
const { laDuongDanAnhHopLe } = require('../utils/kiemTra');
const { taoLoi } = require('../utils/taoLoi');
const { thoatKyTuRegex } = require('../utils/thoatKyTuRegex');
const { gomGiaBanThucTe } = require('./giaSanPham.service');
const { tinhThongKeDanhGia } = require('./danhGia.service');
const { donAnhCu } = require('./anhCloudinary.service');

const thongTinCuaHang = (cuaHang, chiTiet = false) => cuaHang && ({
  _id: cuaHang._id,
  tenCuaHang: cuaHang.tenCuaHang,
  ...(chiTiet ? { moTa: cuaHang.moTa, diaChi: cuaHang.diaChi, taiKhoanId: cuaHang.taiKhoanId } : {}),
});

const layCuaHangHoatDong = async () => {
  const ids = await CuaHang.find({ trangThaiHoatDong: TRANG_THAI_HOAT_DONG_CUA_HANG.HOAT_DONG }).distinct('_id');
  // Bỏ qua ID chuỗi từ bộ dữ liệu mẫu cũ; schema hiện tại dùng ObjectId.
  return ids.filter((id) => mongoose.isValidObjectId(id));
};

const docSoPhanTrang = (giaTri, macDinh, toiDa) => {
  const so = Number(giaTri);
  if (!Number.isSafeInteger(so) || so < 1) return macDinh;
  return Math.min(so, toiDa);
};

const layDanhSachSanPham = async ({ tuKhoa, danhMucId, khuyenMaiId, trang, gioiHan } = {}) => {
  if (danhMucId && !mongoose.isValidObjectId(danhMucId)) throw taoLoi(400, 'ID danh mục không hợp lệ.');
  if (khuyenMaiId && !mongoose.isValidObjectId(khuyenMaiId)) throw taoLoi(400, 'ID khuyến mãi không hợp lệ.');
  if (tuKhoa !== undefined && typeof tuKhoa !== 'string') throw taoLoi(400, 'Từ khóa tìm kiếm không hợp lệ.');
  const tuKhoaChuan = tuKhoa?.trim() || '';
  if (tuKhoaChuan.length > 100) throw taoLoi(400, 'Từ khóa tìm kiếm không được quá 100 ký tự.');
  const trangChuan = docSoPhanTrang(trang, 1, Number.MAX_SAFE_INTEGER);
  const gioiHanChuan = docSoPhanTrang(gioiHan, PHAN_TRANG.MAC_DINH, PHAN_TRANG.TOI_DA);
  const phanTrangRong = { danhSach: [], phanTrang: { trang: trangChuan, gioiHan: gioiHanChuan, tongSo: 0, tongTrang: 0 } };
  let sanPhamKhuyenMaiIds;
  if (khuyenMaiId) {
    const bayGio = new Date();
    const chuongTrinh = await KhuyenMai.findOne({ _id: khuyenMaiId, ngayBatDau: { $lte: bayGio }, ngayKetThuc: { $gte: bayGio }, trangThai: { $ne: TRANG_THAI_KHUYEN_MAI.DA_KET_THUC } });
    if (!chuongTrinh) return phanTrangRong;
    sanPhamKhuyenMaiIds = await ChiTietKhuyenMai.find({ khuyenMaiId }).distinct('sanPhamId');
    if (!sanPhamKhuyenMaiIds.length) return phanTrangRong;
  }
  const cuaHangIds = await layCuaHangHoatDong();
  const dieuKien = {
    trangThaiKinhDoanh: TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH,
    cuaHangId: { $in: cuaHangIds },
    ...(sanPhamKhuyenMaiIds ? { _id: { $in: sanPhamKhuyenMaiIds } } : {}),
    ...(danhMucId ? { danhMucId } : {}),
  };
  let timTheoText = false;
  let tongSo;
  if (tuKhoaChuan) {
    const dieuKienText = { ...dieuKien, $text: { $search: tuKhoaChuan } };
    tongSo = await SanPham.countDocuments(dieuKienText);
    if (tongSo > 0) {
      Object.assign(dieuKien, { $text: { $search: tuKhoaChuan } });
      timTheoText = true;
    } else {
      dieuKien.tenSanPham = { $regex: thoatKyTuRegex(tuKhoaChuan), $options: 'i' };
    }
  }
  if (!timTheoText) tongSo = await SanPham.countDocuments(dieuKien);
  const danhSach = await SanPham.find(dieuKien, timTheoText
    ? { tenSanPham: 1, hinhAnh: 1, giaGoc: 1, soLuongTon: 1, cuaHangId: 1, danhMucId: 1, diemLienQuan: { $meta: 'textScore' } }
    : '_id tenSanPham hinhAnh giaGoc soLuongTon cuaHangId danhMucId')
    .sort(timTheoText ? { diemLienQuan: { $meta: 'textScore' }, _id: -1 } : { _id: -1 })
    .skip((trangChuan - 1) * gioiHanChuan).limit(gioiHanChuan)
    .populate({ path: 'cuaHangId', select: '_id tenCuaHang' }).lean();
  const coGia = await gomGiaBanThucTe(danhSach);
  return {
    danhSach: coGia.map(({ diemLienQuan, khuyenMaiDangApDung, cuaHangId, ...sanPham }) => ({
      ...sanPham,
      cuaHang: thongTinCuaHang(cuaHangId),
    })),
    phanTrang: { trang: trangChuan, gioiHan: gioiHanChuan, tongSo, tongTrang: Math.ceil(tongSo / gioiHanChuan) },
  };
};

const layChiTietSanPham = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID sản phẩm không hợp lệ.');
  const cuaHangIds = await layCuaHangHoatDong();
  const sanPham = await SanPham.findOne({
    _id: id,
    trangThaiKinhDoanh: TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH,
    cuaHangId: { $in: cuaHangIds },
  }, '_id tenSanPham hinhAnh moTa giaGoc soLuongTon cuaHangId danhMucId')
    .populate({ path: 'cuaHangId', select: '_id tenCuaHang moTa diaChi taiKhoanId' }).lean();
  if (!sanPham) throw taoLoi(404, 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.');
  const [coGia] = await gomGiaBanThucTe([sanPham]);
  const danhMuc = await DanhMuc.findById(sanPham.danhMucId, '_id tenDanhMuc').lean();
  const { cuaHangId, ...duLieu } = coGia;
  const { diemTrungBinh, soDanhGia } = await tinhThongKeDanhGia(id);
  return { ...duLieu, danhMuc, cuaHang: thongTinCuaHang(cuaHangId, true),
    thongKeDanhGia: { diemTrungBinh, soDanhGia } };
};

const laySanPhamCuaCuaHang = async (cuaHangId, id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(404, 'Không tìm thấy sản phẩm');
  const sanPham = await SanPham.findOne({ _id: id, cuaHangId });
  if (!sanPham) throw taoLoi(404, 'Không tìm thấy sản phẩm');
  return sanPham;
};

const kiemTraChuoi = (giaTri, ten, toiDa, batBuoc = false) => {
  if (typeof giaTri !== 'string') throw taoLoi(400, `${ten} không hợp lệ`);
  const chuoi = giaTri.trim();
  if (batBuoc && !chuoi) throw taoLoi(400, `Vui lòng nhập ${ten}`);
  if (chuoi.length > toiDa) throw taoLoi(400, `${ten} không được quá ${toiDa} ký tự`);
  return chuoi;
};

const kiemTraGiaGoc = (giaTri) => {
  if (typeof giaTri !== 'number' || !Number.isInteger(giaTri) || giaTri < 1) {
    throw taoLoi(400, 'Giá gốc phải là số nguyên từ 1 đồng trở lên');
  }
  return giaTri;
};

const kiemTraSoLuongTon = (giaTri) => {
  if (typeof giaTri !== 'number' || !Number.isInteger(giaTri) || giaTri < 0) throw taoLoi(400, 'Số lượng tồn kho không hợp lệ');
  return giaTri;
};

const kiemTraDanhMuc = async (id) => {
  if (!mongoose.isValidObjectId(id) || !await DanhMuc.exists({ _id: id })) throw taoLoi(400, 'Danh mục không hợp lệ');
  return id;
};

const kiemTraHinhAnh = (danhSach) => {
  if (!Array.isArray(danhSach) || danhSach.length > ANH.TOI_DA_MOI_SAN_PHAM || !danhSach.every(laDuongDanAnhHopLe)) {
    throw taoLoi(400, `Hình ảnh không hợp lệ; tối đa ${ANH.TOI_DA_MOI_SAN_PHAM} ảnh JPG, PNG hoặc WEBP`);
  }
  return danhSach;
};

const kiemTraTrangThai = (giaTri) => {
  if (!Object.values(TRANG_THAI_KINH_DOANH).includes(giaTri)) throw taoLoi(400, 'Trạng thái kinh doanh không hợp lệ');
  return giaTri;
};

const dinhDangSanPhamNguoiBan = async (danhSach, chiTiet = false) => {
  const coGia = await gomGiaBanThucTe(danhSach);
  return coGia.map((sanPham) => {
    const { danhMucId, cuaHangId, khuyenMaiDangApDung, ...duLieu } = sanPham;
    return {
      ...duLieu,
      danhMuc: danhMucId && typeof danhMucId === 'object' && danhMucId.tenDanhMuc
        ? { _id: danhMucId._id, tenDanhMuc: danhMucId.tenDanhMuc } : null,
      ...(chiTiet ? { danhMucId: danhMucId?._id || danhMucId, khuyenMaiDangApDung } : {}),
    };
  });
};

const nguoiBanLayDanhSachSanPham = async (cuaHangId, { tuKhoa, trangThaiKinhDoanh, danhMucId, trang, gioiHan } = {}) => {
  if (tuKhoa !== undefined && typeof tuKhoa !== 'string') throw taoLoi(400, 'Từ khóa không hợp lệ');
  const tuKhoaChuan = tuKhoa?.trim() || '';
  if (tuKhoaChuan.length > 100) throw taoLoi(400, 'Từ khóa không được quá 100 ký tự');
  if (trangThaiKinhDoanh) kiemTraTrangThai(trangThaiKinhDoanh);
  if (danhMucId && !mongoose.isValidObjectId(danhMucId)) throw taoLoi(400, 'Danh mục không hợp lệ');
  const trangChuan = docSoPhanTrang(trang, 1, Number.MAX_SAFE_INTEGER);
  const gioiHanChuan = docSoPhanTrang(gioiHan, PHAN_TRANG.MAC_DINH, PHAN_TRANG.TOI_DA);
  const dieuKien = { cuaHangId, ...(trangThaiKinhDoanh ? { trangThaiKinhDoanh } : {}), ...(danhMucId ? { danhMucId } : {}) };
  if (tuKhoaChuan) dieuKien.tenSanPham = { $regex: thoatKyTuRegex(tuKhoaChuan), $options: 'i' };
  const tongSo = await SanPham.countDocuments(dieuKien);
  const danhSach = await SanPham.find(dieuKien).sort({ _id: -1 })
    .skip((trangChuan - 1) * gioiHanChuan).limit(gioiHanChuan)
    .populate({ path: 'danhMucId', select: '_id tenDanhMuc' }).lean();
  return { danhSach: await dinhDangSanPhamNguoiBan(danhSach), phanTrang: { trang: trangChuan, gioiHan: gioiHanChuan, tongSo, tongTrang: Math.ceil(tongSo / gioiHanChuan) } };
};

const nguoiBanLayChiTietSanPham = async (cuaHangId, id) => {
  const sanPham = await laySanPhamCuaCuaHang(cuaHangId, id);
  await sanPham.populate({ path: 'danhMucId', select: '_id tenDanhMuc' });
  return (await dinhDangSanPhamNguoiBan([sanPham], true))[0];
};

const nguoiBanTaoSanPham = async (cuaHangId, body = {}) => {
  const duLieu = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const tenSanPham = kiemTraChuoi(duLieu.tenSanPham, 'tên sản phẩm', DO_DAI_TOI_DA.TEN_SAN_PHAM, true);
  const giaGoc = kiemTraGiaGoc(duLieu.giaGoc);
  const soLuongTon = kiemTraSoLuongTon(duLieu.soLuongTon);
  const danhMucId = await kiemTraDanhMuc(duLieu.danhMucId);
  const hinhAnh = kiemTraHinhAnh(duLieu.hinhAnh || []);
  const moTa = duLieu.moTa === undefined ? '' : kiemTraChuoi(duLieu.moTa, 'mô tả', DO_DAI_TOI_DA.MO_TA);
  const trangThaiKinhDoanh = duLieu.trangThaiKinhDoanh === undefined
    ? TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH : kiemTraTrangThai(duLieu.trangThaiKinhDoanh);
  const sanPham = await SanPham.create({ tenSanPham, giaGoc, soLuongTon, danhMucId, hinhAnh, moTa, trangThaiKinhDoanh, cuaHangId });
  return nguoiBanLayChiTietSanPham(cuaHangId, sanPham._id);
};

const nguoiBanCapNhatSanPham = async (cuaHangId, id, body = {}) => {
  const sanPhamCu = await laySanPhamCuaCuaHang(cuaHangId, id);
  const duLieu = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const capNhat = {};
  if (Object.hasOwn(duLieu, 'tenSanPham')) capNhat.tenSanPham = kiemTraChuoi(duLieu.tenSanPham, 'tên sản phẩm', DO_DAI_TOI_DA.TEN_SAN_PHAM, true);
  if (Object.hasOwn(duLieu, 'moTa')) capNhat.moTa = kiemTraChuoi(duLieu.moTa, 'mô tả', DO_DAI_TOI_DA.MO_TA);
  if (Object.hasOwn(duLieu, 'giaGoc')) capNhat.giaGoc = kiemTraGiaGoc(duLieu.giaGoc);
  if (Object.hasOwn(duLieu, 'danhMucId')) capNhat.danhMucId = await kiemTraDanhMuc(duLieu.danhMucId);
  if (Object.hasOwn(duLieu, 'hinhAnh')) capNhat.hinhAnh = kiemTraHinhAnh(duLieu.hinhAnh);
  if (Object.hasOwn(duLieu, 'trangThaiKinhDoanh')) capNhat.trangThaiKinhDoanh = kiemTraTrangThai(duLieu.trangThaiKinhDoanh);
  if (!Object.keys(capNhat).length) throw taoLoi(400, 'Vui lòng chọn thông tin sản phẩm cần cập nhật');
  await SanPham.updateOne({ _id: id, cuaHangId }, { $set: capNhat }, { runValidators: true });
  if (capNhat.hinhAnh) await donAnhCu(sanPhamCu.hinhAnh, capNhat.hinhAnh);
  return nguoiBanLayChiTietSanPham(cuaHangId, id);
};

const nguoiBanCapNhatTonKho = async (cuaHangId, id, soLuongTon) => {
  const soLuongMoi = kiemTraSoLuongTon(soLuongTon);
  for (let lan = 0; lan < 2; lan++) {
    const sanPham = await laySanPhamCuaCuaHang(cuaHangId, id);
    const ketQua = await SanPham.updateOne(
      { _id: id, cuaHangId, soLuongTon: sanPham.soLuongTon },
      { $set: { soLuongTon: soLuongMoi } },
    );
    if (ketQua.matchedCount === 1) return nguoiBanLayChiTietSanPham(cuaHangId, id);
  }
  throw taoLoi(409, 'Tồn kho vừa thay đổi, vui lòng tải lại và thử lại');
};

const nguoiBanXoaSanPham = async (cuaHangId, id) => {
  const sanPham = await laySanPhamCuaCuaHang(cuaHangId, id);
  const thamChieu = await Promise.all([
    ChiTietDonHang.exists({ sanPhamId: id }), DanhGia.exists({ sanPhamId: id }),
    ChiTietKhuyenMai.exists({ sanPhamId: id }), ChiTietGioHang.exists({ sanPhamId: id }),
  ]);
  if (thamChieu.some(Boolean)) {
    await SanPham.updateOne({ _id: id, cuaHangId }, { $set: { trangThaiKinhDoanh: TRANG_THAI_KINH_DOANH.NGUNG_KINH_DOANH } });
    return 'Sản phẩm đã phát sinh dữ liệu nên được chuyển sang Ngừng kinh doanh';
  }
  await SanPham.deleteOne({ _id: id, cuaHangId });
  await donAnhCu(sanPham.hinhAnh);
  return 'Đã xóa sản phẩm';
};

const dinhDangSanPhamQuanTri = async (danhSach, chiTiet = false) => {
  const coGia = await gomGiaBanThucTe(danhSach);
  const taiKhoanIds = [...new Set(coGia.map((item) => String(item.cuaHangId?.taiKhoanId || '')).filter(Boolean))];
  const chuCuaHang = taiKhoanIds.length ? await TaiKhoan.find({ _id: { $in: taiKhoanIds } }, '_id hoTen').lean() : [];
  const chuTheoId = new Map(chuCuaHang.map((item) => [String(item._id), { hoTen: item.hoTen }]));
  return coGia.map(({ cuaHangId, danhMucId, khuyenMaiDangApDung, khuyenMaiApDung, moTa, ...item }) => ({
    ...item,
    danhMuc: danhMucId ? { _id: danhMucId._id, tenDanhMuc: danhMucId.tenDanhMuc } : null,
    cuaHang: cuaHangId ? { _id: cuaHangId._id, tenCuaHang: cuaHangId.tenCuaHang, trangThaiHoatDong: cuaHangId.trangThaiHoatDong } : null,
    chuCuaHang: cuaHangId ? chuTheoId.get(String(cuaHangId.taiKhoanId)) || null : null,
    ...(chiTiet ? { moTa } : {}),
  }));
};

const quanTriLayDanhSachSanPham = async ({ tuKhoa, danhMucId, cuaHangId, trangThaiKinhDoanh, trang, gioiHan } = {}) => {
  if (tuKhoa !== undefined && (typeof tuKhoa !== 'string' || tuKhoa.length > 100)) throw taoLoi(400, 'Từ khóa sản phẩm không hợp lệ.');
  if (danhMucId && !mongoose.isValidObjectId(danhMucId)) throw taoLoi(400, 'ID danh mục không hợp lệ.');
  if (cuaHangId && !mongoose.isValidObjectId(cuaHangId)) throw taoLoi(400, 'ID cửa hàng không hợp lệ.');
  if (trangThaiKinhDoanh) kiemTraTrangThai(trangThaiKinhDoanh);
  const trangChuan = Number(trang ?? 1);
  const gioiHanChuan = Number(gioiHan ?? PHAN_TRANG.MAC_DINH);
  if (!Number.isSafeInteger(trangChuan) || trangChuan < 1 || !Number.isSafeInteger(gioiHanChuan) || gioiHanChuan < 1) throw taoLoi(400, 'Trang và giới hạn phải là số nguyên dương.');
  const gioiHanThucTe = Math.min(gioiHanChuan, PHAN_TRANG.TOI_DA);
  const dieuKien = {
    ...(tuKhoa?.trim() ? { tenSanPham: { $regex: thoatKyTuRegex(tuKhoa.trim()), $options: 'i' } } : {}),
    ...(danhMucId ? { danhMucId } : {}), ...(cuaHangId ? { cuaHangId } : {}),
    ...(trangThaiKinhDoanh ? { trangThaiKinhDoanh } : {}),
  };
  const [tongSo, danhSach] = await Promise.all([
    SanPham.countDocuments(dieuKien),
    SanPham.find(dieuKien, '_id tenSanPham hinhAnh giaGoc soLuongTon trangThaiKinhDoanh danhMucId cuaHangId')
      .sort({ _id: -1 }).skip((trangChuan - 1) * gioiHanThucTe).limit(gioiHanThucTe)
      .populate('danhMucId', '_id tenDanhMuc').populate('cuaHangId', '_id tenCuaHang trangThaiHoatDong taiKhoanId').lean(),
  ]);
  return { danhSach: await dinhDangSanPhamQuanTri(danhSach),
    phanTrang: { trang: trangChuan, gioiHan: gioiHanThucTe, tongSo, tongTrang: Math.ceil(tongSo / gioiHanThucTe) } };
};

const quanTriLayChiTietSanPham = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID sản phẩm không hợp lệ.');
  const sanPham = await SanPham.findById(id, '_id tenSanPham hinhAnh moTa giaGoc soLuongTon trangThaiKinhDoanh danhMucId cuaHangId')
    .populate('danhMucId', '_id tenDanhMuc').populate('cuaHangId', '_id tenCuaHang trangThaiHoatDong taiKhoanId').lean();
  if (!sanPham) throw taoLoi(404, 'Không tìm thấy sản phẩm.');
  return (await dinhDangSanPhamQuanTri([sanPham], true))[0];
};

const quanTriCapNhatTrangThaiSanPham = async (id, trangThaiKinhDoanh) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID sản phẩm không hợp lệ.');
  kiemTraTrangThai(trangThaiKinhDoanh);
  const sanPham = await SanPham.findOneAndUpdate({ _id: id, trangThaiKinhDoanh: { $ne: trangThaiKinhDoanh } },
    { $set: { trangThaiKinhDoanh } }, { returnDocument: 'after', runValidators: true });
  if (!sanPham) {
    if (!await SanPham.exists({ _id: id })) throw taoLoi(404, 'Không tìm thấy sản phẩm.');
    throw taoLoi(409, 'Sản phẩm đã ở trạng thái này.');
  }
  return quanTriLayChiTietSanPham(id);
};

module.exports = {
  layDanhSachSanPham, layChiTietSanPham,
  nguoiBanLayDanhSachSanPham, nguoiBanLayChiTietSanPham, nguoiBanTaoSanPham,
  nguoiBanCapNhatSanPham, nguoiBanCapNhatTonKho, nguoiBanXoaSanPham,
  quanTriLayDanhSachSanPham, quanTriLayChiTietSanPham, quanTriCapNhatTrangThaiSanPham,
};
