const crypto = require('crypto');
const mongoose = require('mongoose');
const DonHang = require('../models/donHang.model');
const ChiTietDonHang = require('../models/chiTietDonHang.model');
const ApDungVoucher = require('../models/apDungVoucher.model');
const SanPham = require('../models/sanPham.model');
const Voucher = require('../models/voucher.model');
const GiaoDichThanhToan = require('../models/giaoDichThanhToan.model');
const TaiKhoan = require('../models/taiKhoan.model');
const { PHAN_TRANG } = require('../constants/cauHinh.constant');
const { layKhoangNgay } = require('../utils/thoiGian');
const { thoatKyTuRegex } = require('../utils/thoatKyTuRegex');
const { PHUONG_THUC_THANH_TOAN, TRANG_THAI_GIAO_DICH, TRANG_THAI_THANH_TOAN_DON, TRANG_THAI_XU_LY } = require('../constants/trangThai.constant');
const { SO_TIEN_VNPAY_TOI_THIEU, THOI_HAN_THANH_TOAN_GIO, THOI_GIAN_GIA_HAN_PHUT, TIEN_TO_MA_GIAO_DICH } = require('../constants/cauHinh.constant');
const { dinhDangGioVietNam, taoDuongDanThanhToan, xacThucChuKy } = require('../utils/vnpay');
const { taoLoi } = require('../utils/taoLoi');

const taoMaGiaoDich = () => `${TIEN_TO_MA_GIAO_DICH}${dinhDangGioVietNam(new Date())}${crypto.randomInt(0, 1000000).toString().padStart(6, '0')}`;

const taoGiaoDich = async (duLieu) => {
  for (let lan = 0; lan < 3; lan++) {
    try { return await GiaoDichThanhToan.create({ ...duLieu, maGiaoDich: taoMaGiaoDich() }); }
    catch (loi) { if (loi.code !== 11000 || lan === 2) throw loi; }
  }
};

// Mỗi URL có mã tham chiếu riêng để không trùng mã trong cùng ngày theo quy tắc PAY.
const maDaPhat = new Set();
const taoTxnRef = (maGiaoDich) => {
  for (let lan = 0; lan < 10000; lan++) {
    const ma = `${maGiaoDich}R${crypto.randomInt(0, 10000).toString().padStart(4, '0')}`;
    if (!maDaPhat.has(ma)) { maDaPhat.add(ma); return ma; }
  }
  throw taoLoi(409, 'Đã tạo quá nhiều lần thanh toán cho giao dịch này');
};
const tachMaGiaoDichTuTxnRef = (txnRef) => {
  if (typeof txnRef !== 'string' || !/^SP\d{20}(?:R\d{4})?$/.test(txnRef)) return null;
  return txnRef.split('R')[0];
};

