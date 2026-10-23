const mongoose = require('mongoose');
const KhuyenMai = require('../models/khuyenMai.model');
const ChiTietKhuyenMai = require('../models/chiTietKhuyenMai.model');
const SanPham = require('../models/sanPham.model');
const CuaHang = require('../models/cuaHang.model');
const { LOAI_KHUYEN_MAI, PHAM_VI_KHUYEN_MAI, TRANG_THAI_KHUYEN_MAI, TRANG_THAI_HOAT_DONG_CUA_HANG } = require('../constants/trangThai.constant');
const { PHAN_TRANG } = require('../constants/cauHinh.constant');
const { taoLoi } = require('../utils/taoLoi');
const { thoatKyTuRegex } = require('../utils/thoatKyTuRegex');

const tinhTrangThaiKhuyenMai = (khuyenMai, thoiDiem = new Date()) => {
  if (khuyenMai.trangThai === TRANG_THAI_KHUYEN_MAI.DA_KET_THUC) return TRANG_THAI_KHUYEN_MAI.DA_KET_THUC;
  if (thoiDiem < khuyenMai.ngayBatDau) return TRANG_THAI_KHUYEN_MAI.CHUA_BAT_DAU;
  if (thoiDiem > khuyenMai.ngayKetThuc) return TRANG_THAI_KHUYEN_MAI.DA_KET_THUC;
  return TRANG_THAI_KHUYEN_MAI.DANG_HOAT_DONG;
};

const dongBoTrangThaiKhuyenMai = async (thoiDiem = new Date()) => {
  const chuaKetThuc = { trangThai: { $ne: TRANG_THAI_KHUYEN_MAI.DA_KET_THUC } };
  await KhuyenMai.updateMany({ ...chuaKetThuc, ngayKetThuc: { $lt: thoiDiem } }, { $set: { trangThai: TRANG_THAI_KHUYEN_MAI.DA_KET_THUC } });
  await KhuyenMai.updateMany({ ...chuaKetThuc, ngayBatDau: { $gt: thoiDiem } }, { $set: { trangThai: TRANG_THAI_KHUYEN_MAI.CHUA_BAT_DAU } });
  await KhuyenMai.updateMany({ ...chuaKetThuc, ngayBatDau: { $lte: thoiDiem }, ngayKetThuc: { $gte: thoiDiem } }, { $set: { trangThai: TRANG_THAI_KHUYEN_MAI.DANG_HOAT_DONG } });
};

const docPhanTrang = (giaTri, macDinh, toiDa) => {
  const so = Number(giaTri);
  return Number.isSafeInteger(so) && so > 0 ? Math.min(so, toiDa) : macDinh;
};

const kiemTraBoLoc = ({ phamVi, loaiKhuyenMai, trangThai, tuKhoa } = {}) => {
  if (phamVi && !Object.values(PHAM_VI_KHUYEN_MAI).includes(phamVi)) throw taoLoi(400, 'Phạm vi khuyến mãi không hợp lệ');
  if (loaiKhuyenMai && !Object.values(LOAI_KHUYEN_MAI).includes(loaiKhuyenMai)) throw taoLoi(400, 'Loại khuyến mãi không hợp lệ');
  if (trangThai && !Object.values(TRANG_THAI_KHUYEN_MAI).includes(trangThai)) throw taoLoi(400, 'Trạng thái khuyến mãi không hợp lệ');
  if (tuKhoa !== undefined && (typeof tuKhoa !== 'string' || tuKhoa.trim().length > 100)) throw taoLoi(400, 'Từ khóa tối đa 100 ký tự');
};

const dinhDangDanhSach = async (chuongTrinh) => {
  if (!chuongTrinh.length) return [];
  const dem = await ChiTietKhuyenMai.aggregate([
    { $match: { khuyenMaiId: { $in: chuongTrinh.map((item) => item._id) } } },
    { $group: { _id: '$khuyenMaiId', soSanPham: { $sum: 1 } } },
  ]);
  const soTheoId = new Map(dem.map((item) => [String(item._id), item.soSanPham]));
  return chuongTrinh.map((item) => ({
    _id: item._id, tenKhuyenMai: item.tenKhuyenMai, loaiKhuyenMai: item.loaiKhuyenMai,
    phamVi: item.phamVi, ngayBatDau: item.ngayBatDau, ngayKetThuc: item.ngayKetThuc,
    trangThai: tinhTrangThaiKhuyenMai(item),
    cuaHang: item.cuaHangId && item.cuaHangId.tenCuaHang
      ? { _id: item.cuaHangId._id, tenCuaHang: item.cuaHangId.tenCuaHang } : null,
    soSanPham: soTheoId.get(String(item._id)) || 0,
  }));
};

