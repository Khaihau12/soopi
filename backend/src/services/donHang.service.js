const mongoose = require('mongoose');
const Voucher = require('../models/voucher.model');
const SanPham = require('../models/sanPham.model');
const CuaHang = require('../models/cuaHang.model');
const GioHang = require('../models/gioHang.model');
const ChiTietGioHang = require('../models/chiTietGioHang.model');
const DonHang = require('../models/donHang.model');
const TaiKhoan = require('../models/taiKhoan.model');
const ChiTietDonHang = require('../models/chiTietDonHang.model');
const ApDungVoucher = require('../models/apDungVoucher.model');
const GiaoDichThanhToan = require('../models/giaoDichThanhToan.model');
const DanhGia = require('../models/danhGia.model');
const YeuCauDoiTraKhieuNai = require('../models/yeuCauDoiTraKhieuNai.model');
const { taoGiaoDich, huyGiaoDichVaHoanKho } = require('./giaoDichThanhToan.service');
const { dungTrangThaiGioHang } = require('./gioHang.service');
const { kiemTraDieuKienVoucher, tinhMucGiamVoucher } = require('./voucher.service');
const { phanBoTheoTyLe } = require('../utils/phanBoTheoTyLe');
const { taoLoi } = require('../utils/taoLoi');
const { PHI_VAN_CHUYEN_MAC_DINH, SO_VOUCHER_TOI_DA_MOI_LAN, SO_TIEN_VNPAY_TOI_THIEU, DO_DAI_TOI_DA, PHAN_TRANG, THOI_HAN_THANH_TOAN_GIO, SO_NGAY_DOI_TRA_TOI_DA } = require('../constants/cauHinh.constant');
const { LOAI_VOUCHER, PHUONG_THUC_THANH_TOAN, TRANG_THAI_VOUCHER, TRANG_THAI_KINH_DOANH, TRANG_THAI_HOAT_DONG_CUA_HANG, TRANG_THAI_GIAO_DICH, TRANG_THAI_THANH_TOAN_DON, TRANG_THAI_XU_LY, THU_TU_TRANG_THAI_XU_LY } = require('../constants/trangThai.constant');

const danhGiaVoucher = (voucher, donHang, tongTienHangToanBo, thoiDiem) => {
  if (voucher.loaiVoucher === LOAI_VOUCHER.CUA_HANG && !donHang) {
    return { hopLe: false, lyDo: 'Voucher không áp dụng cho sản phẩm trong giỏ' };
  }
  return kiemTraDieuKienVoucher(voucher, {
    cuaHangId: donHang?.cuaHang._id,
    tongTienHangCuaHang: donHang?.tongTienHang,
    tongTienHangToanBo,
    thoiDiem,
  });
};

const goiYVoucherChoGioHang = async (danhSachDonHang, tongTienHangToanBo, thoiDiem) => {
  const cuaHangIds = danhSachDonHang.map((don) => don.cuaHang._id);
  const danhSach = await Voucher.find({
    trangThai: TRANG_THAI_VOUCHER.KICH_HOAT,
    ngayBatDau: { $lte: thoiDiem }, ngayKetThuc: { $gte: thoiDiem }, soLuong: { $gte: 1 },
    $or: [
      { loaiVoucher: { $in: [LOAI_VOUCHER.TOAN_SAN, LOAI_VOUCHER.FREESHIP] }, cuaHangId: null },
      { loaiVoucher: LOAI_VOUCHER.CUA_HANG, cuaHangId: { $in: cuaHangIds } },
    ],
  }).sort({ ngayKetThuc: 1, _id: 1 }).lean();
  return danhSach.map((voucher) => {
    const donHang = danhSachDonHang.find((don) => String(don.cuaHang._id) === String(voucher.cuaHangId));
    const kiemTra = danhGiaVoucher(voucher, donHang, tongTienHangToanBo, thoiDiem);
    return {
      maVoucher: voucher.maVoucher, tenVoucher: voucher.tenVoucher,
      loaiVoucher: voucher.loaiVoucher, kieuGiam: voucher.kieuGiam,
      giaTriGiam: voucher.giaTriGiam, giamToiDa: voucher.giamToiDa ?? null,
      giaTriDonToiThieu: voucher.giaTriDonToiThieu, cuaHangId: voucher.cuaHangId,
      ngayKetThuc: voucher.ngayKetThuc,
      dapUngDieuKien: kiemTra.hopLe, lyDo: kiemTra.lyDo ?? null,
    };
  });
};

