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
const { taoDongBienDong } = require('./tonKho.service');
const { NGUONG_CANH_BAO_MAC_DINH, SO_BIEN_DONG_LUU_TOI_DA, LOAI_BIEN_DONG_TON_KHO } = require('../constants/tonKho.constant');

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

const docGiaLoc = (giaTri, ten) => {
  if (giaTri === undefined || giaTri === '') return null;
  if (!/^\d+$/.test(String(giaTri)) || !Number.isSafeInteger(Number(giaTri))) {
    throw taoLoi(400, `${ten} phải là số nguyên không âm.`);
  }
  return Number(giaTri);
};

const thongKeTheoSanPham = async (ids) => {
  if (!ids.length) return new Map();
  // Nhóm một lần để lọc và sắp xếp theo đánh giá, không truy vấn riêng từng sản phẩm.
  const thongKe = await DanhGia.aggregate([
    { $match: { sanPhamId: { $in: ids } } },
    { $group: { _id: '$sanPhamId', soDanhGia: { $sum: 1 }, tongSoSao: { $sum: '$soSao' } } },
  ]);
  return new Map(thongKe.map((item) => [String(item._id), item]));
};

const tachTuTimKiem = (vanBan) => vanBan.toLocaleLowerCase('vi').normalize('NFC').match(/[\p{L}\p{N}]+/gu) || [];
const boDau = (vanBan) => vanBan.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd');
const khopTu = (tuSanPham, tuKhoa) => (tuKhoa === boDau(tuKhoa)
  ? boDau(tuSanPham).startsWith(tuKhoa) : tuSanPham.startsWith(tuKhoa));
const diemTimKiem = (tenSanPham, cacTuKhoa) => {
  const cacTuTen = tachTuTimKiem(tenSanPham);
  if (!cacTuKhoa.every((tuKhoa) => cacTuTen.some((tuTen) => khopTu(tuTen, tuKhoa)))) return -1;
  const soTuKhopChinhXac = cacTuKhoa.filter((tuKhoa) => cacTuTen.some((tuTen) =>
    (tuKhoa === boDau(tuKhoa) ? boDau(tuTen) : tuTen) === tuKhoa)).length;
  const khopCum = cacTuTen.some((_, viTri) => cacTuKhoa.every((tuKhoa, chiSo) =>
    cacTuTen[viTri + chiSo] && khopTu(cacTuTen[viTri + chiSo], tuKhoa)));
  return soTuKhopChinhXac * 2 + (khopCum ? cacTuKhoa.length * 3 : 0);
};

