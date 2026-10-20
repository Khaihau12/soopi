import { useEffect, useState } from 'react';
import BieuDoDoanhThu from '../../components/thongKe/BieuDoDoanhThu.jsx';
import TheThongKe from '../../components/thongKe/TheThongKe.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { quanTriLayTongQuan, quanTriLayDoanhThu, quanTriLaySanPhamBanChay } from '../../services/thongKe.api.js';
import { dinhDangTien, taoUrlAnh } from '../../utils/dinhDang.js';
import { DUONG_DAN } from '../../utils/hangSo.js';
import './ThongKeQuanTriPage.css';

export const GHI_CHU_DOANH_THU = 'Doanh thu tính theo các đơn đã hoàn thành, ghi nhận theo ngày hoàn thành; đã gồm phí vận chuyển và không phải lợi nhuận.';

export function MoTaSoSanh({ giaTri }) {
  if (giaTri === null || giaTri === undefined) return null;
  const nhan = giaTri > 0 ? 'Tăng' : giaTri < 0 ? 'Giảm' : 'Không đổi';
  const phanTram = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.abs(giaTri));
  return <span className={`thongKeQuanTriThayDoi ${giaTri > 0 ? 'thongKeQuanTriThayDoiTang' : giaTri < 0 ? 'thongKeQuanTriThayDoiGiam' : ''}`}>{nhan} {phanTram}% so với kỳ trước</span>;
}

export function DanhSachSanPhamBanChay({ danhSach }) {
  if (!danhSach.length) return <EmptyState title="Chưa có sản phẩm bán chạy trong kỳ này" />;
  return <ol className="thongKeQuanTriDanhSach">{danhSach.map((item, index) => <li key={item.sanPham._id}>
    <span>{index + 1}.</span>
    {taoUrlAnh(item.sanPham.hinhAnh?.[0]) ? <img src={taoUrlAnh(item.sanPham.hinhAnh[0])} alt="" /> : <span className="thongKeQuanTriAnhTrong">Chưa có ảnh</span>}
    <span><b>{item.sanPham.tenSanPham}</b><small>{item.cuaHang.tenCuaHang} · Đã bán {item.soLuongDaBan}</small></span>
    <strong>{dinhDangTien(item.doanhThu)}</strong>
  </li>)}</ol>;
}

export default function TongQuanQuanTriPage() {
  const [duLieu, setDuLieu] = useState(null);
  const [loi, setLoi] = useState('');
  const [dangTai, setDangTai] = useState(true);
  const [lanTai, setLanTai] = useState(0);
  useEffect(() => {
    let daHuy = false;
    setDangTai(true); setLoi(''); setDuLieu(null);
    Promise.all([quanTriLayTongQuan(), quanTriLayDoanhThu(), quanTriLaySanPhamBanChay()])
      .then(([tongQuan, doanhThu, sanPham]) => { if (!daHuy) setDuLieu({ tongQuan, doanhThu, sanPham }); })
      .catch((loiApi) => { if (!daHuy) setLoi(loiApi.message); })
      .finally(() => { if (!daHuy) setDangTai(false); });
    return () => { daHuy = true; };
  }, [lanTai]);
  const tong = duLieu?.tongQuan;
  return <div className="thongKePage">
    <PageHeader title="Tổng quan hệ thống" description="Doanh thu 30 ngày gần nhất và số liệu hiện tại của Soopi." actions={<Button to={DUONG_DAN.QUAN_TRI_VIEN.BAO_CAO}>Xem báo cáo chi tiết</Button>} />
    {loi ? <ErrorState message={loi} taiLai={() => setLanTai((so) => so + 1)} /> : <>
      <div className="thongKeThe thongKeQuanTriThe">
        <TheThongKe nhan="Doanh thu" giaTri={dinhDangTien(tong?.tongDoanhThu)} chuThich={<MoTaSoSanh giaTri={tong?.soVoiKyTruoc.doanhThu} />} dangTai={dangTai} />
        <TheThongKe nhan="Đơn hoàn thành" giaTri={tong?.soDonHoanThanh} chuThich={<MoTaSoSanh giaTri={tong?.soVoiKyTruoc.soDonHoanThanh} />} dangTai={dangTai} />
        <TheThongKe nhan="Người dùng" giaTri={tong?.soNguoiDung} dangTai={dangTai} />
        <TheThongKe nhan="Người bán" giaTri={tong?.soNguoiBan} chuThich={tong ? `${tong.soCuaHang} cửa hàng` : ''} dangTai={dangTai} />
        <TheThongKe nhan="Sản phẩm" giaTri={tong?.soSanPham} chuThich={tong ? `${tong.soSanPhamDangKinhDoanh} đang kinh doanh` : ''} dangTai={dangTai} />
        <TheThongKe nhan="Yêu cầu chờ duyệt" giaTri={tong?.soYeuCauChoDuyet} den={DUONG_DAN.QUAN_TRI_VIEN.DUYET_NGUOI_BAN} nhanManh={tong?.soYeuCauChoDuyet > 0} dangTai={dangTai} />
      </div>
      <p className="thongKeGhiChu">{GHI_CHU_DOANH_THU}</p>
      {dangTai ? <Skeleton variant="block" count={2} /> : <>
        <section className="thongKeKhoi"><div className="thongKeTieuDe"><h2>Doanh thu theo ngày</h2></div>{tong.soDonHoanThanh ? <BieuDoDoanhThu duLieu={duLieu.doanhThu.danhSach} /> : <EmptyState title="Chưa có đơn hoàn thành trong 30 ngày qua" />}</section>
        <section className="thongKeKhoi"><div className="thongKeTieuDe"><h2>Top 5 sản phẩm bán chạy</h2><Button variant="ghost" to={DUONG_DAN.QUAN_TRI_VIEN.BAO_CAO}>Xem báo cáo chi tiết</Button></div><DanhSachSanPhamBanChay danhSach={duLieu.sanPham.danhSach} /></section>
      </>}
    </>}
  </div>;
}