const tinhToanDonHang = async (taiKhoan, { diaChiNhanHang, danhSachMaVoucher = [], phuongThucThanhToan = PHUONG_THUC_THANH_TOAN.VNPAY } = {}) => {
  if (!Object.values(PHUONG_THUC_THANH_TOAN).includes(phuongThucThanhToan)) throw taoLoi(400, 'Phương thức thanh toán không hợp lệ; vui lòng chọn VNPay hoặc COD');
  if (diaChiNhanHang !== undefined && diaChiNhanHang !== null && typeof diaChiNhanHang !== 'string') throw taoLoi(400, 'Địa chỉ nhận hàng phải là chuỗi');
  const diaChi = (diaChiNhanHang ?? taiKhoan.diaChiNhanHang ?? '').trim();
  if (diaChi.length > DO_DAI_TOI_DA.DIA_CHI) throw taoLoi(400, `Địa chỉ nhận hàng không được quá ${DO_DAI_TOI_DA.DIA_CHI} ký tự`);
  if (!Array.isArray(danhSachMaVoucher) || danhSachMaVoucher.some((ma) => typeof ma !== 'string' || ma.trim().length > 100)) {
    throw taoLoi(400, 'Danh sách mã voucher không hợp lệ');
  }
  const cacMa = [...new Set(danhSachMaVoucher.map((ma) => ma.trim().toUpperCase()))];
  if (cacMa.length > SO_VOUCHER_TOI_DA_MOI_LAN) throw taoLoi(400, `Chỉ được chọn tối đa ${SO_VOUCHER_TOI_DA_MOI_LAN} mã voucher`);

  const gioHang = await dungTrangThaiGioHang(taiKhoan._id, { chiDoc: true });
  const cacDong = gioHang.danhSach.filter((dong) => dong.duocChon);
  if (!cacDong.length) throw taoLoi(400, 'Bạn chưa chọn sản phẩm nào để đặt hàng');
  const khongMuaDuoc = cacDong.filter((dong) => !dong.coTheMua);
  if (khongMuaDuoc.length) {
    const chiTiet = khongMuaDuoc.map((dong) => `${dong.sanPham.tenSanPham}: ${dong.lyDoKhongMua}`).join('; ');
    throw taoLoi(409, `${chiTiet}. Vui lòng quay lại giỏ hàng và điều chỉnh`);
  }

  const theoCuaHang = new Map();
  for (const dong of cacDong) {
    const id = String(dong.cuaHang._id);
    if (!theoCuaHang.has(id)) theoCuaHang.set(id, {
      cuaHang: { _id: dong.cuaHang._id, tenCuaHang: dong.cuaHang.tenCuaHang },
      danhSachSanPham: [], tongTienHang: 0, phiVanChuyen: PHI_VAN_CHUYEN_MAC_DINH,
      giamVoucherCuaHang: 0, giamVoucherToanSan: 0, tongGiamVoucher: 0,
      giamPhiVanChuyen: 0, tongThanhToan: 0, tuDongDaThanhToan: false, voucherApDung: [],
    });
    const don = theoCuaHang.get(id);
    const thanhTien = dong.soLuong * dong.sanPham.giaBanThucTe;
    don.danhSachSanPham.push({
      chiTietGioHangId: dong._id,
      sanPham: { _id: dong.sanPham._id, tenSanPham: dong.sanPham.tenSanPham, hinhAnh: dong.sanPham.hinhAnh },
      soLuong: dong.soLuong, giaGoc: dong.sanPham.giaGoc,
      giaBanThucTe: dong.sanPham.giaBanThucTe, thanhTien,
    });
    don.tongTienHang += thanhTien;
  }
  const danhSachDonHang = [...theoCuaHang.values()];
  const tongTienHangToanBo = danhSachDonHang.reduce((tong, don) => tong + don.tongTienHang, 0);
  const thoiDiem = new Date();
  const voucherTheoMa = await Voucher.find({ maVoucher: { $in: cacMa } }).lean();
  const theoMa = new Map(voucherTheoMa.map((voucher) => [voucher.maVoucher, voucher]));
  const daChon = { [LOAI_VOUCHER.TOAN_SAN]: false, [LOAI_VOUCHER.FREESHIP]: false, cuaHang: new Set() };
  const voucherKhongHopLe = [];
  const voucherHopLe = [];
  for (const maVoucher of cacMa) {
    const voucher = theoMa.get(maVoucher);
    if (!voucher) { voucherKhongHopLe.push({ maVoucher, lyDo: 'Mã voucher không tồn tại' }); continue; }
    const don = danhSachDonHang.find((item) => String(item.cuaHang._id) === String(voucher.cuaHangId));
    const ketQua = danhGiaVoucher(voucher, don, tongTienHangToanBo, thoiDiem);
    if (!ketQua.hopLe) { voucherKhongHopLe.push({ maVoucher, lyDo: ketQua.lyDo }); continue; }
    if (voucher.loaiVoucher === LOAI_VOUCHER.CUA_HANG) {
      const id = String(voucher.cuaHangId);
      if (daChon.cuaHang.has(id)) { voucherKhongHopLe.push({ maVoucher, lyDo: 'Mỗi cửa hàng chỉ được dùng một voucher cửa hàng' }); continue; }
      daChon.cuaHang.add(id);
    } else if (daChon[voucher.loaiVoucher]) {
      voucherKhongHopLe.push({ maVoucher, lyDo: `Mỗi lần thanh toán chỉ được dùng một voucher ${voucher.loaiVoucher}` });
      continue;
    } else daChon[voucher.loaiVoucher] = true;
    voucherHopLe.push(voucher);
  }

  const voucherApDung = [];
  const ghiGiam = (voucher, cacPhan) => {
    const tongGiam = cacPhan.reduce((tong, so) => tong + so, 0);
    voucherApDung.push({ maVoucher: voucher.maVoucher, tenVoucher: voucher.tenVoucher, loaiVoucher: voucher.loaiVoucher, giaTriGiamThucTe: tongGiam });
    cacPhan.forEach((so, i) => {
      if (so > 0) danhSachDonHang[i].voucherApDung.push({ voucherId: voucher._id, maVoucher: voucher.maVoucher, loaiVoucher: voucher.loaiVoucher, giaTriGiamThucTe: so });
    });
  };
  for (const voucher of voucherHopLe.filter((item) => item.loaiVoucher === LOAI_VOUCHER.CUA_HANG)) {
    const cacPhan = danhSachDonHang.map((don) => String(don.cuaHang._id) === String(voucher.cuaHangId)
      ? tinhMucGiamVoucher(voucher, don.tongTienHang) : 0);
    cacPhan.forEach((so, i) => { danhSachDonHang[i].giamVoucherCuaHang += so; });
    ghiGiam(voucher, cacPhan);
  }
  const toanSan = voucherHopLe.find((item) => item.loaiVoucher === LOAI_VOUCHER.TOAN_SAN);
  if (toanSan) {
    const trongSo = danhSachDonHang.map((don) => don.tongTienHang - don.giamVoucherCuaHang);
    const coSo = trongSo.reduce((tong, so) => tong + so, 0);
    const cacPhan = phanBoTheoTyLe(tinhMucGiamVoucher(toanSan, coSo), trongSo);
    cacPhan.forEach((so, i) => { danhSachDonHang[i].giamVoucherToanSan = so; });
    ghiGiam(toanSan, cacPhan);
  }
  const freeship = voucherHopLe.find((item) => item.loaiVoucher === LOAI_VOUCHER.FREESHIP);
  if (freeship) {
    const trongSo = danhSachDonHang.map((don) => don.phiVanChuyen);
    const coSo = trongSo.reduce((tong, so) => tong + so, 0);
    const cacPhan = phanBoTheoTyLe(tinhMucGiamVoucher(freeship, coSo), trongSo);
    cacPhan.forEach((so, i) => { danhSachDonHang[i].giamPhiVanChuyen = so; });
    ghiGiam(freeship, cacPhan);
  }
  const tongKet = { tongTienHang: 0, tongGiamVoucher: 0, phiVanChuyen: 0, giamPhiVanChuyen: 0, tongThanhToan: 0 };
  for (const don of danhSachDonHang) {
    don.tongGiamVoucher = don.giamVoucherCuaHang + don.giamVoucherToanSan;
    don.tongThanhToan = don.tongTienHang - don.tongGiamVoucher + don.phiVanChuyen - don.giamPhiVanChuyen;
    for (const ten of Object.keys(tongKet)) tongKet[ten] += don[ten];
  }
  const tuDongToanBo = phuongThucThanhToan === PHUONG_THUC_THANH_TOAN.VNPAY && tongKet.tongThanhToan === 0;
  for (const don of danhSachDonHang) don.tuDongDaThanhToan = tuDongToanBo || (phuongThucThanhToan === PHUONG_THUC_THANH_TOAN.COD && don.tongThanhToan === 0);
  const canhBao = [];
  if (phuongThucThanhToan === PHUONG_THUC_THANH_TOAN.VNPAY && SO_TIEN_VNPAY_TOI_THIEU !== null
      && tongKet.tongThanhToan > 0 && tongKet.tongThanhToan < SO_TIEN_VNPAY_TOI_THIEU) {
    canhBao.push(`Đơn dưới ${SO_TIEN_VNPAY_TOI_THIEU.toLocaleString('vi-VN')}đ không thể thanh toán bằng VNPay. Hãy chọn thanh toán khi nhận hàng (COD) hoặc thêm sản phẩm.`);
  }
  if (danhSachDonHang.some((don) => don.tuDongDaThanhToan)) canhBao.push('Đơn 0đ sẽ được xác nhận thanh toán ngay, không cần qua cổng thanh toán.');
  const voucherGoiY = await goiYVoucherChoGioHang(danhSachDonHang, tongTienHangToanBo, thoiDiem);
  return {
    diaChiNhanHang: diaChi || null, thieuDiaChi: !diaChi, phuongThucThanhToan,
    danhSachDonHang, tongKet, voucherApDung, voucherKhongHopLe, voucherGoiY, canhBao,
  };
};

