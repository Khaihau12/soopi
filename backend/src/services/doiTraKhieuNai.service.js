const mongoose = require('mongoose');
const YeuCauDoiTraKhieuNai = require('../models/yeuCauDoiTraKhieuNai.model');
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

const docBoLoc = (query = {}, nguoiBan = false) => {
  if (query.trangThaiXuLy && !Object.values(TRANG_THAI_XU_LY_YEU_CAU).includes(query.trangThaiXuLy)) {
    throw taoLoi(400, 'Trạng thái yêu cầu không hợp lệ');
  }
  if (nguoiBan && query.loaiYeuCau && !Object.values(LOAI_YEU_CAU).includes(query.loaiYeuCau)) {
    throw taoLoi(400, 'Loại yêu cầu không hợp lệ');
  }
  for (const giaTri of [query.trang, query.gioiHan]) {
    if (giaTri !== undefined && (!/^\d+$/.test(String(giaTri)) || !Number.isSafeInteger(Number(giaTri)) || Number(giaTri) < 1)) {
      throw taoLoi(400, 'Trang và giới hạn phải là số nguyên dương');
    }
  }
  return { trang: Number(query.trang || 1), gioiHan: Math.min(Number(query.gioiHan || PHAN_TRANG.MAC_DINH), PHAN_TRANG.TOI_DA) };
};