const taoThanhToanVnpay = async (taiKhoanId, giaoDichId, ip) => {
  if (!mongoose.isValidObjectId(giaoDichId)
      || !(await DonHang.exists({ giaoDichId, taiKhoanId }))) throw taoLoi(404, 'Không tìm thấy giao dịch của bạn');
  const giaoDich = await GiaoDichThanhToan.findById(giaoDichId).lean();
  if (!giaoDich) throw taoLoi(404, 'Không tìm thấy giao dịch của bạn');
  if (giaoDich.phuongThucThanhToan !== PHUONG_THUC_THANH_TOAN.VNPAY) throw taoLoi(409, 'Đơn thanh toán khi nhận hàng không dùng cổng VNPay');
  const hetHan = new Date(giaoDich.thoiGianTao.getTime() + THOI_HAN_THANH_TOAN_GIO * 3600000);
  if (giaoDich.trangThaiThanhToan !== TRANG_THAI_GIAO_DICH.CHO_THANH_TOAN || Date.now() >= hetHan.getTime()) {
    throw taoLoi(409, 'Giao dịch không còn chờ thanh toán hoặc đã hết hạn');
  }
  if (giaoDich.soTien <= 0 || (SO_TIEN_VNPAY_TOI_THIEU !== null && giaoDich.soTien < SO_TIEN_VNPAY_TOI_THIEU)) {
    throw taoLoi(409, 'Số tiền giao dịch không hợp lệ để thanh toán qua VNPay');
  }
  const tenBien = ['VNP_TMN_CODE', 'VNP_HASH_SECRET', 'VNP_URL', 'VNP_RETURN_URL'];
  const thieu = tenBien.filter((ten) => !process.env[ten]);
  if (thieu.length) {
    console.error(`Thiếu cấu hình VNPay: ${thieu.join(', ')}`);
    throw taoLoi(500, 'Cổng thanh toán chưa được cấu hình. Vui lòng thử lại sau.');
  }
  const thamSo = {
    vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: process.env.VNP_TMN_CODE,
    vnp_Amount: giaoDich.soTien * 100, vnp_CreateDate: dinhDangGioVietNam(new Date()),
    vnp_CurrCode: 'VND', vnp_IpAddr: ip, vnp_Locale: 'vn',
    vnp_OrderInfo: `Thanh toan don hang ${giaoDich.maGiaoDich}`, vnp_OrderType: 'other',
    vnp_ReturnUrl: process.env.VNP_RETURN_URL, vnp_TxnRef: taoTxnRef(giaoDich.maGiaoDich),
    vnp_ExpireDate: dinhDangGioVietNam(hetHan),
  };
  return { duongDanThanhToan: taoDuongDanThanhToan(process.env.VNP_URL, thamSo, process.env.VNP_HASH_SECRET) };
};

// Chỉ gọi sau khi tiến trình đã chiếm quyền cập nhật giao dịch từ Chờ thanh toán.
const huyGiaoDichVaHoanKho = async (giaoDich, lyDo) => {
  if (![TRANG_THAI_GIAO_DICH.THAT_BAI, TRANG_THAI_GIAO_DICH.HET_HAN].includes(lyDo)) {
    throw taoLoi(400, 'Lý do hủy giao dịch không hợp lệ');
  }
  const donHang = await DonHang.find({ giaoDichId: giaoDich._id }).select('_id').lean();
  const donIds = donHang.map((don) => don._id);
  for (const don of donHang) {
    const daHuy = await DonHang.findOneAndUpdate(
      { _id: don._id, giaoDichId: giaoDich._id, trangThaiXuLy: { $ne: TRANG_THAI_XU_LY.DA_HUY } },
      { $set: { trangThaiThanhToan: lyDo, trangThaiXuLy: TRANG_THAI_XU_LY.DA_HUY } },
    );
    if (!daHuy) continue;
    const chiTiet = await ChiTietDonHang.find({ donHangId: don._id }).select('sanPhamId soLuong').lean();
    if (chiTiet.length) {
      await SanPham.bulkWrite(chiTiet.map((dong) => ({
        updateOne: { filter: { _id: dong.sanPhamId }, update: { $inc: { soLuongTon: dong.soLuong } } },
      })));
    }
  }
  const voucherIds = await ApDungVoucher.distinct('voucherId', { donHangId: { $in: donIds } });
  for (const voucherId of voucherIds) {
    await Voucher.updateOne({ _id: voucherId }, { $inc: { soLuong: 1 } });
  }
};