const layDanhSach = async (dieuKien, { trang, gioiHan } = {}, sapXep = { _id: -1 }) => {
  await dongBoTrangThaiKhuyenMai();
  const trangChuan = docPhanTrang(trang, 1, Number.MAX_SAFE_INTEGER);
  const gioiHanChuan = docPhanTrang(gioiHan, PHAN_TRANG.MAC_DINH, PHAN_TRANG.TOI_DA);
  const tongSo = await KhuyenMai.countDocuments(dieuKien);
  const chuongTrinh = await KhuyenMai.find(dieuKien).sort(sapXep)
    .skip((trangChuan - 1) * gioiHanChuan).limit(gioiHanChuan)
    .populate({ path: 'cuaHangId', select: '_id tenCuaHang' }).lean();
  return { danhSach: await dinhDangDanhSach(chuongTrinh), phanTrang: { trang: trangChuan, gioiHan: gioiHanChuan, tongSo, tongTrang: Math.ceil(tongSo / gioiHanChuan) } };
};

const layDanhSachKhuyenMaiDangDienRa = async ({ loaiKhuyenMai } = {}) => {
  kiemTraBoLoc({ loaiKhuyenMai });
  await dongBoTrangThaiKhuyenMai();
  const bayGio = new Date();
  const chuongTrinh = await KhuyenMai.find({
    ngayBatDau: { $lte: bayGio }, ngayKetThuc: { $gte: bayGio },
    trangThai: { $ne: TRANG_THAI_KHUYEN_MAI.DA_KET_THUC },
    ...(loaiKhuyenMai ? { loaiKhuyenMai } : {}),
  }).sort({ ngayKetThuc: 1, _id: 1 }).populate({ path: 'cuaHangId', select: '_id tenCuaHang trangThaiHoatDong' }).lean();
  const hienThi = chuongTrinh.filter((item) =>
    (item.loaiKhuyenMai !== LOAI_KHUYEN_MAI.FLASH_SALE || item.phamVi === PHAM_VI_KHUYEN_MAI.TOAN_SAN)
    && (item.phamVi === PHAM_VI_KHUYEN_MAI.TOAN_SAN
      || item.cuaHangId?.trangThaiHoatDong === TRANG_THAI_HOAT_DONG_CUA_HANG.HOAT_DONG));
  return { danhSach: await dinhDangDanhSach(hienThi) };
};

const locTuKhoa = (tuKhoa) => tuKhoa?.trim() ? { tenKhuyenMai: { $regex: thoatKyTuRegex(tuKhoa.trim()), $options: 'i' } } : {};

const nguoiBanLayDanhSachKhuyenMai = (cuaHangId, query = {}) => {
  kiemTraBoLoc(query);
  return layDanhSach({ cuaHangId, ...(query.trangThai ? { trangThai: query.trangThai } : {}), ...locTuKhoa(query.tuKhoa) }, query);
};

const quanTriLayDanhSachKhuyenMai = (query = {}) => {
  kiemTraBoLoc(query);
  if (query.phamVi && query.phamVi !== PHAM_VI_KHUYEN_MAI.TOAN_SAN) throw taoLoi(400, 'Quản trị viên chỉ xem khuyến mãi Toàn sàn');
  return layDanhSach({
    phamVi: PHAM_VI_KHUYEN_MAI.TOAN_SAN,
    cuaHangId: null,
    ...(query.loaiKhuyenMai ? { loaiKhuyenMai: query.loaiKhuyenMai } : {}),
    ...(query.trangThai ? { trangThai: query.trangThai } : {}),
    ...locTuKhoa(query.tuKhoa),
  }, query);
};

const layKhuyenMai = async (id, dieuKien = {}) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(404, 'Không tìm thấy chương trình khuyến mãi');
  const khuyenMai = await KhuyenMai.findOne({ _id: id, ...dieuKien }).populate({ path: 'cuaHangId', select: '_id tenCuaHang' }).lean();
  if (!khuyenMai) throw taoLoi(404, 'Không tìm thấy chương trình khuyến mãi');
  return khuyenMai;
};