// Các thông tin liên quan được nạp theo lô; số truy vấn không tăng theo số yêu cầu trong trang.
const dungDanhSachYeuCau = async (cacYeuCau, nguoiBan = false) => {
  const cacDong = await ChiTietDonHang.find({ _id: { $in: cacYeuCau.map((item) => item.chiTietDonHangId) } })
    .select('_id donHangId sanPhamId soLuong giaBanThucTe thanhTien').lean();
  const cacDon = await DonHang.find({ _id: { $in: cacDong.map((item) => item.donHangId) } })
    .select('_id ngayTao cuaHangId taiKhoanId').lean();
  const [cacSanPham, cacCuaHang, cacTaiKhoan] = await Promise.all([
    SanPham.find({ _id: { $in: cacDong.map((item) => item.sanPhamId) } }).select('_id tenSanPham hinhAnh').lean(),
    CuaHang.find({ _id: { $in: cacDon.map((item) => item.cuaHangId) } }).select('_id tenCuaHang').lean(),
    nguoiBan ? TaiKhoan.find({ _id: { $in: cacDon.map((item) => item.taiKhoanId) } }).select('_id hoTen soDienThoai').lean() : [],
  ]);
  const taoBang = (danhSach) => new Map(danhSach.map((item) => [String(item._id), item]));
  const dongTheoId = taoBang(cacDong);
  const donTheoId = taoBang(cacDon);
  const sanPhamTheoId = taoBang(cacSanPham);
  const cuaHangTheoId = taoBang(cacCuaHang);
  const taiKhoanTheoId = taoBang(cacTaiKhoan);
  return cacYeuCau.map((item) => {
    const dong = dongTheoId.get(String(item.chiTietDonHangId));
    const don = dong && donTheoId.get(String(dong.donHangId));
    const sanPham = dong && sanPhamTheoId.get(String(dong.sanPhamId));
    const cuaHang = don && cuaHangTheoId.get(String(don.cuaHangId));
    const taiKhoan = don && taiKhoanTheoId.get(String(don.taiKhoanId));
    return {
      _id: item._id, loaiYeuCau: item.loaiYeuCau, noiDung: item.noiDung,
      trangThaiXuLy: item.trangThaiXuLy, ketQuaXuLy: item.ketQuaXuLy || null, ngayTao: item.ngayTao,
      chiTietDonHang: { _id: dong?._id || item.chiTietDonHangId, soLuong: dong?.soLuong,
        giaBanThucTe: dong?.giaBanThucTe, thanhTien: dong?.thanhTien,
        sanPham: sanPham ? { _id: sanPham._id, tenSanPham: sanPham.tenSanPham, hinhAnh: sanPham.hinhAnh }
          : { _id: dong?.sanPhamId, tenSanPham: 'Sản phẩm không còn hiển thị', hinhAnh: [] } },
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
  if (!Object.values(LOAI_YEU_CAU).includes(body.loaiYeuCau)) throw taoLoi(400, 'Vui lòng chọn loại yêu cầu hợp lệ');
  if (typeof body.noiDung !== 'string' || !body.noiDung.trim()) throw taoLoi(400, 'Vui lòng nhập lý do/nội dung');
  const noiDung = body.noiDung.trim();
  if (noiDung.length > DO_DAI_TOI_DA.NOI_DUNG) throw taoLoi(400, `Nội dung không được quá ${DO_DAI_TOI_DA.NOI_DUNG} ký tự`);
  if (await YeuCauDoiTraKhieuNai.exists({ chiTietDonHangId })) throw taoLoi(409, 'Sản phẩm này đã có yêu cầu');
  try {
    const yeuCau = await YeuCauDoiTraKhieuNai.create({ chiTietDonHangId, loaiYeuCau: body.loaiYeuCau,
      noiDung, trangThaiXuLy: TRANG_THAI_XU_LY_YEU_CAU.CHO_XU_LY, ngayTao: new Date() });
    return (await dungDanhSachYeuCau([yeuCau.toObject()]))[0];
  } catch (loi) {
    if (loi.code === 11000) throw taoLoi(409, 'Sản phẩm này đã có yêu cầu');
    throw loi;
  }
};

const layDanhSach = async (dieuKienDon, query = {}, nguoiBan = false) => {
  const { trang, gioiHan } = docBoLoc(query, nguoiBan);
  const donIds = await DonHang.distinct('_id', dieuKienDon);
  const dongIds = await ChiTietDonHang.distinct('_id', { donHangId: { $in: donIds } });
  const dieuKien = { chiTietDonHangId: { $in: dongIds } };
  if (query.trangThaiXuLy) dieuKien.trangThaiXuLy = query.trangThaiXuLy;
  if (nguoiBan && query.loaiYeuCau) dieuKien.loaiYeuCau = query.loaiYeuCau;
  const [tongSo, cacYeuCau] = await Promise.all([
    YeuCauDoiTraKhieuNai.countDocuments(dieuKien),
    YeuCauDoiTraKhieuNai.find(dieuKien).sort({ ngayTao: -1, _id: -1 })
      .skip((trang - 1) * gioiHan).limit(gioiHan).lean(),
  ]);
  return { danhSach: await dungDanhSachYeuCau(cacYeuCau, nguoiBan),
    phanTrang: { trang, gioiHan, tongSo, tongTrang: Math.ceil(tongSo / gioiHan) } };
};

const layDanhSachYeuCauCuaToi = (taiKhoanId, query) => layDanhSach({ taiKhoanId }, query);
const nguoiBanLayDanhSachYeuCau = (cuaHangId, query) => layDanhSach({ cuaHangId }, query, true);

const layChiTiet = async (dieuKienDon, id, nguoiBan = false) => {
  kiemTraId(id);
  const yeuCau = await YeuCauDoiTraKhieuNai.findById(id).lean();
  const dong = yeuCau && await ChiTietDonHang.findById(yeuCau.chiTietDonHangId).select('donHangId').lean();
  const don = dong && await DonHang.findOne({ _id: dong.donHangId, ...dieuKienDon }).select('_id').lean();
  if (!don) throw taoLoi(404, 'Không tìm thấy yêu cầu');
  return (await dungDanhSachYeuCau([yeuCau], nguoiBan))[0];
};

const layChiTietYeuCauCuaToi = (taiKhoanId, id) => layChiTiet({ taiKhoanId }, id);
const nguoiBanLayChiTietYeuCau = (cuaHangId, id) => layChiTiet({ cuaHangId }, id, true);

const nguoiBanXuLyYeuCau = async (cuaHangId, id, ketQuaXuLy) => {
  kiemTraId(id);
  const yeuCau = await nguoiBanLayChiTietYeuCau(cuaHangId, id);
  if (!Object.values(KET_QUA_XU_LY).includes(ketQuaXuLy)) throw taoLoi(400, 'Kết quả xử lý không hợp lệ');
  if (yeuCau.trangThaiXuLy !== TRANG_THAI_XU_LY_YEU_CAU.CHO_XU_LY) throw taoLoi(409, 'Yêu cầu đã được xử lý');
  const daCapNhat = await YeuCauDoiTraKhieuNai.findOneAndUpdate(
    { _id: id, trangThaiXuLy: TRANG_THAI_XU_LY_YEU_CAU.CHO_XU_LY },
    { $set: { trangThaiXuLy: TRANG_THAI_XU_LY_YEU_CAU.DA_XU_LY, ketQuaXuLy } },
    { returnDocument: 'after' },
  ).lean();
  if (!daCapNhat) throw taoLoi(409, 'Yêu cầu đã được xử lý');
  return (await dungDanhSachYeuCau([daCapNhat], true))[0];
};

module.exports = { guiYeuCauDoiTraKhieuNai, layDanhSachYeuCauCuaToi, layChiTietYeuCauCuaToi,
  nguoiBanLayDanhSachYeuCau, nguoiBanLayChiTietYeuCau, nguoiBanXuLyYeuCau };
