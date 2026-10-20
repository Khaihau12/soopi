import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BieuDoDoanhThu from '../../components/thongKe/BieuDoDoanhThu.jsx';
import BoChonKhoangThoiGian, { cacMoc } from '../../components/thongKe/BoChonKhoangThoiGian.jsx';
import TheThongKe from '../../components/thongKe/TheThongKe.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import TrangThaiBadge from '../../components/TrangThaiBadge.jsx';
import { nguoiBanLayTongQuan, nguoiBanLayDoanhThu, nguoiBanLaySanPhamBanChay, nguoiBanLayLichSuGiaoDich } from '../../services/thongKe.api.js';
import { dinhDangNgayGio, dinhDangTien } from '../../utils/dinhDang.js';
import { DanhSachBanChay } from './TongQuanNguoiBanPage.jsx';
import './ThongKeNguoiBanPage.css';

const GHI_CHU = 'Doanh thu tính theo các đơn đã hoàn thành, ghi nhận theo ngày hoàn thành; đã gồm phí vận chuyển và không phải lợi nhuận.';

export default function BaoCaoNguoiBanPage() {
  const [params, setParams] = useSearchParams();
  const macDinh = cacMoc('30-ngay');
  const tuNgay = params.get('tuNgay') || macDinh.tuNgay;
  const denNgay = params.get('denNgay') || macDinh.denNgay;
  const nhom = params.get('nhom') || 'ngay';
  const trang = Number(params.get('trang')) || 1;
  const [duLieu, setDuLieu] = useState(null);
  const [loi, setLoi] = useState('');
  const [dangTai, setDangTai] = useState(true);
  const [lanTai, setLanTai] = useState(0);
  const [chiSo, setChiSo] = useState('doanhThu');
  const [kieu, setKieu] = useState('cot');
  const doiParams = (moi, xoaTrang = false) => {
    const next = new URLSearchParams(params);
    Object.entries(moi).forEach(([ten, giaTri]) => next.set(ten, giaTri));
    if (xoaTrang) next.delete('trang');
    setParams(next);
  };

  useEffect(() => {
    let daHuy = false;
    setDangTai(true); setLoi(''); setDuLieu(null);
    const ngay = { tuNgay, denNgay };
    Promise.all([
      nguoiBanLayTongQuan(ngay), nguoiBanLayDoanhThu({ ...ngay, nhom }),
      nguoiBanLaySanPhamBanChay({ ...ngay, gioiHan: 20 }),
      nguoiBanLayLichSuGiaoDich({ ...ngay, trang }),
    ]).then(([tongQuan, doanhThu, banChay, lichSu]) => { if (!daHuy) setDuLieu({ tongQuan, doanhThu, banChay, lichSu }); })
      .catch((loiApi) => { if (!daHuy) setLoi(loiApi.message); })
      .finally(() => { if (!daHuy) setDangTai(false); });
    return () => { daHuy = true; };
  }, [tuNgay, denNgay, nhom, trang, lanTai]);

  const cot = [
    { khoa: 'ngayTao', tieuDe: 'Thời gian', render: dinhDangNgayGio },
    { khoa: 'maGiaoDich', tieuDe: 'Mã giao dịch', render: (giaTri) => giaTri || '—' },
    { khoa: 'nguoiMua', tieuDe: 'Người mua', render: (giaTri) => giaTri?.hoTen || '—' },
    { khoa: 'tongThanhToan', tieuDe: 'Tổng', render: dinhDangTien },
    { khoa: 'trangThaiXuLy', tieuDe: 'Xử lý', render: (giaTri) => <TrangThaiBadge trangThai={giaTri} /> },
  ];
  const tong = duLieu?.tongQuan;
  return <div className="thongKePage">
    <PageHeader title="Báo cáo cửa hàng" description="Xem doanh thu, sản phẩm đã bán và lịch sử giao dịch của cửa hàng bạn." />
    <div className="thongKeBoLoc"><BoChonKhoangThoiGian tuNgay={tuNgay} denNgay={denNgay} onChange={(moi) => doiParams(moi, true)} />
      <div className="thongKeChon" role="group" aria-label="Nhóm thời gian">
        <button type="button" aria-pressed={nhom === 'ngay'} onClick={() => doiParams({ nhom: 'ngay' })}>Theo ngày</button>
        <button type="button" aria-pressed={nhom === 'thang'} onClick={() => doiParams({ nhom: 'thang' })}>Theo tháng</button>
      </div>
    </div>
    {loi ? <ErrorState message={loi} taiLai={() => setLanTai((so) => so + 1)} /> : <>
      <div className="thongKeThe">
        <TheThongKe nhan="Doanh thu" giaTri={dinhDangTien(tong?.tongDoanhThu)} dangTai={dangTai} />
        <TheThongKe nhan="Đơn hoàn thành" giaTri={tong?.soDonHoanThanh} dangTai={dangTai} />
        <TheThongKe nhan="Sản phẩm đã bán" giaTri={tong?.soSanPhamDaBan} dangTai={dangTai} />
      </div>
      <p className="thongKeGhiChu">{GHI_CHU}</p>
      {dangTai ? <Skeleton variant="block" count={3} /> : tong?.soDonHoanThanh === 0 && !duLieu.lichSu.danhSach.length ?
        <EmptyState title="Chưa có dữ liệu bán hàng trong khoảng thời gian này" description="Thử chọn khoảng thời gian khác để xem báo cáo." /> : <>
          <section className="thongKeKhoi"><div className="thongKeTieuDe"><h2>Xu hướng bán hàng</h2><div className="thongKeChon" role="group" aria-label="Chỉ số biểu đồ"><button type="button" aria-pressed={chiSo === 'doanhThu'} onClick={() => setChiSo('doanhThu')}>Doanh thu</button><button type="button" aria-pressed={chiSo === 'soDon'} onClick={() => setChiSo('soDon')}>Số đơn</button></div><div className="thongKeChon" role="group" aria-label="Kiểu biểu đồ"><button type="button" aria-pressed={kieu === 'cot'} onClick={() => setKieu('cot')}>Cột</button><button type="button" aria-pressed={kieu === 'duong'} onClick={() => setKieu('duong')}>Đường</button></div></div><BieuDoDoanhThu duLieu={duLieu.doanhThu.danhSach} chiSo={chiSo} kieu={kieu} /></section>
          <section className="thongKeKhoi"><div className="thongKeTieuDe"><h2>Sản phẩm bán chạy</h2></div><DanhSachBanChay danhSach={duLieu.banChay.danhSach} /></section>
          <section className="thongKeKhoi"><div className="thongKeTieuDe"><h2>Lịch sử giao dịch</h2></div><DataTable cot={cot} hang={duLieu.lichSu.danhSach} khoaHang="_id" /><Pagination trang={duLieu.lichSu.phanTrang.trang} tongTrang={duLieu.lichSu.phanTrang.tongTrang} onChange={(so) => doiParams({ trang: String(so) })} /></section>
        </>}
    </>}
  </div>;
}