const xemTruocDonHang = (taiKhoan, body) => {
  if (body === null || (body !== undefined && (typeof body !== 'object' || Array.isArray(body)))) {
    throw taoLoi(400, 'Dữ liệu xem trước đơn hàng không hợp lệ');
  }
  return tinhToanDonHang(taiKhoan, body);
};

const hoanTacTaoDon = async ({ daTruKho, daTruVoucher, giaoDichIds, donHangIds, taiKhoanId, dongGioDaChon }) => {
  const loiHoanTac = [];
  const thu = async (viec) => { try { await viec(); } catch (loi) { loiHoanTac.push(loi); } };
  await thu(() => ApDungVoucher.deleteMany({ donHangId: { $in: donHangIds } }));
  await thu(() => ChiTietDonHang.deleteMany({ donHangId: { $in: donHangIds } }));
  await thu(() => DonHang.deleteMany({ _id: { $in: donHangIds } }));
  await thu(() => GiaoDichThanhToan.deleteMany({ _id: { $in: giaoDichIds } }));
  for (const voucherId of daTruVoucher) await thu(() => Voucher.updateOne({ _id: voucherId }, { $inc: { soLuong: 1 } }));
  for (const { sanPhamId, soLuong } of daTruKho) await thu(() => SanPham.updateOne({ _id: sanPhamId }, { $inc: { soLuongTon: soLuong } }));
  if (dongGioDaChon.length) {
    for (const dong of dongGioDaChon) {
      await thu(() => ChiTietGioHang.updateOne({ _id: dong._id }, { $setOnInsert: dong }, { upsert: true }));
    }
    await thu(() => dungTrangThaiGioHang(taiKhoanId));
  }
  if (loiHoanTac.length) console.error('Hoàn tác tạo đơn chưa hoàn chỉnh:', loiHoanTac.map((loi) => loi.message));
};

