import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import GiaTien from '../components/GiaTien.jsx';
import Button from '../components/ui/Button.jsx';
import QuantityInput from '../components/ui/QuantityInput.jsx';
import VoucherChip from '../components/VoucherChip.jsx';
import ThuVienAnh from '../components/ThuVienAnh.jsx';
import KhoiDanhGiaSanPham from '../components/KhoiDanhGiaSanPham.jsx';
import SaoDanhGia from '../components/SaoDanhGia.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import { layChiTietSanPham } from '../services/sanPham.api.js';
import { layDanhSachVoucherDangDung } from '../services/voucher.api.js';
import { dinhDangNgayGio } from '../utils/dinhDang.js';
import { DUONG_DAN } from '../utils/hangSo.js';
import { useXacThuc } from '../hooks/XacThucContext.jsx';
import { useGioHang } from '../hooks/GioHangContext.jsx';
import useThongBao from '../hooks/useThongBao.js';
import './ChiTietSanPhamPage.css';

export default function ChiTietSanPhamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { taiKhoan } = useXacThuc();
  const { themVaoGio } = useGioHang();
  const thongBao = useThongBao();
  const [soLuongMua, setSoLuongMua] = useState(1);
  const [dangThem, setDangThem] = useState(false);
  const [daThem, setDaThem] = useState(false);
  const [sanPham, setSanPham] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const [voucher, setVoucher] = useState([]);
  const [loiVoucher, setLoiVoucher] = useState('');
  const [lanTaiVoucher, setLanTaiVoucher] = useState(0);

  useEffect(() => { setSoLuongMua(1); setDaThem(false); }, [id]);

  const themGio = async () => {
    if (!taiKhoan) { navigate(DUONG_DAN.DANG_NHAP, { state: { quayLai: DUONG_DAN.chiTietSanPham(id) } }); return; }
    if (dangThem) return;
    setDangThem(true); setDaThem(false);
    try { await themVaoGio(id, soLuongMua); thongBao.thanhCong('Đã thêm vào giỏ hàng'); setDaThem(true); }
    catch (loiApi) { thongBao.loi(loiApi.message); }
    finally { setDangThem(false); }
  };

  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true);
    setLoi('');
    layChiTietSanPham(id).then((data) => {
      if (conHieuLuc) setSanPham(data.sanPham);
    }).catch((loiApi) => {
      if (conHieuLuc) setLoi(loiApi.status === 404 ? 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.' : loiApi.message);
    }).finally(() => {
      if (conHieuLuc) setDangTai(false);
    });
    return () => { conHieuLuc = false; };
  }, [id, lanTai]);

  useEffect(() => {
    if (!sanPham?.cuaHang?._id) { setVoucher([]); return undefined; }
    let conHieuLuc = true;
    setVoucher([]);
    setLoiVoucher('');
    layDanhSachVoucherDangDung({ cuaHangId: sanPham.cuaHang._id })
      .then((data) => { if (conHieuLuc) setVoucher(data.danhSach); })
      .catch(() => { if (conHieuLuc) { setVoucher([]); setLoiVoucher('Không tải được voucher.'); } });
    return () => { conHieuLuc = false; };
  }, [sanPham?.cuaHang?._id, lanTaiVoucher]);

  if (dangTai) return <div className="chiTietSanPhamDangTai" aria-busy="true"><Skeleton variant="block" count={3} /></div>;
  if (loi) return <div className="chiTietSanPhamLoi"><ErrorState message={loi} taiLai={() => setLanTai((lan) => lan + 1)} /><Link to={DUONG_DAN.SAN_PHAM}>Về danh sách sản phẩm</Link></div>;
  if (!sanPham) return null;
  const khuyenMai = sanPham.khuyenMaiApDung;
  const duongDanChat = `${DUONG_DAN.TRO_CHUYEN}?cuaHangId=${sanPham.cuaHang?._id}`;
  const laCuaHangCuaToi = taiKhoan && String(taiKhoan._id) === String(sanPham.cuaHang?.taiKhoanId);

  return <article className="chiTietSanPhamPage">
    <div className="chiTietSanPhamChinh">
      <ThuVienAnh hinhAnh={sanPham.hinhAnh} tenSanPham={sanPham.tenSanPham} />
      <div className="chiTietSanPhamThongTin"><p className="chiTietSanPhamDanhMuc">{sanPham.danhMuc?.tenDanhMuc || 'Sản phẩm'}</p><h1>{sanPham.tenSanPham}</h1><GiaTien giaGoc={sanPham.giaGoc} giaBanThucTe={sanPham.giaBanThucTe} kichThuoc="lon" />
        <a className="chiTietSanPhamDanhGia" href="#danh-gia"><SaoDanhGia giaTri={sanPham.thongKeDanhGia?.diemTrungBinh || 0} />
          <span>{sanPham.thongKeDanhGia?.diemTrungBinh || 0}/5 · {sanPham.thongKeDanhGia?.soDanhGia || 0} đánh giá</span></a>
        {khuyenMai && <p className="chiTietSanPhamKhuyenMai">{khuyenMai.loaiKhuyenMai} · {khuyenMai.tenKhuyenMai} · kết thúc lúc {dinhDangNgayGio(khuyenMai.ngayKetThuc)}</p>}
        {voucher.length > 0 && <section className="chiTietSanPhamVoucher" aria-label="Voucher đang dùng được"><h2>Voucher</h2><div className="chiTietSanPhamVoucherScroll">{voucher.map((muc) => <VoucherChip key={muc.maVoucher} voucher={muc} />)}</div></section>}
        {loiVoucher && <p role="alert" className="chiTietSanPhamVoucherLoi">{loiVoucher} <button type="button" onClick={() => setLanTaiVoucher((lan) => lan + 1)}>Thử lại</button></p>}
        <p className={sanPham.soLuongTon === 0 ? 'chiTietSanPhamHetHang' : 'chiTietSanPhamConHang'}>{sanPham.soLuongTon === 0 ? 'Hết hàng' : `Còn ${sanPham.soLuongTon} sản phẩm`}</p>
        <div className="chiTietSanPhamMua"><QuantityInput value={soLuongMua} max={Math.max(1, sanPham.soLuongTon)} disabled={sanPham.soLuongTon === 0 || dangThem} onChange={setSoLuongMua} /><Button disabled={sanPham.soLuongTon === 0} loading={dangThem} onClick={themGio}>{sanPham.soLuongTon === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}</Button>{daThem && <Link to={DUONG_DAN.GIO_HANG}>Xem giỏ hàng</Link>}</div>
        <div className="chiTietSanPhamCuaHang"><h2>Cửa hàng</h2><strong>{sanPham.cuaHang?.tenCuaHang}</strong>{sanPham.cuaHang?.diaChi && <p>{sanPham.cuaHang.diaChi}</p>}
          {sanPham.cuaHang?._id && !laCuaHangCuaToi && <Button variant="secondary" to={taiKhoan ? duongDanChat : DUONG_DAN.DANG_NHAP}
            state={taiKhoan ? { tenCuaHang: sanPham.cuaHang.tenCuaHang } : { quayLai: duongDanChat }}>Chat với cửa hàng</Button>}</div>
      </div>
    </div>
    <section className="chiTietSanPhamMoTa"><h2>Mô tả sản phẩm</h2><p>{sanPham.moTa || 'Chưa có mô tả sản phẩm.'}</p></section>
    <KhoiDanhGiaSanPham sanPhamId={sanPham._id} onThongKe={(thongKe) => setSanPham((hienTai) => hienTai?._id === sanPham._id
      ? { ...hienTai, thongKeDanhGia: { diemTrungBinh: thongKe.diemTrungBinh, soDanhGia: thongKe.soDanhGia } } : hienTai)} />
  </article>;
}