const xuLyKetQuaVnpay = async (query) => {
  if (!xacThucChuKy(query, process.env.VNP_HASH_SECRET)) return { loi: 'chuKy' };
  const maGiaoDich = tachMaGiaoDichTuTxnRef(query.vnp_TxnRef);
  const giaoDich = maGiaoDich && await GiaoDichThanhToan.findOne({ maGiaoDich });
  if (!giaoDich || giaoDich.phuongThucThanhToan !== PHUONG_THUC_THANH_TOAN.VNPAY) return { loi: 'khongTimThay' };
  if (!/^\d+$/.test(query.vnp_Amount || '') || Number(query.vnp_Amount) !== giaoDich.soTien * 100) {
    console.warn('VNPay trả về số tiền không khớp:', giaoDich.maGiaoDich, query.vnp_Amount);
    return { loi: 'saiSoTien' };
  }
  const thanhCong = query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00';
  if (giaoDich.trangThaiThanhToan !== TRANG_THAI_GIAO_DICH.CHO_THANH_TOAN) {
    if (thanhCong && [TRANG_THAI_GIAO_DICH.HET_HAN, TRANG_THAI_GIAO_DICH.THAT_BAI].includes(giaoDich.trangThaiThanhToan)) {
      console.warn('VNPay báo thanh toán đến muộn, cần đối soát và hoàn tiền thủ công:', giaoDich.maGiaoDich, query.vnp_Amount);
    }
    return { giaoDichId: giaoDich._id };
  }
  const trangThai = thanhCong ? TRANG_THAI_GIAO_DICH.THANH_CONG : TRANG_THAI_GIAO_DICH.THAT_BAI;
  const daChiemQuyen = await GiaoDichThanhToan.findOneAndUpdate(
    { _id: giaoDich._id, trangThaiThanhToan: TRANG_THAI_GIAO_DICH.CHO_THANH_TOAN },
    { $set: { trangThaiThanhToan: trangThai, thoiGianHoanTat: new Date() } },
  );
  if (!daChiemQuyen) {
    if (thanhCong) {
      const moiNhat = await GiaoDichThanhToan.findById(giaoDich._id).select('trangThaiThanhToan').lean();
      if ([TRANG_THAI_GIAO_DICH.HET_HAN, TRANG_THAI_GIAO_DICH.THAT_BAI].includes(moiNhat?.trangThaiThanhToan)) {
        console.warn('VNPay báo thanh toán đến muộn, cần đối soát và hoàn tiền thủ công:', giaoDich.maGiaoDich, query.vnp_Amount);
      }
    }
    return { giaoDichId: giaoDich._id };
  }
  if (thanhCong) {
    await DonHang.updateMany(
      { giaoDichId: giaoDich._id },
      { $set: { trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN } },
    );
  } else {
    await huyGiaoDichVaHoanKho(giaoDich, TRANG_THAI_GIAO_DICH.THAT_BAI);
  }
  return { giaoDichId: giaoDich._id };
};

const xuLyGiaoDichHetHan = async () => {
  const mocHetHan = new Date(Date.now() - THOI_HAN_THANH_TOAN_GIO * 3600000 - THOI_GIAN_GIA_HAN_PHUT * 60000);
  const danhSach = await GiaoDichThanhToan.find({
    phuongThucThanhToan: PHUONG_THUC_THANH_TOAN.VNPAY,
    trangThaiThanhToan: TRANG_THAI_GIAO_DICH.CHO_THANH_TOAN,
    thoiGianTao: { $lte: mocHetHan },
  }).select('_id').lean();
  for (const giaoDich of danhSach) {
    try {
      const daChiemQuyen = await GiaoDichThanhToan.findOneAndUpdate(
        { _id: giaoDich._id, phuongThucThanhToan: PHUONG_THUC_THANH_TOAN.VNPAY,
          trangThaiThanhToan: TRANG_THAI_GIAO_DICH.CHO_THANH_TOAN, thoiGianTao: { $lte: mocHetHan } },
        { $set: { trangThaiThanhToan: TRANG_THAI_GIAO_DICH.HET_HAN, thoiGianHoanTat: new Date() } },
      );
      if (daChiemQuyen) await huyGiaoDichVaHoanKho(daChiemQuyen, TRANG_THAI_GIAO_DICH.HET_HAN);
    } catch (loi) {
      console.error('Không thể xử lý giao dịch VNPay hết hạn:', String(giaoDich._id), loi);
    }
  }
};