const datHang = async (taiKhoan, body = {}) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw taoLoi(400, 'Dữ liệu đặt hàng không hợp lệ');
  const xemTruoc = await tinhToanDonHang(taiKhoan, body);
  if (xemTruoc.thieuDiaChi) throw taoLoi(400, 'Vui lòng nhập địa chỉ nhận hàng');
  if (xemTruoc.voucherKhongHopLe.length) {
    const chiTiet = xemTruoc.voucherKhongHopLe.map((voucher) => `${voucher.maVoucher}: ${voucher.lyDo}`).join('; ');
    const loi = taoLoi(409, `Voucher không hợp lệ (${chiTiet}). Vui lòng xem lại đơn hàng`);
    loi.data = { voucherKhongHopLe: xemTruoc.voucherKhongHopLe };
    throw loi;
  }
  const { phuongThucThanhToan, danhSachDonHang, tongKet, diaChiNhanHang } = xemTruoc;
  if (phuongThucThanhToan === PHUONG_THUC_THANH_TOAN.VNPAY && SO_TIEN_VNPAY_TOI_THIEU !== null
      && tongKet.tongThanhToan > 0 && tongKet.tongThanhToan < SO_TIEN_VNPAY_TOI_THIEU) {
    throw taoLoi(400, `Đơn dưới ${SO_TIEN_VNPAY_TOI_THIEU.toLocaleString('vi-VN')}đ không thể thanh toán bằng VNPay, hãy chọn COD`);
  }

  const gioHang = await GioHang.findOne({ taiKhoanId: taiKhoan._id }).lean();
  const dongIds = danhSachDonHang.flatMap((don) => don.danhSachSanPham.map((item) => item.chiTietGioHangId));
  const dongGioDaChon = await ChiTietGioHang.find({ gioHangId: gioHang?._id, duocChon: true }).lean();
  const theoIdDongGio = new Map(dongGioDaChon.map((dong) => [String(dong._id), dong]));
  if (dongGioDaChon.length !== dongIds.length || danhSachDonHang.some((don) => don.danhSachSanPham.some((item) => {
    const dong = theoIdDongGio.get(String(item.chiTietGioHangId));
    return !dong || dong.soLuong !== item.soLuong || String(dong.sanPhamId) !== String(item.sanPham._id);
  }))) throw taoLoi(409, 'Giỏ hàng vừa thay đổi. Vui lòng xem lại đơn hàng');
  const daTruKho = []; const daTruVoucher = []; const giaoDichIds = []; const donHangIds = [];
  const hoanTac = () => hoanTacTaoDon({ daTruKho, daTruVoucher, giaoDichIds, donHangIds, taiKhoanId: taiKhoan._id, dongGioDaChon });
  try {
    for (const don of danhSachDonHang) {
      const shop = await CuaHang.findOne({ _id: don.cuaHang._id, trangThaiHoatDong: TRANG_THAI_HOAT_DONG_CUA_HANG.HOAT_DONG }).lean();
      if (!shop) throw taoLoi(409, `Cửa hàng ${don.cuaHang.tenCuaHang} đã ngừng hoạt động. Vui lòng xem lại giỏ hàng`);
      for (const item of don.danhSachSanPham) {
        const ketQua = await SanPham.updateOne({ _id: item.sanPham._id, cuaHangId: don.cuaHang._id,
          trangThaiKinhDoanh: TRANG_THAI_KINH_DOANH.DANG_KINH_DOANH, soLuongTon: { $gte: item.soLuong } },
        { $inc: { soLuongTon: -item.soLuong } });
        if (ketQua.modifiedCount !== 1) throw taoLoi(409, `Sản phẩm '${item.sanPham.tenSanPham}' không đủ số lượng hoặc đã ngừng bán. Vui lòng điều chỉnh giỏ hàng`);
        daTruKho.push({ sanPhamId: item.sanPham._id, soLuong: item.soLuong });
      }
    }
    const cacMaVoucher = [...new Set((body.danhSachMaVoucher || []).map((ma) => ma.trim().toUpperCase()))];
    for (const maVoucher of cacMaVoucher) {
      const voucher = await Voucher.findOne({ maVoucher }).lean();
      if (!voucher) throw taoLoi(409, `Voucher '${maVoucher}' không còn tồn tại. Vui lòng xem lại đơn hàng`);
      const ketQua = await Voucher.updateOne({ _id: voucher._id, soLuong: { $gte: 1 }, trangThai: TRANG_THAI_VOUCHER.KICH_HOAT,
        ngayBatDau: { $lte: new Date() }, ngayKetThuc: { $gte: new Date() } }, { $inc: { soLuong: -1 } });
      if (ketQua.modifiedCount !== 1) throw taoLoi(409, `Voucher '${maVoucher}' vừa hết lượt hoặc hết hạn. Vui lòng xem lại đơn hàng`);
      daTruVoucher.push(voucher._id);
    }

    const thoiGian = new Date();
    const taoMotGiaoDich = async (soTien) => {
      const thanhCong = soTien === 0;
      const giaoDich = await taoGiaoDich({ soTien, phuongThucThanhToan,
        trangThaiThanhToan: thanhCong ? TRANG_THAI_GIAO_DICH.THANH_CONG : TRANG_THAI_GIAO_DICH.CHO_THANH_TOAN,
        thoiGianTao: thoiGian, ...(thanhCong ? { thoiGianHoanTat: thoiGian } : {}) });
      giaoDichIds.push(giaoDich._id);
      return giaoDich;
    };
    const giaoDichChung = phuongThucThanhToan === PHUONG_THUC_THANH_TOAN.VNPAY ? await taoMotGiaoDich(tongKet.tongThanhToan) : null;
    const danhSachGiaoDich = giaoDichChung ? [giaoDichChung] : [];
    const donHangDaTao = [];
    for (const don of danhSachDonHang) {
      const giaoDich = giaoDichChung || await taoMotGiaoDich(don.tongThanhToan);
      if (!giaoDichChung) danhSachGiaoDich.push(giaoDich);
      const banGhi = await DonHang.create({
        diaChiNhanHang, tongTienHang: don.tongTienHang, tongGiamVoucher: don.tongGiamVoucher,
        phiVanChuyen: don.phiVanChuyen, giamPhiVanChuyen: don.giamPhiVanChuyen,
        tongThanhToan: don.tongThanhToan, phuongThucThanhToan,
        trangThaiThanhToan: don.tuDongDaThanhToan ? TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN : TRANG_THAI_THANH_TOAN_DON.CHO_THANH_TOAN,
        trangThaiXuLy: TRANG_THAI_XU_LY.CHO_XAC_NHAN, ngayTao: thoiGian,
        taiKhoanId: taiKhoan._id, cuaHangId: don.cuaHang._id, giaoDichId: giaoDich._id,
      });
      donHangIds.push(banGhi._id);
      for (const item of don.danhSachSanPham) {
        await ChiTietDonHang.create({ soLuong: item.soLuong, giaGocTaiThoiDiemDat: item.giaGoc,
          giaBanThucTe: item.giaBanThucTe, thanhTien: item.thanhTien,
          donHangId: banGhi._id, sanPhamId: item.sanPham._id });
      }
      for (const voucher of don.voucherApDung) {
        await ApDungVoucher.create({ voucherId: voucher.voucherId, donHangId: banGhi._id,
          giaTriGiamThucTe: voucher.giaTriGiamThucTe, thoiGianApDung: thoiGian });
      }
      donHangDaTao.push({ _id: banGhi._id, cuaHang: don.cuaHang,
        tongThanhToan: don.tongThanhToan, trangThaiThanhToan: banGhi.trangThaiThanhToan,
        trangThaiXuLy: banGhi.trangThaiXuLy });
    }
    const ketQuaXoa = await ChiTietGioHang.deleteMany({ _id: { $in: dongIds }, gioHangId: gioHang._id, duocChon: true });
    if (ketQuaXoa.deletedCount !== dongIds.length) throw taoLoi(409, 'Giỏ hàng vừa thay đổi. Vui lòng xem lại đơn hàng');
    await dungTrangThaiGioHang(taiKhoan._id);
    const canThanhToanVnpay = phuongThucThanhToan === PHUONG_THUC_THANH_TOAN.VNPAY && tongKet.tongThanhToan > 0;
    return { phuongThucThanhToan, danhSachGiaoDich, danhSachDonHang: donHangDaTao,
      canThanhToanVnpay, ...(canThanhToanVnpay ? { giaoDichVnpayId: giaoDichChung._id } : {}) };
  } catch (loi) {
    await hoanTac();
    throw loi;
  }
};

const tinhHanGuiYeuCau = (donHang) => donHang.trangThaiXuLy === TRANG_THAI_XU_LY.HOAN_THANH
  ? new Date(new Date(donHang.ngayHoanThanh || donHang.ngayTao).getTime() + SO_NGAY_DOI_TRA_TOI_DA * 86400000)
  : null;

const coTheThanhToanLai = (donHang, giaoDich, thoiDiem = new Date()) => Boolean(
  donHang.phuongThucThanhToan === PHUONG_THUC_THANH_TOAN.VNPAY
  && donHang.trangThaiThanhToan === TRANG_THAI_THANH_TOAN_DON.CHO_THANH_TOAN
  && donHang.trangThaiXuLy !== TRANG_THAI_XU_LY.DA_HUY
  && giaoDich?.trangThaiThanhToan === TRANG_THAI_GIAO_DICH.CHO_THANH_TOAN
  && thoiDiem.getTime() < new Date(giaoDich.thoiGianTao).getTime() + THOI_HAN_THANH_TOAN_GIO * 3600000
);

const layKieuHuy = (donHang, giaoDich) => {
  if (donHang.trangThaiXuLy !== TRANG_THAI_XU_LY.CHO_XAC_NHAN) return null;
  if (donHang.trangThaiThanhToan === TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN) return 'huyDonDaThanhToan';
  if (donHang.trangThaiThanhToan !== TRANG_THAI_THANH_TOAN_DON.CHO_THANH_TOAN) return null;
  if (giaoDich?.trangThaiThanhToan !== TRANG_THAI_GIAO_DICH.CHO_THANH_TOAN) return null;
  if (donHang.phuongThucThanhToan === PHUONG_THUC_THANH_TOAN.VNPAY) return 'huyGiaoDichChuaThanhToan';
  if (donHang.phuongThucThanhToan === PHUONG_THUC_THANH_TOAN.COD) return 'huyDonCod';
  return null;
};

const canHoanTienThuCong = (donHang) => Boolean(
  donHang.trangThaiXuLy === TRANG_THAI_XU_LY.DA_HUY
  && donHang.trangThaiThanhToan === TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN
  && donHang.phuongThucThanhToan === PHUONG_THUC_THANH_TOAN.VNPAY
  && donHang.tongThanhToan > 0
);

