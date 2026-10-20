import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import KhoiDiaChiNhanHang from '../components/KhoiDiaChiNhanHang.jsx';
import KhoiDonHangCuaHang from '../components/KhoiDonHangCuaHang.jsx';
import KhoiVoucher from '../components/KhoiVoucher.jsx';
import TongKetThanhToan from '../components/TongKetThanhToan.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Button from '../components/ui/Button.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import { useXacThuc } from '../hooks/XacThucContext.jsx';
import { useGioHang } from '../hooks/GioHangContext.jsx';
import useThongBao from '../hooks/useThongBao.js';
import { xemTruocDonHang, datHang } from '../services/donHang.api.js';
import { taoThanhToanVnpay } from '../services/giaoDichThanhToan.api.js';
import { DUONG_DAN } from '../utils/hangSo.js';
import './ThanhToanPage.css';

export default function ThanhToanPage() {
  const navigate = useNavigate();
  const thongBao = useThongBao();
  const { taiLai: taiLaiGio } = useGioHang();
  const { taiKhoan } = useXacThuc();
  const diaChiHoSo = taiKhoan?.diaChiNhanHang?.trim() || '';
  const [kieuDiaChi, setKieuDiaChi] = useState(diaChiHoSo ? 'ho-so' : 'khac');
  const [diaChiKhac, setDiaChiKhac] = useState('');
  const [maDaChon, setMaDaChon] = useState([]);
  const [phuongThuc, setPhuongThuc] = useState('VNPay');
  const [duLieu, setDuLieu] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [maLoi, setMaLoi] = useState(0);
  const [dangGui, setDangGui] = useState(false);
  const [dangChuyenVnpay, setDangChuyenVnpay] = useState(false);
  const [giaoDichCanThuLai, setGiaoDichCanThuLai] = useState(null);
  const [ketQuaDaTao, setKetQuaDaTao] = useState(null);
  const dangGuiRef = useRef(false);
  const textareaRef = useRef(null);
  const lanYeuCau = useRef(0);
  const hienTai = useRef({ diaChiNhanHang: undefined, danhSachMaVoucher: [], phuongThucThanhToan: 'VNPay' });

  const taiLai = async (body = hienTai.current) => {
    hienTai.current = body;
    const lan = ++lanYeuCau.current;
    setDangTai(true); setLoi('');
    try {
      const data = await xemTruocDonHang(body);
      if (lanYeuCau.current !== lan) return;
      setDuLieu(data);
      if (data.voucherKhongHopLe.length) {
        const maSai = new Set(data.voucherKhongHopLe.map((voucher) => voucher.maVoucher));
        const conHopLe = body.danhSachMaVoucher.filter((ma) => !maSai.has(ma));
        setMaDaChon(conHopLe);
        hienTai.current = { ...body, danhSachMaVoucher: conHopLe };
      }
    } catch (loiApi) { if (lanYeuCau.current === lan) { setDuLieu(null); setLoi(loiApi.message); setMaLoi(loiApi.status); } }
    finally { if (lanYeuCau.current === lan) setDangTai(false); }
  };
  useEffect(() => { taiLai(); return () => { lanYeuCau.current += 1; }; }, []);
  const doiDiaChi = (giaTri) => taiLai({ ...hienTai.current, diaChiNhanHang: giaTri });
  const doiVoucher = (danhSachMaVoucher) => { setMaDaChon(danhSachMaVoucher); taiLai({ ...hienTai.current, danhSachMaVoucher }); };
  const doiPhuongThuc = (phuongThucThanhToan) => { setPhuongThuc(phuongThucThanhToan); taiLai({ ...hienTai.current, phuongThucThanhToan }); };

  const thuMoVnpay = async (giaoDichId) => {
    try {
      setDangChuyenVnpay(true);
      const { duongDanThanhToan } = await taoThanhToanVnpay(giaoDichId);
      window.location.assign(duongDanThanhToan);
    } catch (loiApi) {
      setDangChuyenVnpay(false);
      setGiaoDichCanThuLai(giaoDichId);
      thongBao.loi(loiApi.message);
    }
  };

  const guiDatHang = async () => {
    if (dangGuiRef.current || dangTai || !duLieu || giaoDichCanThuLai) return;
    if (!(kieuDiaChi === 'khac' ? diaChiKhac.trim() : diaChiHoSo)) { setKieuDiaChi('khac'); requestAnimationFrame(() => textareaRef.current?.focus()); return; }
    dangGuiRef.current = true;
    setDangGui(true);
    try {
      const ketQua = await datHang({
        diaChiNhanHang: kieuDiaChi === 'khac' ? diaChiKhac : undefined,
        danhSachMaVoucher: maDaChon,
        phuongThucThanhToan: phuongThuc,
      });
      setKetQuaDaTao(ketQua);
      taiLaiGio().catch(() => {});
      if (ketQua.canThanhToanVnpay) {
        setGiaoDichCanThuLai(ketQua.giaoDichVnpayId);
        await thuMoVnpay(ketQua.giaoDichVnpayId);
      } else {
        thongBao.thanhCong(ketQua.danhSachGiaoDich.every((gd) => gd.soTien === 0)
          ? 'Đặt hàng thành công. Đơn 0đ đã được xác nhận thanh toán.'
          : 'Đặt hàng thành công. Bạn sẽ thanh toán khi nhận hàng.');
        navigate(DUONG_DAN.DON_HANG, { state: { ketQuaDatHang: ketQua } });
      }
    } catch (loiApi) {
      thongBao.loi(loiApi.message);
      if (loiApi.status === 409) taiLai();
      if (loiApi.status === 400 && /địa chỉ/i.test(loiApi.message)) {
        setKieuDiaChi('khac'); requestAnimationFrame(() => textareaRef.current?.focus());
      }
    } finally {
      dangGuiRef.current = false;
      setDangGui(false);
    }
  };

  const khongTheDat = dangTai || dangGui || dangChuyenVnpay || !!giaoDichCanThuLai || !duLieu || !(kieuDiaChi === 'khac' ? diaChiKhac.trim() : diaChiHoSo)
    || duLieu.voucherKhongHopLe.length > 0
    || duLieu.canhBao.some((noiDung) => noiDung.includes('không thể thanh toán bằng VNPay'));

  return <div className="thanhToanPage"><header><Link to={DUONG_DAN.GIO_HANG}>Quay lại giỏ hàng</Link><h1>Đặt hàng</h1><p>Kiểm tra địa chỉ, voucher và tổng tiền trước khi đặt hàng.</p></header>
    {dangChuyenVnpay && <div className="thanhToanLopPhu" role="status" aria-live="polite">Đang chuyển tới VNPay…</div>}
    {giaoDichCanThuLai && !dangChuyenVnpay && <div className="thanhToanCanhBao" role="alert">Đơn hàng đã được tạo nhưng chưa thể mở cổng thanh toán. <button type="button" onClick={() => thuMoVnpay(giaoDichCanThuLai)}>Thử lại</button> <Link to={DUONG_DAN.DON_HANG} state={{ ketQuaDatHang: ketQuaDaTao }}>Xem đơn hàng</Link></div>}
    {dangTai && !duLieu ? <Skeleton variant="block" count={3} /> : loi && !duLieu ? <div className="thanhToanTrangLoi"><ErrorState message={loi} />{[400, 409].includes(maLoi) ? <Button to={DUONG_DAN.GIO_HANG} variant="secondary">Quay lại giỏ hàng</Button> : <Button variant="secondary" onClick={() => taiLai()}>Thử lại</Button>}</div> : duLieu && <div className="thanhToanBoCuc">
      <div className="thanhToanCotChinh">
        {loi && <div className="thanhToanCanhBao" role="alert">{loi} <button type="button" onClick={() => taiLai()}>Thử lại</button></div>}
        <KhoiDiaChiNhanHang diaChiHoSo={diaChiHoSo} kieuDiaChi={kieuDiaChi} setKieuDiaChi={setKieuDiaChi} diaChiKhac={diaChiKhac} setDiaChiKhac={setDiaChiKhac} onThayDoi={doiDiaChi} thieuDiaChi={duLieu.thieuDiaChi} textareaRef={textareaRef} />
        {duLieu.danhSachDonHang.length > 1 && <p className="thanhToanGhiChu">Giỏ có nhiều cửa hàng nên được tách thành nhiều đơn.</p>}
        {duLieu.danhSachDonHang.map((don) => <KhoiDonHangCuaHang key={don.cuaHang._id} donHang={don} duLieu={duLieu} maDaChon={maDaChon} onThayDoi={doiVoucher} dangTai={dangTai} />)}
        <section className="thanhToanCard"><h2>Phương thức thanh toán</h2>
          <label className="thanhToanLuaChon"><input type="radio" name="phuongThuc" checked={phuongThuc === 'VNPay'} onChange={() => doiPhuongThuc('VNPay')} /><span>Thanh toán qua VNPay</span></label>
          <label className="thanhToanLuaChon"><input type="radio" name="phuongThuc" checked={phuongThuc === 'COD'} onChange={() => doiPhuongThuc('COD')} /><span>Thanh toán khi nhận hàng (COD)</span></label>
          {duLieu.danhSachDonHang.some((don) => don.tuDongDaThanhToan) ? <p className="thanhToanGhiChu">Đơn 0đ — không cần thanh toán.</p> : phuongThuc === 'COD' ? <p className="thanhToanGhiChu">Bạn thanh toán bằng tiền mặt khi nhận hàng. Đơn được chuyển cho người bán xử lý ngay.</p> : null}
        </section>
      </div>
      <div className="thanhToanCotPhu"><KhoiVoucher duLieu={duLieu} maDaChon={maDaChon} onThayDoi={doiVoucher} dangTai={dangTai} />
        {duLieu.canhBao.map((noiDung) => <p className="thanhToanCanhBao thanhToanCanhBaoMobile" role="status" key={noiDung}>{noiDung}</p>)}
        <TongKetThanhToan tongKet={duLieu.tongKet} canhBao={duLieu.canhBao} dangTai={dangTai} dangGui={dangGui} khongTheDat={khongTheDat} onDatHang={guiDatHang} phuongThucThanhToan={phuongThuc} />
      </div>
    </div>}
  </div>;
}