const layChiTietGiaoDich = async (taiKhoanId, giaoDichId) => {
  if (!mongoose.isValidObjectId(giaoDichId) || !(await DonHang.exists({ giaoDichId, taiKhoanId }))) {
    throw taoLoi(404, 'Không tìm thấy giao dịch của bạn');
  }
  const giaoDich = await GiaoDichThanhToan.findById(giaoDichId)
    .select('_id maGiaoDich soTien phuongThucThanhToan trangThaiThanhToan thoiGianTao thoiGianHoanTat').lean();
  if (!giaoDich) throw taoLoi(404, 'Không tìm thấy giao dịch của bạn');
  const danhSachDonHang = await DonHang.find({ giaoDichId, taiKhoanId })
    .select('_id cuaHangId tongThanhToan trangThaiThanhToan trangThaiXuLy')
    .populate('cuaHangId', '_id tenCuaHang').lean();
  return {
    giaoDich,
    danhSachDonHang: danhSachDonHang.map(({ cuaHangId, ...don }) => ({ ...don, cuaHang: cuaHangId })),
    hanThanhToan: new Date(giaoDich.thoiGianTao.getTime() + THOI_HAN_THANH_TOAN_GIO * 3600000),
  };
};

const dieuKienHoanTien = {
  phuongThucThanhToan: PHUONG_THUC_THANH_TOAN.VNPAY,
  trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN,
  trangThaiXuLy: TRANG_THAI_XU_LY.DA_HUY,
  tongThanhToan: { $gt: 0 },
};
const coCanHoanTien = (don) => don.phuongThucThanhToan === PHUONG_THUC_THANH_TOAN.VNPAY
  && don.trangThaiThanhToan === TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN
  && don.trangThaiXuLy === TRANG_THAI_XU_LY.DA_HUY && don.tongThanhToan > 0;