// Chỉ gọi sau khi chính tiến trình này đã chiếm quyền hủy đơn.
const hoanTonKhoTheoDonHang = async (donHangId) => {
  const chiTiet = await ChiTietDonHang.find({ donHangId }).select('sanPhamId soLuong').lean();
  if (chiTiet.length) await SanPham.bulkWrite(chiTiet.map((dong) => ({
    updateOne: { filter: { _id: dong.sanPhamId }, update: { $inc: { soLuongTon: dong.soLuong } } },
  })));
};

const huyDonHangCuaToi = async (taiKhoanId, id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID đơn hàng không hợp lệ');
  const donHang = await DonHang.findOne({ _id: id, taiKhoanId }).lean();
  if (!donHang) throw taoLoi(404, 'Không tìm thấy đơn hàng');
  if (donHang.trangThaiXuLy !== TRANG_THAI_XU_LY.CHO_XAC_NHAN) {
    throw taoLoi(409, 'Đơn hàng đã được xử lý hoặc đã hủy nên không thể hủy');
  }
  const giaoDich = await GiaoDichThanhToan.findById(donHang.giaoDichId).lean();
  const kieuHuy = layKieuHuy(donHang, giaoDich);
  if (!kieuHuy) throw taoLoi(409, 'Trạng thái thanh toán vừa thay đổi, vui lòng tải lại');

  let soDonBiHuy = 1;
  let thongBao = 'Đã hủy đơn hàng';
  let daChiemQuyen = false;
  try {
    if (kieuHuy === 'huyGiaoDichChuaThanhToan') {
      const giaoDichDaHuy = await GiaoDichThanhToan.findOneAndUpdate(
        { _id: donHang.giaoDichId, phuongThucThanhToan: PHUONG_THUC_THANH_TOAN.VNPAY,
          trangThaiThanhToan: TRANG_THAI_GIAO_DICH.CHO_THANH_TOAN },
        { $set: { trangThaiThanhToan: TRANG_THAI_GIAO_DICH.THAT_BAI, thoiGianHoanTat: new Date() } },
      );
      if (!giaoDichDaHuy) throw taoLoi(409, 'Giao dịch vừa được xử lý (có thể bạn vừa thanh toán), vui lòng tải lại');
      daChiemQuyen = true;
      soDonBiHuy = await DonHang.countDocuments({ giaoDichId: donHang.giaoDichId });
      await huyGiaoDichVaHoanKho(giaoDichDaHuy, TRANG_THAI_GIAO_DICH.THAT_BAI);
      thongBao = `Đã hủy ${soDonBiHuy} đơn trong giao dịch và hoàn lại tồn kho, lượt voucher`;
    } else if (kieuHuy === 'huyDonDaThanhToan') {
      const daHuy = await DonHang.findOneAndUpdate(
        { _id: id, taiKhoanId, trangThaiXuLy: TRANG_THAI_XU_LY.CHO_XAC_NHAN,
          trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN },
        { $set: { trangThaiXuLy: TRANG_THAI_XU_LY.DA_HUY } },
      );
      if (!daHuy) throw taoLoi(409, 'Trạng thái đơn vừa thay đổi, vui lòng tải lại');
      daChiemQuyen = true;
      await hoanTonKhoTheoDonHang(id);
      thongBao = canHoanTienThuCong({ ...donHang, trangThaiXuLy: TRANG_THAI_XU_LY.DA_HUY })
        ? 'Đã hủy đơn hàng. Khoản thanh toán cần được Quản trị viên hoàn thủ công.' : 'Đã hủy đơn hàng và hoàn lại tồn kho';
    } else {
      const daHuy = await DonHang.findOneAndUpdate(
        { _id: id, taiKhoanId, phuongThucThanhToan: PHUONG_THUC_THANH_TOAN.COD,
          trangThaiXuLy: TRANG_THAI_XU_LY.CHO_XAC_NHAN,
          trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.CHO_THANH_TOAN },
        { $set: { trangThaiXuLy: TRANG_THAI_XU_LY.DA_HUY,
          trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.THAT_BAI } },
      );
      if (!daHuy) throw taoLoi(409, 'Trạng thái đơn vừa thay đổi, vui lòng tải lại');
      daChiemQuyen = true;
      const giaoDichDaHuy = await GiaoDichThanhToan.findOneAndUpdate(
        { _id: donHang.giaoDichId, phuongThucThanhToan: PHUONG_THUC_THANH_TOAN.COD,
          trangThaiThanhToan: TRANG_THAI_GIAO_DICH.CHO_THANH_TOAN },
        { $set: { trangThaiThanhToan: TRANG_THAI_GIAO_DICH.THAT_BAI, thoiGianHoanTat: new Date() } },
      );
      if (!giaoDichDaHuy) throw new Error('Không đồng bộ được giao dịch COD sau khi hủy đơn');
      await hoanTonKhoTheoDonHang(id);
      thongBao = 'Đã hủy đơn COD và hoàn lại tồn kho';
    }
  } catch (loi) {
    if (!daChiemQuyen) throw loi;
    console.error('LỖI NGHIÊM TRỌNG: hủy đơn đã chiếm quyền nhưng chưa hoàn tất đồng bộ kho/giao dịch/voucher:', id, loi);
    throw taoLoi(500, 'Hủy đơn chưa hoàn tất đồng bộ. Vui lòng liên hệ Quản trị viên để kiểm tra.');
  }
  const chiTiet = await layChiTietDonHangCuaToi(taiKhoanId, id);
  return { donHang: chiTiet, ketQua: { kieuHuy, soDonBiHuy,
    canHoanTienThuCong: chiTiet.canHoanTienThuCong, thongBao } };
};

const kiemTraBoLocDonHang = ({ trangThaiXuLy, trangThaiThanhToan, phuongThucThanhToan, thanhToanHopLe, trang, gioiHan }) => {
  if (trangThaiXuLy && !Object.values(TRANG_THAI_XU_LY).includes(trangThaiXuLy)) throw taoLoi(400, 'Trạng thái xử lý không hợp lệ');
  if (trangThaiThanhToan && !Object.values(TRANG_THAI_THANH_TOAN_DON).includes(trangThaiThanhToan)) throw taoLoi(400, 'Trạng thái thanh toán không hợp lệ');
  if (phuongThucThanhToan && !Object.values(PHUONG_THUC_THANH_TOAN).includes(phuongThucThanhToan)) throw taoLoi(400, 'Phương thức thanh toán không hợp lệ');
  if (thanhToanHopLe !== undefined && thanhToanHopLe !== 'true') throw taoLoi(400, 'Bộ lọc thanh toán hợp lệ phải là true');
  if ((trang !== undefined && (!/^\d+$/.test(String(trang)) || Number(trang) < 1 || !Number.isSafeInteger(Number(trang))))
      || (gioiHan !== undefined && (!/^\d+$/.test(String(gioiHan)) || Number(gioiHan) < 1 || !Number.isSafeInteger(Number(gioiHan))))) {
    throw taoLoi(400, 'Trang và giới hạn phải là số nguyên dương');
  }
};