const layDanhSachSanPham = async ({ tuKhoa, danhMucId, khuyenMaiId, cuaHangId,
  giaTu, giaDen, soSaoToiThieu, conHang, sapXep, trang, gioiHan } = {}) => {
  if (danhMucId && !mongoose.isValidObjectId(danhMucId)) throw taoLoi(400, 'ID danh mục không hợp lệ.');
  if (khuyenMaiId && !mongoose.isValidObjectId(khuyenMaiId)) throw taoLoi(400, 'ID khuyến mãi không hợp lệ.');
  if (cuaHangId && !mongoose.isValidObjectId(cuaHangId)) throw taoLoi(400, 'ID cửa hàng không hợp lệ.');
  if (tuKhoa !== undefined && typeof tuKhoa !== 'string') throw taoLoi(400, 'Từ khóa tìm kiếm không hợp lệ.');
  const tuKhoaChuan = tuKhoa?.trim() || '';
  if (tuKhoaChuan.length > 100) throw taoLoi(400, 'Từ khóa tìm kiếm không được quá 100 ký tự.');
  const cacTuKhoa = tachTuTimKiem(tuKhoaChuan);
  const giaTuChuan = docGiaLoc(giaTu, 'Giá từ');
  const giaDenChuan = docGiaLoc(giaDen, 'Giá đến');
  if (giaTuChuan !== null && giaDenChuan !== null && giaTuChuan > giaDenChuan) {
    throw taoLoi(400, 'Giá từ không được lớn hơn giá đến.');
  }
  if (soSaoToiThieu !== undefined && !/^[1-5]$/.test(String(soSaoToiThieu))) {
    throw taoLoi(400, 'Số sao tối thiểu phải từ 1 đến 5.');
  }
  if (conHang !== undefined && conHang !== '' && conHang !== 'true' && conHang !== 'false') {
    throw taoLoi(400, 'Bộ lọc còn hàng không hợp lệ.');
  }
  if (sapXep && !['lien-quan', 'moi-nhat', 'gia-tang', 'gia-giam', 'danh-gia'].includes(sapXep)) {
    throw taoLoi(400, 'Cách sắp xếp sản phẩm không hợp lệ.');
  }
  const trangChuan = docSoPhanTrang(trang, 1, Number.MAX_SAFE_INTEGER);
  const gioiHanChuan = docSoPhanTrang(gioiHan, PHAN_TRANG.MAC_DINH, PHAN_TRANG.TOI_DA);
  const phanTrangRong = { danhSach: [], cuaHangLienQuan: [], danhMucLienQuan: [],
    phanTrang: { trang: trangChuan, gioiHan: gioiHanChuan, tongSo: 0, tongTrang: 0 } };
  if (tuKhoaChuan && !cacTuKhoa.length) return phanTrangRong;
  let sanPhamKhuyenMaiIds;
  if (khuyenMaiId) {
    const bayGio = new Date();
    const chuongTrinh = await KhuyenMai.findOne({ _id: khuyenMaiId, ngayBatDau: { $lte: bayGio }, ngayKetThuc: { $gte: bayGio }, trangThai: { $ne: TRANG_THAI_KHUYEN_MAI.DA_KET_THUC } });
    if (!chuongTrinh) return phanTrangRong;
    sanPhamKhuyenMaiIds = await ChiTietKhuyenMai.find({ khuyenMaiId }).distinct('sanPhamId');
    if (!sanPhamKhuyenMaiIds.length) return phanTrangRong;
  }
  const cuaHangIds = await layCuaHangHoatDong();
  if (cuaHangId && !cuaHangIds.some((id) => String(id) === cuaHangId)) return phanTrangRong;
  const dieuKien = {
    trangThaiKinhDoanh: TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH,
    cuaHangId: { $in: cuaHangIds },
    ...(conHang === 'true' ? { soLuongTon: { $gt: 0 } } : {}),
    ...(sanPhamKhuyenMaiIds ? { _id: { $in: sanPhamKhuyenMaiIds } } : {}),
  };
  const truongCanLay = '_id tenSanPham giaGoc cuaHangId danhMucId';
  let ungVien = [];
  if (cacTuKhoa.length) {
    const coDau = cacTuKhoa.some((tu) => tu !== boDau(tu));
    ungVien = await SanPham.find({ ...dieuKien,
      $text: { $search: cacTuKhoa.join(' '), $diacriticSensitive: coDau } }, truongCanLay).lean();
    ungVien = ungVien.map((item) => ({ ...item, diemLienQuan: diemTimKiem(item.tenSanPham, cacTuKhoa) }))
      .filter((item) => item.diemLienQuan >= 0);
  }
  if (!cacTuKhoa.length || !ungVien.length) {
    // Từ gõ dở hoặc không dấu có thể chưa có trong text index; chỉ quét tên khi cần tìm dự phòng.
    ungVien = await SanPham.find(dieuKien, truongCanLay).lean();
    if (cacTuKhoa.length) ungVien = ungVien.map((item) => ({ ...item, diemLienQuan: diemTimKiem(item.tenSanPham, cacTuKhoa) }))
      .filter((item) => item.diemLienQuan >= 0);
  }
  const thoiDiem = new Date();
  const coGia = await gomGiaBanThucTe(ungVien, thoiDiem);
  const theoGia = coGia.filter((item) => (giaTuChuan === null || item.giaBanThucTe >= giaTuChuan)
    && (giaDenChuan === null || item.giaBanThucTe <= giaDenChuan));
  const canThongKe = Boolean(soSaoToiThieu) || sapXep === 'danh-gia';
  const thongKe = canThongKe ? await thongKeTheoSanPham(theoGia.map((item) => item._id)) : new Map();
  const daLoc = soSaoToiThieu ? theoGia.filter((item) => {
    const muc = thongKe.get(String(item._id));
    return muc && muc.tongSoSao / muc.soDanhGia >= Number(soSaoToiThieu);
  }) : theoGia;
  const daLocTheoCuaHang = cuaHangId ? daLoc.filter((item) => String(item.cuaHangId) === cuaHangId) : daLoc;
  const soSanPhamTheoDanhMuc = new Map();
  for (const item of daLocTheoCuaHang) {
    const id = String(item.danhMucId);
    soSanPhamTheoDanhMuc.set(id, (soSanPhamTheoDanhMuc.get(id) || 0) + 1);
  }
  const danhMucLienQuan = [...soSanPhamTheoDanhMuc].map(([id, soSanPham]) => ({ _id: id, soSanPham }));
  const daLocTheoDanhMuc = danhMucId ? daLoc.filter((item) => String(item.danhMucId) === danhMucId) : daLoc;
  const soSanPhamTheoCuaHang = new Map();
  for (const item of daLocTheoDanhMuc) {
    const id = String(item.cuaHangId);
    soSanPhamTheoCuaHang.set(id, (soSanPhamTheoCuaHang.get(id) || 0) + 1);
  }
  const cuaHangLienQuan = [...soSanPhamTheoCuaHang].map(([id, soSanPham]) => ({ _id: id, soSanPham }));
  const sanPhamDaLoc = danhMucId ? daLocTheoCuaHang.filter((item) => String(item.danhMucId) === danhMucId) : daLocTheoCuaHang;
  const thuTu = sapXep || (tuKhoaChuan ? 'lien-quan' : 'moi-nhat');
  const moiNhatTruoc = (a, b) => String(b._id).localeCompare(String(a._id));
  sanPhamDaLoc.sort((a, b) => {
    if (thuTu === 'gia-tang') return a.giaBanThucTe - b.giaBanThucTe || moiNhatTruoc(a, b);
    if (thuTu === 'gia-giam') return b.giaBanThucTe - a.giaBanThucTe || moiNhatTruoc(a, b);
    if (thuTu === 'danh-gia') {
      const diemA = thongKe.get(String(a._id));
      const diemB = thongKe.get(String(b._id));
      return (diemB ? diemB.tongSoSao / diemB.soDanhGia : 0) - (diemA ? diemA.tongSoSao / diemA.soDanhGia : 0)
        || (diemB?.soDanhGia || 0) - (diemA?.soDanhGia || 0) || moiNhatTruoc(a, b);
    }
    if (thuTu === 'lien-quan' && cacTuKhoa.length) return b.diemLienQuan - a.diemLienQuan || moiNhatTruoc(a, b);
    return moiNhatTruoc(a, b);
  });
  const tongSo = sanPhamDaLoc.length;
  const trangGia = sanPhamDaLoc.slice((trangChuan - 1) * gioiHanChuan, trangChuan * gioiHanChuan);
  const trangIds = trangGia.map((item) => item._id);
  const [sanPhamTrang, thongKeTrang] = await Promise.all([
    SanPham.find({ _id: { $in: trangIds } }, '_id tenSanPham hinhAnh giaGoc soLuongTon cuaHangId danhMucId')
      .populate({ path: 'cuaHangId', select: '_id tenCuaHang' }).lean(),
    canThongKe ? Promise.resolve(thongKe) : thongKeTheoSanPham(trangIds),
  ]);
  const sanPhamTheoId = new Map(sanPhamTrang.map((item) => [String(item._id), item]));
  return {
    cuaHangLienQuan,
    danhMucLienQuan,
    danhSach: trangGia.map((item) => {
      const sanPham = sanPhamTheoId.get(String(item._id));
      if (!sanPham) return null;
      const { cuaHangId: cuaHangDuLieu, ...duLieu } = sanPham;
      const muc = thongKeTrang.get(String(item._id));
      return { ...duLieu, giaBanThucTe: item.giaBanThucTe, khuyenMaiApDung: item.khuyenMaiApDung,
        cuaHang: thongTinCuaHang(cuaHangDuLieu),
        thongKeDanhGia: { diemTrungBinh: muc ? Math.round(muc.tongSoSao / muc.soDanhGia * 10) / 10 : 0,
          soDanhGia: muc?.soDanhGia || 0 } };
    }).filter(Boolean),
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
  if (typeof giaTri !== 'number' || !Number.isSafeInteger(giaTri) || giaTri < 0) throw taoLoi(400, 'Số lượng tồn kho không hợp lệ');
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

const nguoiBanLayDanhSachSanPham = async (cuaHangId, { tuKhoa, trangThaiKinhDoanh, danhMucId, canhBaoTon, trang, gioiHan } = {}) => {
  if (tuKhoa !== undefined && typeof tuKhoa !== 'string') throw taoLoi(400, 'Từ khóa không hợp lệ');
  const tuKhoaChuan = tuKhoa?.trim() || '';
  if (tuKhoaChuan.length > 100) throw taoLoi(400, 'Từ khóa không được quá 100 ký tự');
  if (trangThaiKinhDoanh) kiemTraTrangThai(trangThaiKinhDoanh);
  if (danhMucId && !mongoose.isValidObjectId(danhMucId)) throw taoLoi(400, 'Danh mục không hợp lệ');
  if (canhBaoTon !== undefined && canhBaoTon !== '1') throw taoLoi(400, 'Bộ lọc tồn kho không hợp lệ');
  const trangChuan = docSoPhanTrang(trang, 1, Number.MAX_SAFE_INTEGER);
  const gioiHanChuan = docSoPhanTrang(gioiHan, PHAN_TRANG.MAC_DINH, PHAN_TRANG.TOI_DA);
  const canCanhBao = { $expr: { $lte: ['$soLuongTon',
    { $ifNull: ['$nguongCanhBaoTon', NGUONG_CANH_BAO_MAC_DINH] }] } };
  const dieuKien = { cuaHangId, ...(trangThaiKinhDoanh ? { trangThaiKinhDoanh } : {}), ...(danhMucId ? { danhMucId } : {}),
    ...(canhBaoTon ? { $and: [canCanhBao, { trangThaiKinhDoanh: TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH }] } : {}) };
  if (tuKhoaChuan) dieuKien.tenSanPham = { $regex: thoatKyTuRegex(tuKhoaChuan), $options: 'i' };
  const [tongSo, tongCanhBaoTon, danhSach] = await Promise.all([
    SanPham.countDocuments(dieuKien),
    SanPham.countDocuments({ cuaHangId, trangThaiKinhDoanh: TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH, ...canCanhBao }),
    SanPham.find(dieuKien).sort({ _id: -1 }).skip((trangChuan - 1) * gioiHanChuan).limit(gioiHanChuan)
      .populate({ path: 'danhMucId', select: '_id tenDanhMuc' }).lean(),
  ]);
  return { danhSach: await dinhDangSanPhamNguoiBan(danhSach), tongCanhBaoTon,
    phanTrang: { trang: trangChuan, gioiHan: gioiHanChuan, tongSo, tongTrang: Math.ceil(tongSo / gioiHanChuan) } };
};

const nguoiBanLayChiTietSanPham = async (cuaHangId, id) => {
  const sanPham = await laySanPhamCuaCuaHang(cuaHangId, id);
  await sanPham.populate({ path: 'danhMucId', select: '_id tenDanhMuc' });
  return (await dinhDangSanPhamNguoiBan([sanPham], true))[0];
};

const nguoiBanTaoSanPham = async (cuaHangId, body = {}, taiKhoanId) => {
  const duLieu = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const tenSanPham = kiemTraChuoi(duLieu.tenSanPham, 'tên sản phẩm', DO_DAI_TOI_DA.TEN_SAN_PHAM, true);
  const giaGoc = kiemTraGiaGoc(duLieu.giaGoc);
  const soLuongTon = kiemTraSoLuongTon(duLieu.soLuongTon);
  const danhMucId = await kiemTraDanhMuc(duLieu.danhMucId);
  const hinhAnh = kiemTraHinhAnh(duLieu.hinhAnh || []);
  const moTa = duLieu.moTa === undefined ? '' : kiemTraChuoi(duLieu.moTa, 'mô tả', DO_DAI_TOI_DA.MO_TA);
  const trangThaiKinhDoanh = duLieu.trangThaiKinhDoanh === undefined
    ? TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH : kiemTraTrangThai(duLieu.trangThaiKinhDoanh);
  const sanPham = await SanPham.create({ tenSanPham, giaGoc, soLuongTon, danhMucId, hinhAnh, moTa, trangThaiKinhDoanh, cuaHangId,
    bienDongTonKho: soLuongTon ? [taoDongBienDong(soLuongTon, LOAI_BIEN_DONG_TON_KHO.TAO_SAN_PHAM, { taiKhoanId })] : [] });
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

const nguoiBanCapNhatTonKho = async (cuaHangId, id, body = {}, taiKhoanId) => {
  const duLieu = typeof body === 'number' ? { soLuongTon: body } : body;
  if (!duLieu || typeof duLieu !== 'object' || Array.isArray(duLieu)
      || (!Object.hasOwn(duLieu, 'soLuongTon') && !Object.hasOwn(duLieu, 'nguongCanhBaoTon'))) {
    throw taoLoi(400, 'Vui lòng nhập số lượng hoặc ngưỡng cảnh báo');
  }
  const soLuongMoi = Object.hasOwn(duLieu, 'soLuongTon') ? kiemTraSoLuongTon(duLieu.soLuongTon) : null;
  const soLuongTruoc = duLieu.soLuongTonTruoc;
  if (soLuongTruoc !== undefined) kiemTraSoLuongTon(soLuongTruoc);
  const nguongMoi = duLieu.nguongCanhBaoTon;
  if (nguongMoi !== undefined && (!Number.isSafeInteger(nguongMoi) || nguongMoi < 0 || nguongMoi > 1000000)) {
    throw taoLoi(400, 'Ngưỡng cảnh báo phải là số nguyên từ 0 đến 1.000.000');
  }
  for (let lan = 0; lan < 2; lan++) {
    const sanPham = await laySanPhamCuaCuaHang(cuaHangId, id);
    const soLuongCu = sanPham.soLuongTon;
    if (soLuongTruoc !== undefined && soLuongTruoc !== soLuongCu) {
      throw taoLoi(409, 'Tồn kho đã thay đổi. Vui lòng tải lại số lượng và kiểm tra trước khi lưu');
    }
    const soLuongCanLuu = soLuongMoi ?? soLuongCu;
    const nguongCanLuu = nguongMoi ?? sanPham.nguongCanhBaoTon ?? NGUONG_CANH_BAO_MAC_DINH;
    if (soLuongCanLuu === soLuongCu && nguongCanLuu === (sanPham.nguongCanhBaoTon ?? NGUONG_CANH_BAO_MAC_DINH)) {
      return nguoiBanLayChiTietSanPham(cuaHangId, id);
    }
    const thayDoi = soLuongCanLuu - soLuongCu;
    const capNhat = { $set: { soLuongTon: soLuongCanLuu, nguongCanhBaoTon: nguongCanLuu } };
    if (thayDoi) capNhat.$push = { bienDongTonKho: { $each: [
      taoDongBienDong(thayDoi, LOAI_BIEN_DONG_TON_KHO.DIEU_CHINH, { taiKhoanId })],
    $slice: -SO_BIEN_DONG_LUU_TOI_DA } };
    const ketQua = await SanPham.updateOne(
      { _id: id, cuaHangId, soLuongTon: soLuongCu },
      capNhat,
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
