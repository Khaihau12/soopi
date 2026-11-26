const mongoose = require('mongoose');
const ChiTietDonHang = require('../models/chiTietDonHang.model');
const DonHang = require('../models/donHang.model');
const SanPham = require('../models/sanPham.model');
const CuaHang = require('../models/cuaHang.model');
const TaiKhoan = require('../models/taiKhoan.model');
const { tinhHanGuiYeuCau } = require('./donHang.service');
const { DO_DAI_TOI_DA, PHAN_TRANG, SO_NGAY_DOI_TRA_TOI_DA } = require('../constants/cauHinh.constant');
const { LOAI_YEU_CAU, TRANG_THAI_XU_LY_YEU_CAU, KET_QUA_XU_LY, TRANG_THAI_XU_LY } = require('../constants/trangThai.constant');
const { taoLoi } = require('../utils/taoLoi');

const kiemTraId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(404, 'Không tìm thấy yêu cầu');
  return id;
};

const dieuKienYeuCau = (query = {}) => {
  const dieuKien = { 'yeuCauDoiTra._id': { $exists: true } };
  if (query.trangThaiXuLy) dieuKien['yeuCauDoiTra.trangThaiXuLy'] = query.trangThaiXuLy;
  return dieuKien;
};

const docBoLoc = (query = {}) => {
  if (query.trangThaiXuLy && !Object.values(TRANG_THAI_XU_LY_YEU_CAU).includes(query.trangThaiXuLy)) {
    throw taoLoi(400, 'Trạng thái yêu cầu không hợp lệ');
  }
  for (const giaTri of [query.trang, query.gioiHan]) {
    if (giaTri !== undefined && (!/^\d+$/.test(String(giaTri)) || !Number.isSafeInteger(Number(giaTri)) || Number(giaTri) < 1)) {
      throw taoLoi(400, 'Trang và giới hạn phải là số nguyên dương');
    }
  }
  return { trang: Number(query.trang || 1), gioiHan: Math.min(Number(query.gioiHan || PHAN_TRANG.MAC_DINH), PHAN_TRANG.TOI_DA) };
};

// Các thông tin liên quan được nạp theo lô; số truy vấn không tăng theo số yêu cầu trong trang.
const dungDanhSachYeuCau = async (cacDong, nguoiBan = false) => {
  const cacDon = await DonHang.find({ _id: { $in: cacDong.map((item) => item.donHangId) } })
    .select('_id ngayTao cuaHangId taiKhoanId').lean();
  const [cacSanPham, cacCuaHang, cacTaiKhoan] = await Promise.all([
    SanPham.find({ _id: { $in: cacDong.map((item) => item.sanPhamId) } }).select('_id tenSanPham hinhAnh').lean(),
    CuaHang.find({ _id: { $in: cacDon.map((item) => item.cuaHangId) } }).select('_id tenCuaHang').lean(),
    nguoiBan ? TaiKhoan.find({ _id: { $in: cacDon.map((item) => item.taiKhoanId) } }).select('_id hoTen soDienThoai').lean() : [],
  ]);
  const taoBang = (danhSach) => new Map(danhSach.map((item) => [String(item._id), item]));
  const donTheoId = taoBang(cacDon);
  const sanPhamTheoId = taoBang(cacSanPham);
  const cuaHangTheoId = taoBang(cacCuaHang);
  const taiKhoanTheoId = taoBang(cacTaiKhoan);
  return cacDong.map((dong) => {
    const item = dong.yeuCauDoiTra;
    const don = dong && donTheoId.get(String(dong.donHangId));
    const sanPham = dong && sanPhamTheoId.get(String(dong.sanPhamId));
    const cuaHang = don && cuaHangTheoId.get(String(don.cuaHangId));
    const taiKhoan = don && taiKhoanTheoId.get(String(don.taiKhoanId));
    return {
      _id: item._id, loaiYeuCau: item.loaiYeuCau, noiDung: item.noiDung,
      trangThaiXuLy: item.trangThaiXuLy, ketQuaXuLy: item.ketQuaXuLy || null, ngayTao: item.ngayTao,
      chiTietDonHang: { _id: dong._id, soLuong: dong.soLuong,
        giaBanThucTe: dong.giaBanThucTe, thanhTien: dong.thanhTien,
        sanPham: sanPham ? { _id: sanPham._id, tenSanPham: sanPham.tenSanPham, hinhAnh: sanPham.hinhAnh }
          : { _id: dong.sanPhamId, tenSanPham: 'Sản phẩm không còn hiển thị', hinhAnh: [] } },
      donHang: { _id: don?._id, ngayTao: don?.ngayTao,
        cuaHang: cuaHang ? { _id: cuaHang._id, tenCuaHang: cuaHang.tenCuaHang }
          : { _id: don?.cuaHangId, tenCuaHang: 'Cửa hàng không còn hiển thị' } },
      ...(nguoiBan ? { nguoiGui: { hoTen: taiKhoan?.hoTen || 'Người mua', soDienThoai: taiKhoan?.soDienThoai || '' } } : {}),
    };
  });
};