const layDanhSachDonHangCuaToi = async (taiKhoanId, query = {}) => {
  kiemTraBoLocDonHang(query);
  const trang = Number(query.trang || 1);
  const gioiHan = Math.min(Number(query.gioiHan || PHAN_TRANG.MAC_DINH), PHAN_TRANG.TOI_DA);
  const dieuKien = { taiKhoanId };
  for (const ten of ['trangThaiXuLy', 'trangThaiThanhToan', 'phuongThucThanhToan']) {
    if (query[ten]) dieuKien[ten] = query[ten];
  }
  if (query.thanhToanHopLe === 'true') {
    dieuKien.$or = [
      { trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN },
      { phuongThucThanhToan: PHUONG_THUC_THANH_TOAN.COD, trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.CHO_THANH_TOAN },
    ];
  }
  const [tongSo, cacDon] = await Promise.all([
    DonHang.countDocuments(dieuKien),
    DonHang.find(dieuKien).sort({ ngayTao: -1, _id: -1 }).skip((trang - 1) * gioiHan).limit(gioiHan)
      .populate('cuaHangId', '_id tenCuaHang').lean(),
  ]);
  const donIds = cacDon.map((don) => don._id);
  const [cacDong, cacGiaoDich] = await Promise.all([
    ChiTietDonHang.find({ donHangId: { $in: donIds } }).select('donHangId sanPhamId soLuong').sort({ _id: 1 }).lean(),
    GiaoDichThanhToan.aggregate([
      { $match: { _id: { $in: cacDon.map((don) => don.giaoDichId) } } },
      // Đếm đơn cùng giao dịch trong truy vấn sẵn có để danh sách không phát sinh N+1.
      { $lookup: { from: 'DonHang', let: { idGiaoDich: '$_id' }, pipeline: [
        { $match: { $expr: { $eq: ['$giaoDichId', '$$idGiaoDich'] } } },
        { $count: 'soDon' },
      ], as: 'thongKeDon' } },
      { $project: { thoiGianTao: 1, trangThaiThanhToan: 1,
        soDon: { $ifNull: [{ $arrayElemAt: ['$thongKeDon.soDon', 0] }, 0] } } },
    ]),
  ]);
  const cacSanPham = await SanPham.find({ _id: { $in: cacDong.map((dong) => dong.sanPhamId) } })
    .select('_id tenSanPham hinhAnh').lean();
  const sanPhamTheoId = new Map(cacSanPham.map((san) => [String(san._id), san]));
  const giaoDichTheoId = new Map(cacGiaoDich.map((gd) => [String(gd._id), gd]));
  const dongTheoDon = new Map();
  for (const dong of cacDong) {
    const id = String(dong.donHangId);
    if (!dongTheoDon.has(id)) dongTheoDon.set(id, []);
    dongTheoDon.get(id).push(dong);
  }
  const danhSach = cacDon.map((don) => {
    const cacDongCuaDon = dongTheoDon.get(String(don._id)) || [];
    const dongDau = cacDongCuaDon[0];
    const sanDau = dongDau && sanPhamTheoId.get(String(dongDau.sanPhamId));
    const giaoDich = giaoDichTheoId.get(String(don.giaoDichId));
    return {
      _id: don._id, ngayTao: don.ngayTao,
      cuaHang: don.cuaHangId && { _id: don.cuaHangId._id, tenCuaHang: don.cuaHangId.tenCuaHang },
      tongThanhToan: don.tongThanhToan, trangThaiThanhToan: don.trangThaiThanhToan,
      trangThaiXuLy: don.trangThaiXuLy, phuongThucThanhToan: don.phuongThucThanhToan,
      soDong: cacDongCuaDon.length,
      sanPhamDau: dongDau ? { tenSanPham: sanDau?.tenSanPham || 'Sản phẩm không còn hiển thị',
        hinhAnh: sanDau?.hinhAnh || [], soLuong: dongDau.soLuong } : null,
      giaoDichId: don.giaoDichId,
      coTheThanhToanLai: coTheThanhToanLai(don, giaoDich),
      coTheHuy: Boolean(layKieuHuy(don, giaoDich)), kieuHuy: layKieuHuy(don, giaoDich),
      soDonSeBiHuy: layKieuHuy(don, giaoDich) === 'huyGiaoDichChuaThanhToan' ? giaoDich.soDon || 1 : 1,
      canHoanTienThuCong: canHoanTienThuCong(don),
    };
  });
  return { danhSach, phanTrang: { trang, gioiHan, tongSo, tongTrang: Math.ceil(tongSo / gioiHan) } };
};

