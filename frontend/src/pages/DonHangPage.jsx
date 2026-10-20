import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DonHangCard from '../components/DonHangCard.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import useThanhToanVnpay from '../hooks/useThanhToanVnpay.js';
import useThongBao from '../hooks/useThongBao.js';
import { huyDonHang, layDanhSachDonHang } from '../services/donHang.api.js';
import { DON_HANG_TABS, DUONG_DAN } from '../utils/hangSo.js';
import { noiDungXacNhanHuyDon } from '../utils/huyDonHang.js';
import './DonHangPage.css';

export default function DonHangPage() {
  const [thamSo, setThamSo] = useSearchParams();
  const tab = DON_HANG_TABS.find((item) => item.value === thamSo.get('tab')) || DON_HANG_TABS[0];
  const trang = Math.max(1, Number(thamSo.get('trang')) || 1);
  const [duLieu, setDuLieu] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const [donCanHuy, setDonCanHuy] = useState(null);
  const [dangHuy, setDangHuy] = useState(false);
  const thongBao = useThongBao();
  const { thanhToan, dangChuyen, loi: loiThanhToan } = useThanhToanVnpay();

  useEffect(() => {
    let daHuy = false;
    setDangTai(true); setLoi('');
    layDanhSachDonHang({ ...tab.query, trang }).then((data) => {
      if (!daHuy) setDuLieu(data);
    }).catch((loiApi) => {
      if (!daHuy) { setDuLieu(null); setLoi(loiApi.message); }
    }).finally(() => { if (!daHuy) setDangTai(false); });
    return () => { daHuy = true; };
  }, [tab.value, trang, lanTai]);

  const chonTab = (value) => setThamSo(value === DON_HANG_TABS[0].value ? {} : { tab: value });
  const chonTrang = (soTrang) => setThamSo({ ...(tab.value !== DON_HANG_TABS[0].value ? { tab: tab.value } : {}), trang: String(soTrang) });

  const xacNhanHuy = async () => {
    if (!donCanHuy || dangHuy) return;
    setDangHuy(true);
    try {
      const data = await huyDonHang(donCanHuy._id);
      thongBao.thanhCong(data.ketQua.thongBao);
      setDonCanHuy(null);
      setLanTai((lan) => lan + 1);
    } catch (loiApi) {
      thongBao.loi(loiApi.message);
      if (loiApi.status === 409) { setDonCanHuy(null); setLanTai((lan) => lan + 1); }
    } finally { setDangHuy(false); }
  };

  return <div className="donHangPage">
    <PageHeader title="Đơn hàng của tôi" description="Xem lịch sử và theo dõi trạng thái từng đơn hàng." />
    <Tabs items={DON_HANG_TABS} value={tab.value} onChange={chonTab} label="Lọc đơn hàng" />
    {loiThanhToan && <p className="donHangLoiThanhToan" role="alert">{loiThanhToan}</p>}
    {dangChuyen && <div className="donHangLopPhu" role="status" aria-live="polite">Đang chuyển tới VNPay…</div>}
    {dangTai ? <Skeleton variant="block" count={3} /> : loi ? <ErrorState message={loi} taiLai={() => setLanTai((lan) => lan + 1)} /> :
      duLieu?.danhSach.length ? <>
        <div className="donHangDanhSach">{duLieu.danhSach.map((don) => <DonHangCard key={don._id} donHang={don} onThanhToan={thanhToan} dangChuyen={dangChuyen} onHuy={setDonCanHuy} dangHuy={dangHuy} />)}</div>
        <Pagination trang={duLieu.phanTrang.trang} tongTrang={duLieu.phanTrang.tongTrang} onChange={chonTrang} />
      </> : <EmptyState icon="package" title={tab.value === 'tat-ca' ? 'Bạn chưa có đơn hàng nào' : 'Chưa có đơn hàng ở trạng thái này'}
        description="Khám phá các sản phẩm đang bán trên Soopi." actionLabel="Xem sản phẩm" actionTo={DUONG_DAN.SAN_PHAM} />}
    <ConfirmDialog open={Boolean(donCanHuy)} onClose={() => setDonCanHuy(null)} onConfirm={xacNhanHuy}
      title="Xác nhận hủy đơn" message={donCanHuy ? noiDungXacNhanHuyDon(donCanHuy) : ''}
      confirmLabel="Hủy đơn" cancelLabel="Giữ đơn" danger loading={dangHuy} />
  </div>;
}
