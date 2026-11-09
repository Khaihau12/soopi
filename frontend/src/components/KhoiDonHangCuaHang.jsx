import { useState } from 'react';
import { dinhDangTien, taoUrlAnh } from '../utils/dinhDang.js';
import ChonVoucher from './ChonVoucher.jsx';

const SO_KY_TU_LOI_NHAN_TOI_DA = 300;

export default function KhoiDonHangCuaHang({ donHang, duLieu, maDaChon, onThayDoi, loiNhan, onDoiLoiNhan, dangTai, dangGui }) {
  const [moGhiChu, setMoGhiChu] = useState(false);
  const idLoiNhan = `loi-nhan-${donHang.cuaHang._id}`;
  return <section className="thanhToanCard"><h2>{donHang.cuaHang.tenCuaHang}</h2>
    <div className="thanhToanDongSanPham">{donHang.danhSachSanPham.map((dong) => <div className="thanhToanSanPham" key={dong.chiTietGioHangId}>
      {taoUrlAnh(dong.sanPham.hinhAnh?.[0]) ? <img src={taoUrlAnh(dong.sanPham.hinhAnh[0])} alt="" /> : <div className="thanhToanAnhTrong">Chưa có ảnh</div>}
      <div><strong>{dong.sanPham.tenSanPham}</strong><small>Số lượng: {dong.soLuong} · Giá bán: {dinhDangTien(dong.giaBanThucTe)}</small>{dong.giaGoc !== dong.giaBanThucTe && <small>Giá gốc: <s>{dinhDangTien(dong.giaGoc)}</s></small>}</div>
      <b>{dinhDangTien(dong.thanhTien)}</b>
    </div>)}</div>
    <div className="thanhToanGhiChuCuaHang">
      <button type="button" className="thanhToanNutGhiChu" aria-expanded={moGhiChu} disabled={dangGui}
        onClick={() => setMoGhiChu((dangMo) => !dangMo)}>
        <span>Ghi chú cho cửa hàng</span><span>{moGhiChu ? 'Thu gọn' : loiNhan.trim() ? 'Sửa' : 'Thêm'}</span>
      </button>
      {moGhiChu ? <div className="thanhToanLoiNhan">
        <label className="chiDocBangManHinh" htmlFor={idLoiNhan}>Ghi chú cho cửa hàng {donHang.cuaHang.tenCuaHang}</label>
        <textarea id={idLoiNhan} rows="2" maxLength={SO_KY_TU_LOI_NHAN_TOI_DA} value={loiNhan}
          onChange={(event) => onDoiLoiNhan(event.target.value)} disabled={dangGui}
          placeholder="Ví dụ: vui lòng đóng gói kỹ" aria-describedby={`${idLoiNhan}-goi-y`} />
        <div id={`${idLoiNhan}-goi-y`} className="thanhToanLoiNhanPhu"><span>Chỉ gửi cho cửa hàng này.</span><span>{loiNhan.length}/{SO_KY_TU_LOI_NHAN_TOI_DA}</span></div>
      </div> : loiNhan.trim() && <p className="thanhToanLoiNhanTomTat">{loiNhan.trim()}</p>}
    </div>
    <ChonVoucher loai="Cửa hàng" cuaHang={donHang.cuaHang} duLieu={duLieu} maDaChon={maDaChon} onThayDoi={onThayDoi} dangTai={dangTai} />
    <div className="thanhToanDongTien"><span>Tiền hàng</span><span>{dinhDangTien(donHang.tongTienHang)}</span></div>
    <div className="thanhToanDongTien"><span>Phí vận chuyển</span><span>{dinhDangTien(donHang.phiVanChuyen)}</span></div>
    {donHang.tongGiamVoucher > 0 && <div className="thanhToanDongTien"><span>Giảm voucher</span><span>−{dinhDangTien(donHang.tongGiamVoucher)}</span></div>}
    {donHang.giamPhiVanChuyen > 0 && <div className="thanhToanDongTien"><span>Giảm phí vận chuyển</span><span>−{dinhDangTien(donHang.giamPhiVanChuyen)}</span></div>}
    <div className="thanhToanDongTien thanhToanTongDon"><strong>Tổng của đơn</strong><strong>{dinhDangTien(donHang.tongThanhToan)}</strong></div>
    {donHang.tuDongDaThanhToan && <p className="thanhToanGhiChu">Đơn 0đ — không cần thanh toán.</p>}
  </section>;
}
