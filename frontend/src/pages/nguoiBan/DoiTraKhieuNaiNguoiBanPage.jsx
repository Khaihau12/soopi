import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Button from '../../components/ui/Button.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import TrangThaiBadge from '../../components/TrangThaiBadge.jsx';
import useThongBao from '../../hooks/useThongBao.js';
import { nguoiBanLayChiTietYeuCau, nguoiBanLayDanhSachYeuCau, nguoiBanXuLyYeuCau } from '../../services/doiTraKhieuNai.api.js';
import { dinhDangNgayGio, dinhDangTien, maDonHangHienThi } from '../../utils/dinhDang.js';
import { DUONG_DAN, KET_QUA_XU_LY, LOAI_YEU_CAU, TRANG_THAI_XU_LY_YEU_CAU } from '../../utils/hangSo.js';
import '../DoiTraKhieuNaiPage.css';

const TABS = [
  { value: 'cho-xu-ly', label: 'Chờ xử lý', query: { trangThaiXuLy: TRANG_THAI_XU_LY_YEU_CAU.CHO_XU_LY } },
  { value: 'da-xu-ly', label: 'Đã xử lý', query: { trangThaiXuLy: TRANG_THAI_XU_LY_YEU_CAU.DA_XU_LY } },
  { value: 'tat-ca', label: 'Tất cả', query: {} },
];