const docPhanTrangQuanTri = (query) => {
  const trang = Number(query.trang ?? 1);
  const gioiHan = Number(query.gioiHan ?? PHAN_TRANG.MAC_DINH);
  if (!Number.isSafeInteger(trang) || trang < 1 || !Number.isSafeInteger(gioiHan) || gioiHan < 1) throw taoLoi(400, 'Trang và giới hạn phải là số nguyên dương.');
  return { trang, gioiHan: Math.min(gioiHan, PHAN_TRANG.TOI_DA) };
};
const quanTriLayDanhSachGiaoDich = async (query = {}) => {
  if (query.trangThaiThanhToan && !Object.values(TRANG_THAI_GIAO_DICH).includes(query.trangThaiThanhToan)) throw taoLoi(400, 'Trạng thái giao dịch không hợp lệ.');
  if (query.phuongThucThanhToan && !Object.values(PHUONG_THUC_THANH_TOAN).includes(query.phuongThucThanhToan)) throw taoLoi(400, 'Phương thức thanh toán không hợp lệ.');
  if (query.canHoanTien && query.canHoanTien !== 'true') throw taoLoi(400, 'Bộ lọc hoàn tiền không hợp lệ.');
  if (query.tuKhoa !== undefined && (typeof query.tuKhoa !== 'string' || query.tuKhoa.length > 100)) throw taoLoi(400, 'Từ khóa giao dịch không hợp lệ.');
  const { trang, gioiHan } = docPhanTrangQuanTri(query);
  const khoangNgay = layKhoangNgay(query.tuNgay, query.denNgay);
  const dieuKien = {
    ...(query.trangThaiThanhToan ? { trangThaiThanhToan: query.trangThaiThanhToan } : {}),
    ...(query.phuongThucThanhToan ? { phuongThucThanhToan: query.phuongThucThanhToan } : {}),
    ...(query.tuKhoa?.trim() ? { maGiaoDich: { $regex: thoatKyTuRegex(query.tuKhoa.trim()), $options: 'i' } } : {}),
    ...(Object.keys(khoangNgay).length ? { thoiGianTao: khoangNgay } : {}),
  };
  if (query.canHoanTien === 'true') {
    const ids = await DonHang.distinct('giaoDichId', dieuKienHoanTien);
    dieuKien._id = { $in: ids };
  }
  const [tongSo, danhSach] = await Promise.all([
    GiaoDichThanhToan.countDocuments(dieuKien),
    GiaoDichThanhToan.find(dieuKien, '_id maGiaoDich soTien phuongThucThanhToan trangThaiThanhToan thoiGianTao thoiGianHoanTat')
      .sort({ thoiGianTao: -1, _id: -1 }).skip((trang - 1) * gioiHan).limit(gioiHan).lean(),
  ]);
  const don = danhSach.length ? await DonHang.find({ giaoDichId: { $in: danhSach.map((item) => item._id) } },
    'giaoDichId taiKhoanId tongThanhToan phuongThucThanhToan trangThaiThanhToan trangThaiXuLy').sort({ _id: 1 }).lean() : [];
  const nguoiMuaIds = [...new Set(don.map((item) => String(item.taiKhoanId)))];
  const nguoiMua = nguoiMuaIds.length ? await TaiKhoan.find({ _id: { $in: nguoiMuaIds } }, '_id hoTen email').lean() : [];
  const nguoiTheoId = new Map(nguoiMua.map((item) => [String(item._id), { hoTen: item.hoTen, email: item.email }]));
  const donTheoGiaoDich = new Map();
  for (const item of don) {
    const key = String(item.giaoDichId);
    if (!donTheoGiaoDich.has(key)) donTheoGiaoDich.set(key, []);
    donTheoGiaoDich.get(key).push(item);
  }
  return { danhSach: danhSach.map((item) => {
    const cacDon = donTheoGiaoDich.get(String(item._id)) || [];
    return { ...item, soDonHang: cacDon.length, soDonCanHoanTien: cacDon.filter(coCanHoanTien).length,
      nguoiMua: cacDon.length ? nguoiTheoId.get(String(cacDon[0].taiKhoanId)) || null : null };
  }), phanTrang: { trang, gioiHan, tongSo, tongTrang: Math.ceil(tongSo / gioiHan) } };
};
const quanTriLayChiTietGiaoDich = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID giao dịch không hợp lệ.');
  const giaoDich = await GiaoDichThanhToan.findById(id,
    '_id maGiaoDich soTien phuongThucThanhToan trangThaiThanhToan thoiGianTao thoiGianHoanTat').lean();
  if (!giaoDich) throw taoLoi(404, 'Không tìm thấy giao dịch.');
  const don = await DonHang.find({ giaoDichId: id }, '_id ngayTao cuaHangId taiKhoanId tongThanhToan phuongThucThanhToan trangThaiThanhToan trangThaiXuLy')
    .sort({ _id: 1 }).populate('cuaHangId', '_id tenCuaHang').lean();
  const taiKhoanId = don[0]?.taiKhoanId;
  const nguoiMua = taiKhoanId ? await TaiKhoan.findById(taiKhoanId, '_id hoTen email').lean() : null;
  return { ...giaoDich, nguoiMua: nguoiMua ? { hoTen: nguoiMua.hoTen, email: nguoiMua.email } : null,
    soDonHang: don.length, soDonCanHoanTien: don.filter(coCanHoanTien).length,
    danhSachDonHang: don.map(({ cuaHangId, taiKhoanId: _, ...item }) => ({ ...item, cuaHang: cuaHangId || null, canHoanTien: coCanHoanTien(item) })) };
};

module.exports = { taoMaGiaoDich, taoGiaoDich, tachMaGiaoDichTuTxnRef, taoThanhToanVnpay,
  xuLyKetQuaVnpay, huyGiaoDichVaHoanKho, xuLyGiaoDichHetHan, layChiTietGiaoDich,
  quanTriLayDanhSachGiaoDich, quanTriLayChiTietGiaoDich };