const guiYeuCauDoiTraKhieuNai = async (taiKhoanId, body = {}) => {
  const chiTietDonHangId = body?.chiTietDonHangId;
  if (!mongoose.isValidObjectId(chiTietDonHangId)) throw taoLoi(404, 'Không tìm thấy sản phẩm trong đơn hàng của bạn');
  const dong = await ChiTietDonHang.findById(chiTietDonHangId).lean();
  const donHang = dong && await DonHang.findOne({ _id: dong.donHangId, taiKhoanId }).lean();
  if (!donHang) throw taoLoi(404, 'Không tìm thấy sản phẩm trong đơn hàng của bạn');
  if (donHang.trangThaiXuLy !== TRANG_THAI_XU_LY.HOAN_THANH) {
    throw taoLoi(409, 'Đơn hàng chưa đủ điều kiện gửi yêu cầu');
  }
  const han = tinhHanGuiYeuCau(donHang);
  if (!han || Date.now() > han.getTime()) {
    throw taoLoi(409, `Đã quá thời hạn gửi yêu cầu (${SO_NGAY_DOI_TRA_TOI_DA} ngày kể từ khi đơn hoàn thành)`);
  }
  if (typeof body.noiDung !== 'string' || !body.noiDung.trim()) throw taoLoi(400, 'Vui lòng nhập lý do đổi trả');
  const noiDung = body.noiDung.trim();
  if (noiDung.length > DO_DAI_TOI_DA.NOI_DUNG) throw taoLoi(400, `Nội dung không được quá ${DO_DAI_TOI_DA.NOI_DUNG} ký tự`);
  // Điều kiện trên cùng dòng đơn đảm bảo hai lần gửi đồng thời chỉ tạo một yêu cầu.
  const daCapNhat = await ChiTietDonHang.findOneAndUpdate(
    { _id: chiTietDonHangId, yeuCauDoiTra: { $exists: false } },
    { $set: { yeuCauDoiTra: { loaiYeuCau: LOAI_YEU_CAU.DOI_TRA, noiDung,
      trangThaiXuLy: TRANG_THAI_XU_LY_YEU_CAU.CHO_XU_LY, ngayTao: new Date() } } },
    { returnDocument: 'after', runValidators: true },
  ).lean();
  if (!daCapNhat) throw taoLoi(409, 'Sản phẩm này đã có yêu cầu');
  return (await dungDanhSachYeuCau([daCapNhat]))[0];
};

const layDanhSach = async (dieuKienDon, query = {}, nguoiBan = false) => {
  const { trang, gioiHan } = docBoLoc(query);
  const donIds = await DonHang.distinct('_id', dieuKienDon);
  const dieuKien = { donHangId: { $in: donIds }, ...dieuKienYeuCau(query) };
  const [tongSo, cacDong] = await Promise.all([
    ChiTietDonHang.countDocuments(dieuKien),
    ChiTietDonHang.find(dieuKien).sort({ 'yeuCauDoiTra.ngayTao': -1, 'yeuCauDoiTra._id': -1 })
      .skip((trang - 1) * gioiHan).limit(gioiHan).lean(),
  ]);
  return { danhSach: await dungDanhSachYeuCau(cacDong, nguoiBan),
    phanTrang: { trang, gioiHan, tongSo, tongTrang: Math.ceil(tongSo / gioiHan) } };
};

const layDanhSachYeuCauCuaToi = (taiKhoanId, query) => layDanhSach({ taiKhoanId }, query);
const nguoiBanLayDanhSachYeuCau = (cuaHangId, query) => layDanhSach({ cuaHangId }, query, true);

const layChiTiet = async (dieuKienDon, id, nguoiBan = false) => {
  kiemTraId(id);
  const dong = await ChiTietDonHang.findOne({ 'yeuCauDoiTra._id': id }).lean();
  const don = dong && await DonHang.findOne({ _id: dong.donHangId, ...dieuKienDon }).select('_id').lean();
  if (!don) throw taoLoi(404, 'Không tìm thấy yêu cầu');
  return (await dungDanhSachYeuCau([dong], nguoiBan))[0];
};

const layChiTietYeuCauCuaToi = (taiKhoanId, id) => layChiTiet({ taiKhoanId }, id);
const nguoiBanLayChiTietYeuCau = (cuaHangId, id) => layChiTiet({ cuaHangId }, id, true);

const nguoiBanXuLyYeuCau = async (cuaHangId, id, ketQuaXuLy) => {
  kiemTraId(id);
  const yeuCau = await nguoiBanLayChiTietYeuCau(cuaHangId, id);
  if (!Object.values(KET_QUA_XU_LY).includes(ketQuaXuLy)) throw taoLoi(400, 'Kết quả xử lý không hợp lệ');
  if (yeuCau.trangThaiXuLy !== TRANG_THAI_XU_LY_YEU_CAU.CHO_XU_LY) throw taoLoi(409, 'Yêu cầu đã được xử lý');
  const daCapNhat = await ChiTietDonHang.findOneAndUpdate(
    { _id: yeuCau.chiTietDonHang._id, 'yeuCauDoiTra._id': id,
      'yeuCauDoiTra.trangThaiXuLy': TRANG_THAI_XU_LY_YEU_CAU.CHO_XU_LY },
    { $set: { 'yeuCauDoiTra.trangThaiXuLy': TRANG_THAI_XU_LY_YEU_CAU.DA_XU_LY,
      'yeuCauDoiTra.ketQuaXuLy': ketQuaXuLy } },
    { returnDocument: 'after', runValidators: true },
  ).lean();
  if (!daCapNhat) throw taoLoi(409, 'Yêu cầu đã được xử lý');
  return (await dungDanhSachYeuCau([daCapNhat], true))[0];
};

module.exports = { guiYeuCauDoiTraKhieuNai, layDanhSachYeuCauCuaToi, layChiTietYeuCauCuaToi,
  nguoiBanLayDanhSachYeuCau, nguoiBanLayChiTietYeuCau, nguoiBanXuLyYeuCau };
