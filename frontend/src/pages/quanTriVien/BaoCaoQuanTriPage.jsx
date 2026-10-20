import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BieuDoDoanhThu from '../../components/thongKe/BieuDoDoanhThu.jsx';
import BieuDoThanhNgang from '../../components/thongKe/BieuDoThanhNgang.jsx';
import BoChonKhoangThoiGian, { cacMoc } from '../../components/thongKe/BoChonKhoangThoiGian.jsx';
import TheThongKe from '../../components/thongKe/TheThongKe.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { quanTriLayTongQuan, quanTriLayDoanhThu, quanTriLaySanPhamBanChay, quanTriLayDanhMucQuanTam, quanTriLayHieuSuatNguoiBan } from '../../services/thongKe.api.js';
import { dinhDangTien } from '../../utils/dinhDang.js';
import { DanhSachSanPhamBanChay, GHI_CHU_DOANH_THU, MoTaSoSanh } from './TongQuanQuanTriPage.jsx';
import './ThongKeQuanTriPage.css';

export default function BaoCaoQuanTriPage() {
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
      quanTriLayTongQuan(ngay), quanTriLayDoanhThu({ ...ngay, nhom }),
      quanTriLaySanPhamBanChay({ ...ngay, gioiHan: 20 }),
      quanTriLayDanhMucQuanTam({ ...ngay, gioiHan: 20 }),
      quanTriLayHieuSuatNguoiBan({ ...ngay, trang }),
    ]).then(([tongQuan, doanhThu, sanPham, danhMuc, hieuSuat]) => { if (!daHuy) setDuLieu({ tongQuan, doanhThu, sanPham, danhMuc, hieuSuat }); })
      .catch((loiApi) => { if (!daHuy) setLoi(loiApi.message); })
      .finally(() => { if (!daHuy) setDangTai(false); });
    return () => { daHuy = true; };
  }, [tuNgay, denNgay, nhom, trang, lanTai]);

  const cot = [
    { khoa: 'cuaHang', tieuDe: 'Cửa hàng', render: (cuaHang, item) => <span><strong>{cuaHang.tenCuaHang}</strong><small className="thongKeQuanTriPhu">Chủ: {item.chuCuaHang.hoTen}</small></span> },
    { khoa: 'soDonHoanThanh', tieuDe: 'Đơn hoàn thành' },
    { khoa: 'doanhThu', tieuDe: 'Doanh thu', render: dinhDangTien },
    { khoa: 'soSanPhamDaBan', tieuDe: 'Sản phẩm đã bán' },
  ];
  const tong = duLieu?.tongQuan;
  return <div className="thongKePage">
    <PageHeader title="Báo cáo và phân tích" description="Theo dõi kết quả bán hàng trên toàn hệ thống." />
    <div className="thongKeBoLoc"><BoChonKhoangThoiGian tuNgay={tuNgay} denNgay={denNgay} onChange={(moi) => doiParams(moi, true)} />
      <div className="thongKeChon" role="group" aria-label="Nhóm thời gian"><button type="button" aria-pressed={nhom === 'ngay'} onClick={() => doiParams({ nhom: 'ngay' })}>Theo ngày</button><button type="button" aria-pressed={nhom === 'thang'} onClick={() => doiParams({ nhom: 'thang' })}>Theo tháng</button></div>
    </div>
    {loi ? <ErrorState message={loi} taiLai={() => setLanTai((so) => so + 1)} /> : <>
      <div className="thongKeThe thongKeQuanTriThe">
        <TheThongKe nhan="Doanh thu" giaTri={dinhDangTien(tong?.tongDoanhThu)} chuThich={<MoTaSoSanh giaTri={tong?.soVoiKyTruoc.doanhThu} />} dangTai={dangTai} />
        <TheThongKe nhan="Đơn hoàn thành" giaTri={tong?.soDonHoanThanh} chuThich={<MoTaSoSanh giaTri={tong?.soVoiKyTruoc.soDonHoanThanh} />} dangTai={dangTai} />
        <TheThongKe nhan="Đơn đã thanh toán" giaTri={tong?.soDonDaThanhToan} chuThich="Theo ngày tạo đơn" dangTai={dangTai} />
      </div>
      <p className="thongKeGhiChu">{GHI_CHU_DOANH_THU}</p>
      {dangTai ? <Skeleton variant="block" count={3} /> : <>
        <section className="thongKeKhoi"><div className="thongKeTieuDe"><h2>Xu hướng mua hàng</h2><div className="thongKeChon" role="group" aria-label="Chỉ số biểu đồ"><button type="button" aria-pressed={chiSo === 'doanhThu'} onClick={() => setChiSo('doanhThu')}>Doanh thu</button><button type="button" aria-pressed={chiSo === 'soDon'} onClick={() => setChiSo('soDon')}>Số đơn</button></div><div className="thongKeChon" role="group" aria-label="Kiểu biểu đồ"><button type="button" aria-pressed={kieu === 'cot'} onClick={() => setKieu('cot')}>Cột</button><button type="button" aria-pressed={kieu === 'duong'} onClick={() => setKieu('duong')}>Đường</button></div></div>{tong.soDonHoanThanh ? <BieuDoDoanhThu duLieu={duLieu.doanhThu.danhSach} chiSo={chiSo} kieu={kieu} /> : <EmptyState title="Chưa có đơn hoàn thành trong kỳ này" />}</section>
        <section className="thongKeKhoi"><div className="thongKeTieuDe"><h2>Sản phẩm bán chạy</h2></div><DanhSachSanPhamBanChay danhSach={duLieu.sanPham.danhSach} /></section>
        <section className="thongKeKhoi"><div className="thongKeTieuDe"><h2>Danh mục được quan tâm</h2></div><p className="thongKeQuanTriPhu">Tính theo số lượng đã bán; hệ thống không thu thập lượt xem hoặc tìm kiếm.</p><BieuDoThanhNgang duLieu={duLieu.danhMuc.danhSach} /></section>
        <section className="thongKeKhoi"><div className="thongKeTieuDe"><h2>Hiệu suất Người bán</h2></div>{duLieu.hieuSuat.danhSach.length ? <><DataTable cot={cot} hang={duLieu.hieuSuat.danhSach} khoaHang={(item) => item.cuaHang._id} /><Pagination trang={duLieu.hieuSuat.phanTrang.trang} tongTrang={duLieu.hieuSuat.phanTrang.tongTrang} onChange={(so) => doiParams({ trang: String(so) })} /></> : <EmptyState title="Chưa có cửa hàng phát sinh đơn hoàn thành trong kỳ này" />}</section>
      </>}
    </>}
  </div>;
}