const layChiTiet = async (id, dieuKien) => {
  await dongBoTrangThaiKhuyenMai();
  const khuyenMai = await layKhuyenMai(id, dieuKien);
  const cacDong = await ChiTietKhuyenMai.find({ khuyenMaiId: id })
    .populate({ path: 'sanPhamId', select: '_id tenSanPham hinhAnh giaGoc' }).lean();
  return {
    ...(await dinhDangDanhSach([khuyenMai]))[0],
    chiTiet: cacDong.map((dong) => {
      const sanPham = dong.sanPhamId;
      return {
        _id: dong._id,
        sanPham: sanPham ? { _id: sanPham._id, tenSanPham: sanPham.tenSanPham, hinhAnh: sanPham.hinhAnh, giaGoc: sanPham.giaGoc } : null,
        tyLeGiam: dong.tyLeGiam ?? null, giaKhuyenMai: dong.giaKhuyenMai ?? null,
        giaSauKhuyenMai: sanPham ? Math.min(sanPham.giaGoc, dong.giaKhuyenMai ?? Math.round(sanPham.giaGoc * (100 - dong.tyLeGiam) / 100)) : null,
      };
    }),
  };
};

const nguoiBanLayChiTietKhuyenMai = (cuaHangId, id) => layChiTiet(id, { cuaHangId });
const boLocKhuyenMaiToanSan = { phamVi: PHAM_VI_KHUYEN_MAI.TOAN_SAN, cuaHangId: null };
const quanTriLayChiTietKhuyenMai = (id) => layChiTiet(id, boLocKhuyenMaiToanSan);

const kiemTraDuLieuKhuyenMai = async (body, cuaHangId, hienTai = null) => {
  const duLieu = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const tenKhuyenMai = duLieu.tenKhuyenMai === undefined ? hienTai?.tenKhuyenMai : duLieu.tenKhuyenMai;
  if (typeof tenKhuyenMai !== 'string' || !tenKhuyenMai.trim() || tenKhuyenMai.trim().length > 200) throw taoLoi(400, 'Tên khuyến mãi phải từ 1 đến 200 ký tự');
  const loaiKhuyenMai = duLieu.loaiKhuyenMai === undefined ? hienTai?.loaiKhuyenMai : duLieu.loaiKhuyenMai;
  if (!Object.values(LOAI_KHUYEN_MAI).includes(loaiKhuyenMai)) throw taoLoi(400, 'Loại khuyến mãi không hợp lệ');
  const batDauNhap = duLieu.ngayBatDau === undefined ? hienTai?.ngayBatDau : duLieu.ngayBatDau;
  const ketThucNhap = duLieu.ngayKetThuc === undefined ? hienTai?.ngayKetThuc : duLieu.ngayKetThuc;
  if (!(batDauNhap instanceof Date || typeof batDauNhap === 'string') || !(ketThucNhap instanceof Date || typeof ketThucNhap === 'string') || !batDauNhap || !ketThucNhap) {
    throw taoLoi(400, 'Vui lòng nhập thời gian bắt đầu và kết thúc hợp lệ');
  }
  const ngayBatDau = new Date(batDauNhap);
  const ngayKetThuc = new Date(ketThucNhap);
  if (Number.isNaN(ngayBatDau.getTime()) || Number.isNaN(ngayKetThuc.getTime()) || ngayKetThuc <= ngayBatDau || ngayKetThuc <= new Date()) {
    throw taoLoi(400, 'Thời gian khuyến mãi không hợp lệ; ngày kết thúc phải sau ngày bắt đầu và sau hiện tại');
  }
  const chiTiet = duLieu.chiTiet === undefined && hienTai
    ? (await ChiTietKhuyenMai.find({ khuyenMaiId: hienTai._id }).lean()).map(({ sanPhamId, tyLeGiam, giaKhuyenMai }) => ({ sanPhamId, ...(tyLeGiam != null ? { tyLeGiam } : { giaKhuyenMai }) }))
    : duLieu.chiTiet;
  if (!Array.isArray(chiTiet) || chiTiet.length === 0) throw taoLoi(400, 'Chương trình cần ít nhất một sản phẩm');
  const cacId = chiTiet.map((dong) => dong?.sanPhamId);
  if (cacId.some((id) => !mongoose.isValidObjectId(id)) || new Set(cacId.map(String)).size !== cacId.length) throw taoLoi(400, 'Danh sách sản phẩm có ID không hợp lệ hoặc bị trùng');
  const sanPham = await SanPham.find({ _id: { $in: cacId } }, '_id tenSanPham giaGoc cuaHangId').lean();
  const theoId = new Map(sanPham.map((item) => [String(item._id), item]));
  for (const dong of chiTiet) {
    const item = theoId.get(String(dong.sanPhamId));
    if (!item) throw taoLoi(400, 'Sản phẩm không tồn tại');
    if (cuaHangId && String(item.cuaHangId) !== String(cuaHangId)) throw taoLoi(400, 'Sản phẩm không thuộc cửa hàng của bạn');
    const coTyLe = Object.hasOwn(dong, 'tyLeGiam') && dong.tyLeGiam != null;
    const coGia = Object.hasOwn(dong, 'giaKhuyenMai') && dong.giaKhuyenMai != null;
    if (coTyLe === coGia) throw taoLoi(400, 'Mỗi sản phẩm cần đúng một kiểu giảm giá');
    if (coTyLe && (typeof dong.tyLeGiam !== 'number' || !Number.isFinite(dong.tyLeGiam) || dong.tyLeGiam <= 0 || dong.tyLeGiam >= 100)) throw taoLoi(400, 'Tỷ lệ giảm phải lớn hơn 0 và nhỏ hơn 100');
    if (coGia && (typeof dong.giaKhuyenMai !== 'number' || !Number.isInteger(dong.giaKhuyenMai) || dong.giaKhuyenMai < 1 || dong.giaKhuyenMai > item.giaGoc)) {
      throw taoLoi(400, 'Giá sau khuyến mãi phải là số nguyên từ 1 đồng đến giá gốc');
    }
  }
  return {
    tenKhuyenMai: tenKhuyenMai.trim(), loaiKhuyenMai, ngayBatDau, ngayKetThuc,
    chiTiet: chiTiet.map((dong) => ({ sanPhamId: dong.sanPhamId, ...(dong.tyLeGiam != null ? { tyLeGiam: dong.tyLeGiam } : { giaKhuyenMai: dong.giaKhuyenMai }) })),
  };
};