// Dùng chung phần dựng dữ liệu; hàm gọi bên ngoài phải kiểm tra quyền truy cập đơn trước.
const dungChiTietDonHang = async (donHang) => {
  const [cuaHang, giaoDich, cacDong, cacVoucher] = await Promise.all([
    CuaHang.findById(donHang.cuaHangId).select('_id tenCuaHang').lean(),
    GiaoDichThanhToan.findById(donHang.giaoDichId).select('_id maGiaoDich trangThaiThanhToan thoiGianTao').lean(),
    ChiTietDonHang.find({ donHangId: donHang._id }).select('_id sanPhamId soLuong giaGocTaiThoiDiemDat giaBanThucTe thanhTien').sort({ _id: 1 }).lean(),
    ApDungVoucher.find({ donHangId: donHang._id }).select('voucherId giaTriGiamThucTe').lean(),
  ]);
  const dongIds = cacDong.map((dong) => dong._id);
  const [cacSanPham, cacDanhGia, cacYeuCau, voucher] = await Promise.all([
    SanPham.find({ _id: { $in: cacDong.map((dong) => dong.sanPhamId) } }).select('_id tenSanPham hinhAnh').lean(),
    DanhGia.find({ chiTietDonHangId: { $in: dongIds } }).select('chiTietDonHangId').lean(),
    YeuCauDoiTraKhieuNai.find({ chiTietDonHangId: { $in: dongIds } }).select('_id chiTietDonHangId loaiYeuCau trangThaiXuLy ketQuaXuLy').lean(),
    Voucher.find({ _id: { $in: cacVoucher.map((item) => item.voucherId) } }).select('_id maVoucher tenVoucher loaiVoucher').lean(),
  ]);
  const sanTheoId = new Map(cacSanPham.map((item) => [String(item._id), item]));
  const daDanhGia = new Set(cacDanhGia.map((item) => String(item.chiTietDonHangId)));
  const yeuCauTheoDong = new Map(cacYeuCau.map((item) => [String(item.chiTietDonHangId), item]));
  const voucherTheoId = new Map(voucher.map((item) => [String(item._id), item]));
  const hanGuiYeuCau = tinhHanGuiYeuCau(donHang);
  const daHoanThanh = donHang.trangThaiXuLy === TRANG_THAI_XU_LY.HOAN_THANH;
  const hanThanhToan = donHang.phuongThucThanhToan === PHUONG_THUC_THANH_TOAN.VNPAY && giaoDich
    ? new Date(new Date(giaoDich.thoiGianTao).getTime() + THOI_HAN_THANH_TOAN_GIO * 3600000) : null;
  const kieuHuy = layKieuHuy(donHang, giaoDich);
  const soDonSeBiHuy = kieuHuy === 'huyGiaoDichChuaThanhToan'
    ? await DonHang.countDocuments({ giaoDichId: donHang.giaoDichId }) : 1;
  return {
    _id: donHang._id, ngayTao: donHang.ngayTao, ngayHoanThanh: donHang.ngayHoanThanh || null,
    diaChiNhanHang: donHang.diaChiNhanHang, tongTienHang: donHang.tongTienHang,
    tongGiamVoucher: donHang.tongGiamVoucher, phiVanChuyen: donHang.phiVanChuyen,
    giamPhiVanChuyen: donHang.giamPhiVanChuyen, tongThanhToan: donHang.tongThanhToan,
    phuongThucThanhToan: donHang.phuongThucThanhToan,
    trangThaiThanhToan: donHang.trangThaiThanhToan, trangThaiXuLy: donHang.trangThaiXuLy,
    cuaHang, giaoDich, hanThanhToan, coTheThanhToanLai: coTheThanhToanLai(donHang, giaoDich),
    coTheHuy: Boolean(kieuHuy), kieuHuy, soDonSeBiHuy, canHoanTienThuCong: canHoanTienThuCong(donHang),
    hanGuiYeuCau,
    voucherApDung: cacVoucher.map((item) => {
      const v = voucherTheoId.get(String(item.voucherId));
      return { maVoucher: v?.maVoucher || 'Voucher không còn hiển thị', tenVoucher: v?.tenVoucher || 'Voucher không còn hiển thị',
        loaiVoucher: v?.loaiVoucher || null, giaTriGiamThucTe: item.giaTriGiamThucTe };
    }),
    danhSachChiTiet: cacDong.map((dong) => {
      const san = sanTheoId.get(String(dong.sanPhamId));
      const yeuCau = yeuCauTheoDong.get(String(dong._id));
      const daCoDanhGia = daDanhGia.has(String(dong._id));
      return {
        _id: dong._id, soLuong: dong.soLuong, giaGocTaiThoiDiemDat: dong.giaGocTaiThoiDiemDat,
        giaBanThucTe: dong.giaBanThucTe, thanhTien: dong.thanhTien,
        sanPham: san ? { _id: san._id, tenSanPham: san.tenSanPham, hinhAnh: san.hinhAnh } :
          { _id: dong.sanPhamId, tenSanPham: 'Sản phẩm không còn hiển thị', hinhAnh: [] },
        coTheDanhGia: daHoanThanh && !daCoDanhGia, daDanhGia: daCoDanhGia,
        yeuCauDoiTra: yeuCau ? { _id: yeuCau._id, loaiYeuCau: yeuCau.loaiYeuCau,
          trangThaiXuLy: yeuCau.trangThaiXuLy, ketQuaXuLy: yeuCau.ketQuaXuLy || null } : null,
        coTheGuiYeuCau: Boolean(daHoanThanh && hanGuiYeuCau && Date.now() <= hanGuiYeuCau.getTime() && !yeuCau),
      };
    }),
  };
};

const layChiTietDonHangCuaToi = async (taiKhoanId, id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID đơn hàng không hợp lệ');
  const donHang = await DonHang.findOne({ _id: id, taiKhoanId }).lean();
  if (!donHang) throw taoLoi(404, 'Không tìm thấy đơn hàng');
  return dungChiTietDonHang(donHang);
};

const trangThaiTiepTheo = (donHang) => {
  const sanSang = donHang.trangThaiThanhToan === TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN
    || (donHang.phuongThucThanhToan === PHUONG_THUC_THANH_TOAN.COD
      && donHang.trangThaiThanhToan === TRANG_THAI_THANH_TOAN_DON.CHO_THANH_TOAN);
  const viTri = THU_TU_TRANG_THAI_XU_LY.indexOf(donHang.trangThaiXuLy);
  return sanSang && viTri >= 0 ? THU_TU_TRANG_THAI_XU_LY[viTri + 1] || null : null;
};

const nguoiBanLayDanhSachDonHang = async (cuaHang, query = {}) => {
  kiemTraBoLocDonHang(query);
  const trang = Number(query.trang || 1);
  const gioiHan = Math.min(Number(query.gioiHan || PHAN_TRANG.MAC_DINH), PHAN_TRANG.TOI_DA);
  const dieuKien = { cuaHangId: cuaHang._id };
  for (const ten of ['trangThaiXuLy', 'trangThaiThanhToan', 'phuongThucThanhToan']) {
    if (query[ten]) dieuKien[ten] = query[ten];
  }
  if (query.thanhToanHopLe === 'true') dieuKien.$or = [
    { trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN },
    { phuongThucThanhToan: PHUONG_THUC_THANH_TOAN.COD, trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.CHO_THANH_TOAN },
  ];
  const [tongSo, cacDon] = await Promise.all([
    DonHang.countDocuments(dieuKien),
    DonHang.find(dieuKien).sort({ ngayTao: -1, _id: -1 }).skip((trang - 1) * gioiHan).limit(gioiHan).lean(),
  ]);
  const cacDong = await ChiTietDonHang.find({ donHangId: { $in: cacDon.map((don) => don._id) } })
    .select('donHangId sanPhamId soLuong').sort({ _id: 1 }).lean();
  const [cacNguoiMua, cacSanPham] = await Promise.all([
    TaiKhoan.find({ _id: { $in: cacDon.map((don) => don.taiKhoanId) } }).select('hoTen soDienThoai').lean(),
    SanPham.find({ _id: { $in: cacDong.map((dong) => dong.sanPhamId) } }).select('tenSanPham hinhAnh').lean(),
  ]);
  const nguoiMuaTheoId = new Map(cacNguoiMua.map((item) => [String(item._id), item]));
  const sanPhamTheoId = new Map(cacSanPham.map((item) => [String(item._id), item]));
  const dongTheoDon = new Map();
  for (const dong of cacDong) {
    const id = String(dong.donHangId);
    if (!dongTheoDon.has(id)) dongTheoDon.set(id, []);
    dongTheoDon.get(id).push(dong);
  }
  const danhSach = cacDon.map((don) => {
    const nguoiMua = nguoiMuaTheoId.get(String(don.taiKhoanId));
    const cacDongCuaDon = dongTheoDon.get(String(don._id)) || [];
    const dongDau = cacDongCuaDon[0];
    const sanPhamDau = dongDau && sanPhamTheoId.get(String(dongDau.sanPhamId));
    const tiepTheo = trangThaiTiepTheo(don);
    return {
      _id: don._id, ngayTao: don.ngayTao,
      nguoiMua: { hoTen: nguoiMua?.hoTen || 'Người mua', soDienThoai: nguoiMua?.soDienThoai || null },
      tongThanhToan: don.tongThanhToan, phuongThucThanhToan: don.phuongThucThanhToan,
      trangThaiThanhToan: don.trangThaiThanhToan, trangThaiXuLy: don.trangThaiXuLy,
      soDong: cacDongCuaDon.length,
      sanPhamDau: dongDau ? { tenSanPham: sanPhamDau?.tenSanPham || 'Sản phẩm không còn hiển thị',
        hinhAnh: sanPhamDau?.hinhAnh || [], soLuong: dongDau.soLuong } : null,
      trangThaiTiepTheo: tiepTheo, coTheCapNhat: Boolean(tiepTheo),
    };
  });
  return { danhSach, phanTrang: { trang, gioiHan, tongSo, tongTrang: Math.ceil(tongSo / gioiHan) } };
};