export default function DoiTraKhieuNaiNguoiBanPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((item) => item.value === params.get('tab')) || TABS[0];
  const loaiYeuCau = params.get('loaiYeuCau') || '';
  const trang = Math.max(1, Number(params.get('trang')) || 1);
  const [duLieu, setDuLieu] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const [idChiTiet, setIdChiTiet] = useState(null);
  const [chiTiet, setChiTiet] = useState(null);
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);
  const [loiChiTiet, setLoiChiTiet] = useState('');
  const [lanTaiChiTiet, setLanTaiChiTiet] = useState(0);
  const [xacNhan, setXacNhan] = useState(null);
  const [dangXuLy, setDangXuLy] = useState(false);
  const thongBao = useThongBao();
  const taiLai = () => setLanTai((lan) => lan + 1);
  const doiLoc = (ten, giaTri) => {
    const moi = new URLSearchParams(params);
    if (giaTri) moi.set(ten, giaTri); else moi.delete(ten);
    moi.delete('trang'); setParams(moi);
  };

  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoi('');
    nguoiBanLayDanhSachYeuCau({ ...tab.query, ...(loaiYeuCau ? { loaiYeuCau } : {}), trang })
      .then((data) => { if (conHieuLuc) setDuLieu(data); })
      .catch((loiApi) => { if (conHieuLuc) { setDuLieu(null); setLoi(loiApi.message); } })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [tab.value, loaiYeuCau, trang, lanTai]);

  useEffect(() => {
    if (!idChiTiet) return undefined;
    let conHieuLuc = true;
    setChiTiet(null); setLoiChiTiet(''); setDangTaiChiTiet(true);
    nguoiBanLayChiTietYeuCau(idChiTiet).then((data) => { if (conHieuLuc) setChiTiet(data.yeuCau); })
      .catch((loiApi) => { if (conHieuLuc) setLoiChiTiet(loiApi.message); })
      .finally(() => { if (conHieuLuc) setDangTaiChiTiet(false); });
    return () => { conHieuLuc = false; };
  }, [idChiTiet, lanTaiChiTiet]);

  const xuLy = async () => {
    if (!xacNhan || dangXuLy) return;
    setDangXuLy(true);
    try {
      await nguoiBanXuLyYeuCau(xacNhan.id, xacNhan.ketQuaXuLy);
      thongBao.thanhCong('Đã ghi nhận kết quả xử lý');
      setXacNhan(null); taiLai();
    } catch (loiApi) {
      thongBao.loi(loiApi.message);
      if (loiApi.status === 409) { setXacNhan(null); taiLai(); }
    } finally { setDangXuLy(false); }
  };
  const chonXuLy = (ketQuaXuLy) => {
    setXacNhan({ id: chiTiet._id, ketQuaXuLy });
    setIdChiTiet(null);
  };
  const cot = [
    { khoa: 'chiTietDonHang', tieuDe: 'Sản phẩm', render: (dong) => <strong>{dong.sanPham.tenSanPham}</strong> },
    { khoa: 'loaiYeuCau', tieuDe: 'Loại', render: (loai) => loai },
    { khoa: 'nguoiGui', tieuDe: 'Người gửi', render: (nguoi) => <span>{nguoi.hoTen}<small className="doiTraBanPhu">{nguoi.soDienThoai || 'Chưa có SĐT'}</small></span> },
    { khoa: 'ngayTao', tieuDe: 'Ngày gửi', render: (ngay) => dinhDangNgayGio(ngay) },
    { khoa: 'trangThaiXuLy', tieuDe: 'Trạng thái / Kết quả', render: (trangThai, item) => <TrangThaiBadge trangThai={item.ketQuaXuLy || trangThai} /> },
    { khoa: 'thaoTac', tieuDe: 'Thao tác', render: (_, item) => <Button size="sm" variant="secondary" onClick={() => setIdChiTiet(item._id)}>Xem</Button> },
  ];

  return <div className="doiTraPage">
    <PageHeader title="Đổi trả và khiếu nại" description="Xem và xử lý yêu cầu của khách thuộc cửa hàng bạn." />
    <Tabs items={TABS} value={tab.value} onChange={(value) => doiLoc('tab', value)} label="Lọc trạng thái yêu cầu" />
    <div className="doiTraBanBoLoc" role="group" aria-label="Lọc loại yêu cầu"><span>Loại yêu cầu</span>
      {['', ...Object.values(LOAI_YEU_CAU)].map((loai) => <Button key={loai || 'tat-ca'} size="sm" variant={loaiYeuCau === loai ? 'primary' : 'secondary'}
        onClick={() => doiLoc('loaiYeuCau', loai)}>{loai || 'Tất cả'}</Button>)}</div>
    {dangTai ? <Skeleton variant="block" count={3} /> : loi ? <ErrorState message={loi} taiLai={taiLai} /> : !duLieu?.danhSach.length ?
      <EmptyState title="Chưa có yêu cầu nào" description="Yêu cầu phù hợp sẽ xuất hiện tại đây khi khách gửi từ đơn đã hoàn thành." /> : <>
        <DataTable cot={cot} hang={duLieu.danhSach} khoaHang="_id" />
        <Pagination trang={duLieu.phanTrang.trang} tongTrang={duLieu.phanTrang.tongTrang}
          onChange={(soTrang) => { const moi = new URLSearchParams(params); moi.set('trang', String(soTrang)); setParams(moi); }} /></>}
    <Modal open={Boolean(idChiTiet)} onClose={() => setIdChiTiet(null)} title="Chi tiết yêu cầu">
      {dangTaiChiTiet ? <Skeleton variant="block" count={2} /> : loiChiTiet ? <ErrorState message={loiChiTiet} taiLai={() => setLanTaiChiTiet((lan) => lan + 1)} /> : chiTiet &&
        <div className="doiTraChiTiet"><strong>{chiTiet.chiTietDonHang.sanPham.tenSanPham}</strong>
          <p>{chiTiet.loaiYeuCau} · {chiTiet.chiTietDonHang.soLuong} sản phẩm · {dinhDangTien(chiTiet.chiTietDonHang.thanhTien)}</p>
          <p>Người gửi: {chiTiet.nguoiGui.hoTen} · {chiTiet.nguoiGui.soDienThoai || 'Chưa có SĐT'}</p>
          <p>Ngày gửi: {dinhDangNgayGio(chiTiet.ngayTao)}</p>
          <p className="doiTraNoiDung">{chiTiet.noiDung}</p>
          <p>Trạng thái: <TrangThaiBadge trangThai={chiTiet.ketQuaXuLy || chiTiet.trangThaiXuLy} /></p>
          <Link to={DUONG_DAN.NGUOI_BAN.chiTietDonHang(chiTiet.donHang._id)} onClick={() => setIdChiTiet(null)}>Xem đơn {maDonHangHienThi(chiTiet.donHang._id)}</Link>
          <p>Soopi không tự động hoàn tiền hoặc đổi hàng.</p>
          {chiTiet.trangThaiXuLy === TRANG_THAI_XU_LY_YEU_CAU.CHO_XU_LY && <div className="doiTraBanHanhDong">
            <Button onClick={() => chonXuLy(KET_QUA_XU_LY.CHAP_NHAN)}>Chấp nhận</Button>
            <Button variant="danger" onClick={() => chonXuLy(KET_QUA_XU_LY.TU_CHOI)}>Từ chối</Button></div>}
        </div>}
    </Modal>
    <ConfirmDialog open={Boolean(xacNhan)} onClose={() => setXacNhan(null)} onConfirm={xuLy} loading={dangXuLy}
      title={`${xacNhan?.ketQuaXuLy || 'Xử lý'} yêu cầu`}
      message="Kết quả không thể thay đổi sau khi xác nhận. Soopi không tự động hoàn tiền hoặc đổi hàng."
      confirmLabel={xacNhan?.ketQuaXuLy || 'Xác nhận'} danger={xacNhan?.ketQuaXuLy === KET_QUA_XU_LY.TU_CHOI} />
  </div>;
}
