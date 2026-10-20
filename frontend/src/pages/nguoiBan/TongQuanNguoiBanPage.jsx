import { useEffect, useState } from 'react';
import BieuDoDoanhThu from '../../components/thongKe/BieuDoDoanhThu.jsx';
import TheThongKe from '../../components/thongKe/TheThongKe.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { nguoiBanLayTongQuan, nguoiBanLayDoanhThu, nguoiBanLaySanPhamBanChay } from '../../services/thongKe.api.js';
import { dinhDangTien, taoUrlAnh } from '../../utils/dinhDang.js';
import { DUONG_DAN } from '../../utils/hangSo.js';
import './ThongKeNguoiBanPage.css';

const GHI_CHU = 'Doanh thu tính theo các đơn đã hoàn thành, ghi nhận theo ngày hoàn thành; đã gồm phí vận chuyển và không phải lợi nhuận.';

export default function TongQuanNguoiBanPage() {
  const [duLieu, setDuLieu] = useState(null);
  const [loi, setLoi] = useState('');
  const [dangTai, setDangTai] = useState(true);
  const [lanTai, setLanTai] = useState(0);
  useEffect(() => {
    let daHuy = false;
    setDangTai(true); setLoi(''); setDuLieu(null);
    Promise.all([nguoiBanLayTongQuan(), nguoiBanLayDoanhThu(), nguoiBanLaySanPhamBanChay()])
      .then(([tongQuan, doanhThu, banChay]) => { if (!daHuy) setDuLieu({ tongQuan, doanhThu, banChay }); })
      .catch((loiApi) => { if (!daHuy) setLoi(loiApi.message); })
      .finally(() => { if (!daHuy) setDangTai(false); });
    return () => { daHuy = true; };
  }, [lanTai]);
  const tong = duLieu?.tongQuan;
  return <div className="thongKePage">
    <PageHeader title="Tổng quan" description="Kết quả kinh doanh 30 ngày gần nhất của cửa hàng bạn." actions={<Button to={DUONG_DAN.NGUOI_BAN.BAO_CAO}>Xem báo cáo chi tiết</Button>} />
    {loi ? <ErrorState message={loi} taiLai={() => setLanTai((so) => so + 1)} /> : <>
      <div className="thongKeThe">
        <TheThongKe nhan="Doanh thu" giaTri={dinhDangTien(tong?.tongDoanhThu)} dangTai={dangTai} />
        <TheThongKe nhan="Đơn hoàn thành" giaTri={tong?.soDonHoanThanh} dangTai={dangTai} />
        <TheThongKe nhan="Sản phẩm đã bán" giaTri={tong?.soSanPhamDaBan} dangTai={dangTai} />
        <TheThongKe nhan="Đơn chờ xác nhận" giaTri={tong?.soDonChoXacNhan} dangTai={dangTai} nhanManh={tong?.soDonChoXacNhan > 0} den={`${DUONG_DAN.NGUOI_BAN.DON_HANG}?tab=cho-xac-nhan`} />
      </div>
      <p className="thongKeGhiChu">{GHI_CHU}</p>
      {dangTai ? <Skeleton variant="block" count={2} /> : tong?.soDonHoanThanh === 0 ?
        <EmptyState title="Cửa hàng chưa có đơn hoàn thành trong 30 ngày qua" description="Khi đơn hàng hoàn thành, doanh thu và sản phẩm bán chạy sẽ xuất hiện tại đây." actionLabel="Thêm sản phẩm" actionTo={DUONG_DAN.NGUOI_BAN.THEM_SAN_PHAM} /> : <>
          <section className="thongKeKhoi"><div className="thongKeTieuDe"><h2>Doanh thu theo ngày</h2></div><BieuDoDoanhThu duLieu={duLieu.doanhThu.danhSach} /></section>
          <section className="thongKeKhoi"><div className="thongKeTieuDe"><h2>Top 5 sản phẩm bán chạy</h2><Button variant="ghost" to={DUONG_DAN.NGUOI_BAN.BAO_CAO}>Xem báo cáo chi tiết</Button></div><DanhSachBanChay danhSach={duLieu.banChay.danhSach} /></section>
        </>}
    </>}
  </div>;
}

export function DanhSachBanChay({ danhSach }) {
  if (!danhSach.length) return <EmptyState title="Chưa có sản phẩm bán chạy" />;
  return <ol className="thongKeBanChay">{danhSach.map((item, index) => <li key={item.sanPham?._id || index}>
    <span>{index + 1}.</span>
    {taoUrlAnh(item.sanPham?.hinhAnh?.[0]) ? <img src={taoUrlAnh(item.sanPham.hinhAnh[0])} alt="" /> : <span className="thongKeAnhTrong">Chưa có ảnh</span>}
    <span><b>{item.sanPham?.tenSanPham || 'Sản phẩm đã xóa'}</b><small>Đã bán {item.soLuongDaBan} sản phẩm</small></span>
    <strong>{dinhDangTien(item.doanhThu)}</strong>
  </li>)}</ol>;
}
