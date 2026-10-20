import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TrangThaiBadge from '../../components/TrangThaiBadge.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import useThongBao from '../../hooks/useThongBao.js';
import { quanTriLayChiTietYeuCau, quanTriLayDanhSachYeuCau, quanTriXetDuyetYeuCau } from '../../services/yeuCauDangKyNguoiBan.api.js';
import { dinhDangNgayGio } from '../../utils/dinhDang.js';
import { TRANG_THAI_YEU_CAU_NGUOI_BAN as TRANG_THAI } from '../../utils/hangSo.js';
import './DuyetNguoiBanPage.css';

const CAC_TAB = [
  { value: TRANG_THAI.CHO_PHE_DUYET, label: 'Chờ phê duyệt' },
  { value: TRANG_THAI.DA_PHE_DUYET, label: 'Đã phê duyệt' },
  { value: TRANG_THAI.DA_TU_CHOI, label: 'Đã từ chối' },
];

export default function DuyetNguoiBanPage() {
  const thongBao = useThongBao();
  const [searchParams, setSearchParams] = useSearchParams();
  const trangThaiQuery = searchParams.get('trangThai');
  const trangThai = CAC_TAB.some((tab) => tab.value === trangThaiQuery) ? trangThaiQuery : TRANG_THAI.CHO_PHE_DUYET;
  const trang = searchParams.get('trang') || '1';
  const [duLieu, setDuLieu] = useState({ danhSach: [], phanTrang: { trang: 1, tongTrang: 0, tongSo: 0 } });
  const [dangTai, setDangTai] = useState(true);
  const [loiTai, setLoiTai] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const [chiTiet, setChiTiet] = useState(null);
  const [idChiTiet, setIdChiTiet] = useState(null);
  const [moChiTiet, setMoChiTiet] = useState(false);
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);
  const [loiChiTiet, setLoiChiTiet] = useState('');
  const [xacNhan, setXacNhan] = useState(null);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [loiXuLy, setLoiXuLy] = useState('');

  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoiTai('');
    quanTriLayDanhSachYeuCau({ trangThai, trang }).then((data) => {
      if (conHieuLuc) setDuLieu(data);
    }).catch((loi) => { if (conHieuLuc) setLoiTai(loi.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [trangThai, trang, lanTai]);

  const doiTab = (moi) => {
    setSearchParams(moi === TRANG_THAI.CHO_PHE_DUYET ? {} : { trangThai: moi });
    setLoiXuLy('');
  };
  const doiTrang = (moi) => {
    const query = new URLSearchParams(searchParams);
    if (moi === 1) query.delete('trang'); else query.set('trang', String(moi));
    setSearchParams(query);
  };
  const xemChiTiet = async (id) => {
    setIdChiTiet(id);
    setMoChiTiet(true); setChiTiet(null); setLoiChiTiet(''); setDangTaiChiTiet(true);
    try {
      const { yeuCau } = await quanTriLayChiTietYeuCau(id);
      setChiTiet(yeuCau);
    } catch (loi) { setLoiChiTiet(loi.message); }
    finally { setDangTaiChiTiet(false); }
  };
  const moXacNhan = (dich) => { setMoChiTiet(false); setXacNhan(dich); setLoiXuLy(''); };
  const dongXacNhan = () => { if (!dangXuLy) { setXacNhan(null); setMoChiTiet(true); } };
  const xetDuyet = async () => {
    if (!chiTiet || !xacNhan || dangXuLy) return;
    setDangXuLy(true); setLoiXuLy('');
    try {
      await quanTriXetDuyetYeuCau(chiTiet._id, xacNhan);
      thongBao.thanhCong(xacNhan === TRANG_THAI.DA_PHE_DUYET ? 'Đã phê duyệt Người bán.' : 'Đã từ chối yêu cầu.');
      setXacNhan(null); setChiTiet(null); setLanTai((lan) => lan + 1);
    } catch (loi) {
      setLoiXuLy(loi.message);
      setXacNhan(null); setChiTiet(null); setLanTai((lan) => lan + 1);
    } finally { setDangXuLy(false); }
  };

  const cot = [
    { khoa: 'taiKhoan', tieuDe: 'Người gửi', render: (taiKhoan) => <div className="duyetNguoiBanNguoiGui"><strong>{taiKhoan?.hoTen || 'Tài khoản không tồn tại'}</strong><span>{taiKhoan?.email || '—'}</span></div> },
    { khoa: 'tenCuaHang', tieuDe: 'Tên cửa hàng' },
    { khoa: 'ngayGui', tieuDe: 'Ngày gửi', render: (ngay) => dinhDangNgayGio(ngay) },
    { khoa: 'trangThai', tieuDe: 'Trạng thái', render: (giaTri) => <TrangThaiBadge trangThai={giaTri} /> },
    { khoa: 'thaoTac', tieuDe: 'Thao tác', render: (_, yeuCau) => <Button variant="secondary" size="sm" onClick={() => xemChiTiet(yeuCau._id)}>Xem</Button> },
  ];
  const thongTin = (nhan, giaTri) => <div className="duyetNguoiBanDong"><dt>{nhan}</dt><dd>{giaTri || '—'}</dd></div>;
  const pheDuyet = xacNhan === TRANG_THAI.DA_PHE_DUYET;

  return <div className="duyetNguoiBanPage">
    <PageHeader title="Duyệt đăng ký Người bán" description="Xem và xử lý yêu cầu mở cửa hàng trên Soopi." />
    <Tabs items={CAC_TAB} value={trangThai} onChange={doiTab} label="Trạng thái yêu cầu" />
    {loiXuLy && <p className="duyetNguoiBanLoi" role="alert">{loiXuLy}</p>}
    {dangTai ? <Skeleton variant="block" count={3} /> : loiTai ? <ErrorState message={loiTai} taiLai={() => setLanTai((lan) => lan + 1)} /> : duLieu.danhSach.length ? <><DataTable cot={cot} hang={duLieu.danhSach} khoaHang="_id" /><Pagination trang={duLieu.phanTrang.trang} tongTrang={duLieu.phanTrang.tongTrang} onChange={doiTrang} /></> : <EmptyState title={trangThai === TRANG_THAI.CHO_PHE_DUYET ? 'Không có yêu cầu nào đang chờ' : 'Chưa có yêu cầu ở trạng thái này'} description="Yêu cầu sẽ xuất hiện ở đây khi có dữ liệu." />}
    <Modal open={moChiTiet} onClose={() => setMoChiTiet(false)} title="Chi tiết yêu cầu đăng ký">
      {dangTaiChiTiet ? <Skeleton variant="block" count={2} /> : loiChiTiet ? <ErrorState message={loiChiTiet} taiLai={() => xemChiTiet(idChiTiet)} /> : chiTiet && <div className="duyetNguoiBanChiTiet">
        <section><h3>Thông tin tài khoản</h3><dl>{thongTin('Họ tên', chiTiet.taiKhoan?.hoTen)}{thongTin('Email', chiTiet.taiKhoan?.email)}{thongTin('Số điện thoại', chiTiet.taiKhoan?.soDienThoai)}{thongTin('Địa chỉ nhận hàng', chiTiet.taiKhoan?.diaChiNhanHang)}{thongTin('Trạng thái', chiTiet.taiKhoan?.trangThaiTaiKhoan)}</dl></section>
        <section><h3>Thông tin cửa hàng đăng ký</h3><dl>{thongTin('Tên cửa hàng', chiTiet.tenCuaHang)}{thongTin('Địa chỉ', chiTiet.diaChiCuaHang)}{thongTin('Mô tả', chiTiet.moTaCuaHang)}{thongTin('Ngày gửi', dinhDangNgayGio(chiTiet.ngayGui))}{thongTin('Trạng thái', chiTiet.trangThai)}</dl></section>
        {chiTiet.trangThai === TRANG_THAI.CHO_PHE_DUYET && <div className="duyetNguoiBanActions"><Button variant="danger" onClick={() => moXacNhan(TRANG_THAI.DA_TU_CHOI)}>Từ chối</Button><Button onClick={() => moXacNhan(TRANG_THAI.DA_PHE_DUYET)}>Phê duyệt</Button></div>}
      </div>}
    </Modal>
    <ConfirmDialog open={Boolean(xacNhan)} onClose={dongXacNhan} onConfirm={xetDuyet} title={pheDuyet ? 'Phê duyệt Người bán' : 'Từ chối yêu cầu'} message={pheDuyet ? `Phê duyệt cửa hàng “${chiTiet?.tenCuaHang}”? Tài khoản sẽ được bổ sung quyền Người bán.` : `Từ chối yêu cầu mở cửa hàng “${chiTiet?.tenCuaHang}”?`} confirmLabel={pheDuyet ? 'Phê duyệt' : 'Từ chối'} danger={!pheDuyet} loading={dangXuLy} />
  </div>;
}