const taoKhuyenMai = async (body, phamVi, cuaHangId = null) => {
  const duLieu = await kiemTraDuLieuKhuyenMai(body, cuaHangId);
  const khuyenMai = await KhuyenMai.create({
    tenKhuyenMai: duLieu.tenKhuyenMai, loaiKhuyenMai: duLieu.loaiKhuyenMai,
    ngayBatDau: duLieu.ngayBatDau, ngayKetThuc: duLieu.ngayKetThuc,
    trangThai: tinhTrangThaiKhuyenMai({ ...duLieu, trangThai: null }), phamVi, cuaHangId,
  });
  try {
    await ChiTietKhuyenMai.insertMany(duLieu.chiTiet.map((dong) => ({ ...dong, khuyenMaiId: khuyenMai._id })));
  } catch (loi) { await KhuyenMai.deleteOne({ _id: khuyenMai._id }); throw loi; }
  await dongBoTrangThaiKhuyenMai();
  return layChiTiet(khuyenMai._id, { _id: khuyenMai._id });
};

const nguoiBanTaoKhuyenMai = (cuaHangId, body) => {
  if (body?.loaiKhuyenMai === LOAI_KHUYEN_MAI.FLASH_SALE) throw taoLoi(403, 'Chỉ Quản trị viên được tạo Flash Sale');
  return taoKhuyenMai(body, PHAM_VI_KHUYEN_MAI.CUA_HANG, cuaHangId);
};
const quanTriTaoKhuyenMai = (body) => taoKhuyenMai(body, PHAM_VI_KHUYEN_MAI.TOAN_SAN);

