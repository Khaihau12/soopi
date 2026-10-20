import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import NutChuyenTrangThaiDon from '../../components/NutChuyenTrangThaiDon.jsx';
import TrangThaiBadge from '../../components/TrangThaiBadge.jsx';
import Button from '../../components/ui/Button.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import { nguoiBanLayDanhSachDonHang } from '../../services/donHang.api.js';
import { dinhDangNgayGio, dinhDangTien, maDonHangHienThi } from '../../utils/dinhDang.js';
import { DON_HANG_TABS, DUONG_DAN, TRANG_THAI_THANH_TOAN_DON } from '../../utils/hangSo.js';
import './DonHangNguoiBanPage.css';

const TAB_MAC_DINH = 'cho-xac-nhan';

export default function DonHangNguoiBanPage() {
  const [params, setParams] = useSearchParams();
  const tab = DON_HANG_TABS.find((item) => item.value === params.get('tab')) || DON_HANG_TABS.find((item) => item.value === TAB_MAC_DINH);
  const trang = Math.max(1, Number(params.get('trang')) || 1);
  const [duLieu, setDuLieu] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const taiLai = () => setLanTai((lan) => lan + 1);

  useEffect(() => {
    let daHuy = false;
    setDangTai(true); setLoi('');
    nguoiBanLayDanhSachDonHang({ ...tab.query, trang }).then((data) => {
      if (!daHuy) setDuLieu(data);
    }).catch((loiApi) => {
      if (!daHuy) { setDuLieu(null); setLoi(loiApi.message); }
    }).finally(() => { if (!daHuy) setDangTai(false); });
    return () => { daHuy = true; };
  }, [tab.value, trang, lanTai]);

  const cot = [
    { khoa: '_id', tieuDe: 'Mã đơn', render: (id) => <strong>{maDonHangHienThi(id)}</strong> },
    { khoa: 'nguoiMua', tieuDe: 'Người mua', render: (nguoiMua) => <span>{nguoiMua.hoTen}<small className="donHangBanPhu">{nguoiMua.soDienThoai || 'Chưa có số điện thoại'}</small></span> },
    { khoa: 'sanPhamDau', tieuDe: 'Sản phẩm', render: (sanPham, don) => <span>{sanPham?.tenSanPham || 'Không có sản phẩm'}{don.soDong > 1 && <small className="donHangBanPhu">+{don.soDong - 1} dòng khác</small>}</span> },
    { khoa: 'tongThanhToan', tieuDe: 'Tổng', render: (soTien, don) => <span><strong>{dinhDangTien(soTien)}</strong><small className="donHangBanPhu">{don.phuongThucThanhToan === 'COD' ? 'COD — thu tiền khi giao' : 'VNPay'}</small></span> },
    { khoa: 'trangThaiThanhToan', tieuDe: 'Thanh toán', render: (trangThai) => <TrangThaiBadge trangThai={trangThai} /> },
    { khoa: 'trangThaiXuLy', tieuDe: 'Xử lý', render: (trangThai) => <TrangThaiBadge trangThai={trangThai} /> },
    { khoa: 'ngayTao', tieuDe: 'Ngày đặt', render: (ngay) => dinhDangNgayGio(ngay) },
    { khoa: 'thaoTac', tieuDe: 'Thao tác', render: (_, don) => <div className="donHangBanThaoTac"><Button size="sm" variant="secondary" to={DUONG_DAN.NGUOI_BAN.chiTietDonHang(don._id)}>Xem</Button>
      <NutChuyenTrangThaiDon donHang={don} onDaCapNhat={taiLai} onTaiLai={taiLai} />
      {don.phuongThucThanhToan === 'VNPay' && don.trangThaiThanhToan === TRANG_THAI_THANH_TOAN_DON.CHO_THANH_TOAN && <small>Chờ khách thanh toán</small>}</div> },
  ];
  return <div className="donHangBanPage">
    <PageHeader title="Đơn hàng" description="Theo dõi và xử lý đơn của cửa hàng bạn." />
    <Tabs items={DON_HANG_TABS} value={tab.value} onChange={(value) => setParams({ tab: value })} label="Lọc đơn hàng" />
    {dangTai ? <Skeleton variant="block" count={3} /> : loi ? <ErrorState message={loi} taiLai={taiLai} /> : !duLieu?.danhSach.length ?
      <EmptyState title="Chưa có đơn hàng nào ở mục này" description="Đơn phù hợp sẽ xuất hiện tại đây khi người mua đặt hàng." /> : <>
        <DataTable cot={cot} hang={duLieu.danhSach} khoaHang="_id" />
        <Pagination trang={duLieu.phanTrang.trang} tongTrang={duLieu.phanTrang.tongTrang}
          onChange={(soTrang) => setParams({ tab: tab.value, trang: String(soTrang) })} />
      </>}
  </div>;
}