const nguoiBanLayChiTietDonHang = async (cuaHang, id) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID đơn hàng không hợp lệ');
  const donHang = await DonHang.findOne({ _id: id, cuaHangId: cuaHang._id }).lean();
  if (!donHang) throw taoLoi(404, 'Không tìm thấy đơn hàng');
  const [chiTiet, nguoiMua] = await Promise.all([
    dungChiTietDonHang(donHang),
    TaiKhoan.findById(donHang.taiKhoanId).select('hoTen soDienThoai').lean(),
  ]);
  const { giaoDich, hanThanhToan, coTheThanhToanLai, hanGuiYeuCau,
    coTheHuy, kieuHuy, soDonSeBiHuy, canHoanTienThuCong: canHoanTien, ...duLieu } = chiTiet;
  const tiepTheo = trangThaiTiepTheo(donHang);
  return { ...duLieu, nguoiMua: { hoTen: nguoiMua?.hoTen || 'Người mua', soDienThoai: nguoiMua?.soDienThoai || null },
    trangThaiTiepTheo: tiepTheo, coTheCapNhat: Boolean(tiepTheo) };
};

const capNhatTrangThaiXuLyDonHang = async (cuaHang, id, trangThaiMoi) => {
  if (!mongoose.isValidObjectId(id)) throw taoLoi(400, 'ID đơn hàng không hợp lệ');
  const donHang = await DonHang.findOne({ _id: id, cuaHangId: cuaHang._id }).lean();
  if (!donHang) throw taoLoi(404, 'Không tìm thấy đơn hàng');
  if (!Object.values(TRANG_THAI_XU_LY).includes(trangThaiMoi)) throw taoLoi(400, 'Trạng thái xử lý không hợp lệ');
  if (trangThaiMoi === TRANG_THAI_XU_LY.DA_HUY) throw taoLoi(409, 'Người bán không thể hủy hoặc từ chối đơn hàng');
  const tiepTheo = trangThaiTiepTheo(donHang);
  if (donHang.trangThaiXuLy === TRANG_THAI_XU_LY.DA_HUY) throw taoLoi(409, 'Đơn hàng đã hủy');
  if (donHang.trangThaiXuLy === TRANG_THAI_XU_LY.HOAN_THANH) throw taoLoi(409, 'Đơn hàng đã hoàn thành');
  if (!tiepTheo) throw taoLoi(409, 'Đơn hàng chưa thanh toán thành công nên chưa thể xử lý');
  if (trangThaiMoi !== tiepTheo) throw taoLoi(409, `Trạng thái không hợp lệ: đơn đang ở '${donHang.trangThaiXuLy}', bước kế tiếp là '${tiepTheo}'`);
  const thoiDiem = new Date();
  const hoanThanh = trangThaiMoi === TRANG_THAI_XU_LY.HOAN_THANH;
  const thuTienCod = hoanThanh && donHang.phuongThucThanhToan === PHUONG_THUC_THANH_TOAN.COD
    && donHang.trangThaiThanhToan === TRANG_THAI_THANH_TOAN_DON.CHO_THANH_TOAN;
  const capNhat = { trangThaiXuLy: trangThaiMoi };
  if (hoanThanh) capNhat.ngayHoanThanh = thoiDiem;
  if (thuTienCod) capNhat.trangThaiThanhToan = TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN;
  const daCapNhat = await DonHang.findOneAndUpdate({ _id: id, cuaHangId: cuaHang._id,
    trangThaiXuLy: donHang.trangThaiXuLy, trangThaiThanhToan: donHang.trangThaiThanhToan,
    $or: [
      { trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.DA_THANH_TOAN },
      { phuongThucThanhToan: PHUONG_THUC_THANH_TOAN.COD, trangThaiThanhToan: TRANG_THAI_THANH_TOAN_DON.CHO_THANH_TOAN },
    ],
  }, { $set: capNhat }, { returnDocument: 'after' }).lean();
  if (!daCapNhat) throw taoLoi(409, 'Trạng thái đơn vừa thay đổi, vui lòng tải lại');
  if (thuTienCod) {
    const dongBo = () => GiaoDichThanhToan.findOneAndUpdate({ _id: donHang.giaoDichId,
      phuongThucThanhToan: PHUONG_THUC_THANH_TOAN.COD,
      trangThaiThanhToan: TRANG_THAI_GIAO_DICH.CHO_THANH_TOAN },
    { $set: { trangThaiThanhToan: TRANG_THAI_GIAO_DICH.THANH_CONG, thoiGianHoanTat: thoiDiem } });
    try { await dongBo(); } catch (loi) {
      try { await dongBo(); } catch (loiThuHai) { console.error('Không đồng bộ được giao dịch COD:', loiThuHai); }
    }
  }
  return nguoiBanLayChiTietDonHang(cuaHang, id);
};

module.exports = { xemTruocDonHang, tinhToanDonHang, goiYVoucherChoGioHang, datHang, hoanTacTaoDon,
  tinhHanGuiYeuCau, dungChiTietDonHang, layDanhSachDonHangCuaToi, layChiTietDonHangCuaToi,
  huyDonHangCuaToi, hoanTonKhoTheoDonHang,
  nguoiBanLayDanhSachDonHang, nguoiBanLayChiTietDonHang, capNhatTrangThaiXuLyDonHang };
