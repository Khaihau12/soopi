import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TrangThaiBadge from '../../components/TrangThaiBadge.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import useThongBao from '../../hooks/useThongBao.js';
import { quanTriCapNhatTrangThaiCuaHang, quanTriLayDanhSachCuaHang } from '../../services/cuaHang.api.js';
import { TRANG_THAI_HOAT_DONG_CUA_HANG as TRANG_THAI } from '../../utils/hangSo.js';
import './TaiKhoanQuanTriPage.css';

const duLieuRong = { danhSach: [], phanTrang: { trang: 1, tongTrang: 0, tongSo: 0 } };

export default function CuaHangQuanTriPage() {
  const thongBao = useThongBao();
  const [params, setParams] = useSearchParams();
  const tuKhoa = params.get('tuKhoa') || '';
  const trangThai = params.get('trangThaiHoatDong') || '';
  const trang = params.get('trang') || '1';
  const [oTim, setOTim] = useState(tuKhoa);
  const [duLieu, setDuLieu] = useState(duLieuRong);
  const [dangTai, setDangTai] = useState(true);
  const [loiTai, setLoiTai] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const [xacNhan, setXacNhan] = useState(null);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [loiXuLy, setLoiXuLy] = useState('');

  useEffect(() => { setOTim(tuKhoa); }, [tuKhoa]);
  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoiTai('');
    quanTriLayDanhSachCuaHang({ tuKhoa, trangThaiHoatDong: trangThai, trang })
      .then((data) => { if (conHieuLuc) setDuLieu(data); })
      .catch((loi) => { if (conHieuLuc) setLoiTai(loi.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [tuKhoa, trangThai, trang, lanTai]);
  const capNhatQuery = (ten, giaTri) => {
    const query = new URLSearchParams(params);
    if (giaTri) query.set(ten, giaTri); else query.delete(ten);
    if (ten !== 'trang') query.delete('trang');
    setParams(query);
  };
  const capNhatTrangThai = async () => {
    if (!xacNhan || dangXuLy) return;
    setDangXuLy(true); setLoiXuLy('');
    try {
      await quanTriCapNhatTrangThaiCuaHang(xacNhan._id, xacNhan.dich);
      thongBao.thanhCong(xacNhan.dich === TRANG_THAI.NGUNG_HOAT_DONG ? 'Đã ngừng hoạt động cửa hàng.' : 'Đã kích hoạt lại cửa hàng.');
      setXacNhan(null); setLanTai((lan) => lan + 1);
    } catch (loi) { setLoiXuLy(loi.message); }
    finally { setDangXuLy(false); }
  };
  const cot = [
    { khoa: 'tenCuaHang', tieuDe: 'Cửa hàng', render: (_, cuaHang) => <div className="quanTriTaiKhoanTen"><strong>{cuaHang.tenCuaHang}</strong><small>{cuaHang.diaChi || 'Chưa có địa chỉ'}</small></div> },
    { khoa: 'chuCuaHang', tieuDe: 'Chủ cửa hàng', render: (chu) => <div className="quanTriTaiKhoanTen"><strong>{chu?.hoTen || 'Không tìm thấy tài khoản'}</strong><small>{chu?.email || '—'}</small></div> },
    { khoa: 'soSanPham', tieuDe: 'Số sản phẩm' },
    { khoa: 'trangThaiHoatDong', tieuDe: 'Trạng thái', render: (giaTri) => <TrangThaiBadge trangThai={giaTri} /> },
    { khoa: 'thaoTac', tieuDe: 'Thao tác', render: (_, cuaHang) => {
      const dangHoatDong = cuaHang.trangThaiHoatDong === TRANG_THAI.HOAT_DONG;
      return <Button size="sm" variant={dangHoatDong ? 'danger' : 'secondary'} onClick={() => { setXacNhan({ _id: cuaHang._id,
        tenCuaHang: cuaHang.tenCuaHang, dich: dangHoatDong ? TRANG_THAI.NGUNG_HOAT_DONG : TRANG_THAI.HOAT_DONG }); setLoiXuLy(''); }}>
        {dangHoatDong ? 'Ngừng hoạt động' : 'Kích hoạt lại'}</Button>;
    } },
  ];
  const dangNgung = xacNhan?.dich === TRANG_THAI.NGUNG_HOAT_DONG;
  return <div className="quanTriTaiKhoanPage">
    <PageHeader title="Cửa hàng" description="Xem và điều chỉnh trạng thái hoạt động của cửa hàng." />
    <form className="quanTriTaiKhoanBoLoc" onSubmit={(event) => { event.preventDefault(); capNhatQuery('tuKhoa', oTim.trim()); }}>
      <Field label="Tìm theo tên cửa hàng"><Input value={oTim} onChange={(event) => setOTim(event.target.value)} maxLength={100} placeholder="Nhập tên cửa hàng" /></Field>
      <Field label="Trạng thái"><Select value={trangThai} onChange={(event) => capNhatQuery('trangThaiHoatDong', event.target.value)}>
        <option value="">Tất cả</option><option value={TRANG_THAI.HOAT_DONG}>Hoạt động</option><option value={TRANG_THAI.NGUNG_HOAT_DONG}>Ngừng hoạt động</option>
      </Select></Field>
      <Button type="submit" variant="secondary">Tìm kiếm</Button>
    </form>
    {dangTai ? <Skeleton variant="block" count={3} /> : loiTai ? <ErrorState message={loiTai} taiLai={() => setLanTai((lan) => lan + 1)} />
      : duLieu.danhSach.length ? <><p className="quanTriTaiKhoanSoLuong">{duLieu.phanTrang.tongSo} cửa hàng</p><DataTable cot={cot} hang={duLieu.danhSach} khoaHang="_id" />
        <Pagination trang={duLieu.phanTrang.trang} tongTrang={duLieu.phanTrang.tongTrang} onChange={(moi) => capNhatQuery('trang', moi === 1 ? '' : String(moi))} /></>
        : <EmptyState icon="store" title="Không có cửa hàng phù hợp" description="Thử thay đổi từ khóa hoặc bộ lọc." />}
    <ConfirmDialog open={Boolean(xacNhan)} onClose={() => { if (!dangXuLy) setXacNhan(null); }} onConfirm={capNhatTrangThai}
      title={dangNgung ? 'Ngừng hoạt động cửa hàng' : 'Kích hoạt lại cửa hàng'}
      message={loiXuLy || (dangNgung
        ? `Ngừng hoạt động “${xacNhan?.tenCuaHang}”? Sản phẩm của cửa hàng sẽ ẩn khỏi trang bán; khách không thể thêm giỏ hay đặt mới. Người bán vẫn xử lý được đơn đã thanh toán.`
        : `Kích hoạt lại cửa hàng “${xacNhan?.tenCuaHang}”? Sản phẩm đang kinh doanh có thể xuất hiện lại trên trang bán.`)}
      confirmLabel={dangNgung ? 'Ngừng hoạt động' : 'Kích hoạt lại'} danger={dangNgung} loading={dangXuLy} />
  </div>;
}