const capNhatKhuyenMai = async (id, dieuKien, body, cuaHangId = null) => {
  await dongBoTrangThaiKhuyenMai();
  const hienTai = await layKhuyenMai(id, dieuKien);
  if (cuaHangId && (body?.loaiKhuyenMai ?? hienTai.loaiKhuyenMai) === LOAI_KHUYEN_MAI.FLASH_SALE) {
    throw taoLoi(403, 'Chỉ Quản trị viên được quản lý Flash Sale');
  }
  if (hienTai.trangThai === TRANG_THAI_KHUYEN_MAI.DA_KET_THUC) throw taoLoi(409, 'Chương trình đã kết thúc, không thể chỉnh sửa');
  const duLieu = await kiemTraDuLieuKhuyenMai(body, cuaHangId, hienTai);
  const cacDongCu = await ChiTietKhuyenMai.find({ khuyenMaiId: id }).lean();
  const cuTheoSanPham = new Map(cacDongCu.map((dong) => [String(dong.sanPhamId), dong]));
  const cacIdMoi = new Set(duLieu.chiTiet.map((dong) => String(dong.sanPhamId)));
  const trangThai = tinhTrangThaiKhuyenMai({ ...duLieu, trangThai: hienTai.trangThai });
  const daCapNhat = await KhuyenMai.updateOne({ _id: id, ...dieuKien, trangThai: { $ne: TRANG_THAI_KHUYEN_MAI.DA_KET_THUC } }, {
    $set: { tenKhuyenMai: duLieu.tenKhuyenMai, loaiKhuyenMai: duLieu.loaiKhuyenMai, ngayBatDau: duLieu.ngayBatDau, ngayKetThuc: duLieu.ngayKetThuc, trangThai },
  });
  if (!daCapNhat.matchedCount) throw taoLoi(409, 'Chương trình vừa kết thúc, vui lòng tải lại');
  try {
    for (const dong of duLieu.chiTiet) {
      const cu = cuTheoSanPham.get(String(dong.sanPhamId));
      if (cu) await ChiTietKhuyenMai.updateOne({ _id: cu._id }, dong.tyLeGiam != null
        ? { $set: { tyLeGiam: dong.tyLeGiam }, $unset: { giaKhuyenMai: '' } }
        : { $set: { giaKhuyenMai: dong.giaKhuyenMai }, $unset: { tyLeGiam: '' } });
      else await ChiTietKhuyenMai.create({ ...dong, khuyenMaiId: id });
    }
    await ChiTietKhuyenMai.deleteMany({ khuyenMaiId: id, sanPhamId: { $nin: [...cacIdMoi] } });
  } catch (loi) {
    await KhuyenMai.updateOne({ _id: id, trangThai: { $ne: TRANG_THAI_KHUYEN_MAI.DA_KET_THUC } }, { $set: { tenKhuyenMai: hienTai.tenKhuyenMai, loaiKhuyenMai: hienTai.loaiKhuyenMai, ngayBatDau: hienTai.ngayBatDau, ngayKetThuc: hienTai.ngayKetThuc, trangThai: hienTai.trangThai } });
    await ChiTietKhuyenMai.deleteMany({ khuyenMaiId: id });
    if (cacDongCu.length) await ChiTietKhuyenMai.insertMany(cacDongCu);
    throw loi;
  }
  await dongBoTrangThaiKhuyenMai();
  return layChiTiet(id, dieuKien);
};

const nguoiBanCapNhatKhuyenMai = (cuaHangId, id, body) => {
  if (body?.loaiKhuyenMai === LOAI_KHUYEN_MAI.FLASH_SALE) throw taoLoi(403, 'Chỉ Quản trị viên được quản lý Flash Sale');
  return capNhatKhuyenMai(id, { cuaHangId }, body, cuaHangId);
};
const quanTriCapNhatKhuyenMai = (id, body) => capNhatKhuyenMai(id, boLocKhuyenMaiToanSan, body);

const xoaKhuyenMai = async (id, dieuKien) => {
  await layKhuyenMai(id, dieuKien);
  await ChiTietKhuyenMai.deleteMany({ khuyenMaiId: id });
  await KhuyenMai.deleteOne({ _id: id, ...dieuKien });
};
const nguoiBanXoaKhuyenMai = (cuaHangId, id) => xoaKhuyenMai(id, { cuaHangId });
const quanTriXoaKhuyenMai = (id) => xoaKhuyenMai(id, boLocKhuyenMaiToanSan);

const quanTriVoHieuHoaKhuyenMai = async (id) => {
  await dongBoTrangThaiKhuyenMai();
  if (!mongoose.isValidObjectId(id)) throw taoLoi(404, 'Không tìm thấy chương trình khuyến mãi');
  const ketQua = await KhuyenMai.findOneAndUpdate(
    { _id: id, ...boLocKhuyenMaiToanSan, trangThai: { $ne: TRANG_THAI_KHUYEN_MAI.DA_KET_THUC } },
    { $set: { trangThai: TRANG_THAI_KHUYEN_MAI.DA_KET_THUC } }, { returnDocument: 'after' },
  );
  if (!ketQua) {
    if (!await KhuyenMai.exists({ _id: id, ...boLocKhuyenMaiToanSan })) throw taoLoi(404, 'Không tìm thấy chương trình khuyến mãi');
    throw taoLoi(409, 'Chương trình đã kết thúc, không thể vô hiệu hóa lần nữa');
  }
  return layChiTiet(id, boLocKhuyenMaiToanSan);
};

module.exports = {
  tinhTrangThaiKhuyenMai, dongBoTrangThaiKhuyenMai, layDanhSachKhuyenMaiDangDienRa,
  nguoiBanLayDanhSachKhuyenMai, nguoiBanLayChiTietKhuyenMai, nguoiBanTaoKhuyenMai, nguoiBanCapNhatKhuyenMai, nguoiBanXoaKhuyenMai,
  quanTriLayDanhSachKhuyenMai, quanTriLayChiTietKhuyenMai, quanTriTaoKhuyenMai, quanTriCapNhatKhuyenMai, quanTriXoaKhuyenMai, quanTriVoHieuHoaKhuyenMai,
};
