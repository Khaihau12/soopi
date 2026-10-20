import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import TrangThaiBadge from '../../components/TrangThaiBadge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import useThongBao from '../../hooks/useThongBao.js';
import { quanTriCapNhatTrangThaiTaiKhoan, quanTriDatLaiMatKhau, quanTriLayChiTietTaiKhoan,
  quanTriLayDanhSachTaiKhoan } from '../../services/taiKhoan.api.js';
import { dinhDangNgay } from '../../utils/dinhDang.js';
import { DUONG_DAN, TRANG_THAI_TAI_KHOAN, VAI_TRO } from '../../utils/hangSo.js';
import './TaiKhoanQuanTriPage.css';

const duLieuRong = { danhSach: [], phanTrang: { trang: 1, tongTrang: 0, tongSo: 0 } };

export default function TaiKhoanQuanTriPage() {
  const thongBao = useThongBao();
  const [params, setParams] = useSearchParams();
  const tuKhoa = params.get('tuKhoa') || '';
  const vaiTro = params.get('vaiTro') || '';
  const trangThai = params.get('trangThaiTaiKhoan') || '';
  const trang = params.get('trang') || '1';
  const [oTim, setOTim] = useState(tuKhoa);
  const [duLieu, setDuLieu] = useState(duLieuRong);
  const [dangTai, setDangTai] = useState(true);
  const [loiTai, setLoiTai] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const [idChiTiet, setIdChiTiet] = useState(null);
  const [chiTiet, setChiTiet] = useState(null);
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);
  const [loiChiTiet, setLoiChiTiet] = useState('');
  const [xacNhan, setXacNhan] = useState(null);
  const [moMatKhau, setMoMatKhau] = useState(false);
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [nhapLai, setNhapLai] = useState('');
  const [hienMatKhau, setHienMatKhau] = useState(false);
  const [loiMatKhau, setLoiMatKhau] = useState('');
  const [loiXuLy, setLoiXuLy] = useState('');
  const [dangXuLy, setDangXuLy] = useState(false);

  useEffect(() => { setOTim(tuKhoa); }, [tuKhoa]);
  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoiTai('');
    quanTriLayDanhSachTaiKhoan({ tuKhoa, vaiTro, trangThaiTaiKhoan: trangThai, trang })
      .then((data) => { if (conHieuLuc) setDuLieu(data); })
      .catch((loi) => { if (conHieuLuc) setLoiTai(loi.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [tuKhoa, vaiTro, trangThai, trang, lanTai]);

  const capNhatQuery = (ten, giaTri) => {
    const query = new URLSearchParams(params);
    if (giaTri) query.set(ten, giaTri); else query.delete(ten);
    if (ten !== 'trang') query.delete('trang');
    setParams(query);
  };
  const xemChiTiet = async (id) => {
    setIdChiTiet(id); setChiTiet(null); setLoiChiTiet(''); setDangTaiChiTiet(true);
    try { const data = await quanTriLayChiTietTaiKhoan(id); setChiTiet(data.taiKhoan); }
    catch (loi) { setLoiChiTiet(loi.message); }
    finally { setDangTaiChiTiet(false); }
  };
  const dongMatKhau = () => {
    if (dangXuLy) return;
    setMoMatKhau(false); setMatKhauMoi(''); setNhapLai(''); setLoiMatKhau(''); setHienMatKhau(false);
  };
  const capNhatTrangThai = async () => {
    if (!xacNhan || dangXuLy) return;
    setDangXuLy(true); setLoiXuLy('');
    try {
      await quanTriCapNhatTrangThaiTaiKhoan(xacNhan._id, xacNhan.dich);
      thongBao.thanhCong(xacNhan.dich === TRANG_THAI_TAI_KHOAN.BI_KHOA ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.');
      setXacNhan(null); setIdChiTiet(null); setChiTiet(null); setLanTai((lan) => lan + 1);
    } catch (loi) { setLoiXuLy(loi.message); }
    finally { setDangXuLy(false); }
  };
  const datLaiMatKhau = async (event) => {
    event.preventDefault();
    if (matKhauMoi.length < 8) { setLoiMatKhau('Mật khẩu mới phải có ít nhất 8 ký tự.'); return; }
    if (matKhauMoi !== nhapLai) { setLoiMatKhau('Mật khẩu nhập lại chưa khớp.'); return; }
    setDangXuLy(true); setLoiMatKhau('');
    try {
      await quanTriDatLaiMatKhau(chiTiet._id, matKhauMoi);
      setMoMatKhau(false); setMatKhauMoi(''); setNhapLai(''); setHienMatKhau(false);
      thongBao.thanhCong('Đã đặt lại mật khẩu. Các phiên cũ đã hết hiệu lực; hãy thông báo mật khẩu mới qua kênh an toàn.');
    } catch (loi) { setLoiMatKhau(loi.message); }
    finally { setDangXuLy(false); }
  };

  const cot = [
    { khoa: 'hoTen', tieuDe: 'Người dùng', render: (_, taiKhoan) => <div className="quanTriTaiKhoanNguoi"><Avatar hoTen={taiKhoan.hoTen} /><span><strong>{taiKhoan.hoTen}</strong><small>{taiKhoan.email}</small></span></div> },
    { khoa: 'soDienThoai', tieuDe: 'Số điện thoại', render: (giaTri) => giaTri || '—' },
    { khoa: 'vaiTro', tieuDe: 'Vai trò', render: (cacVaiTro) => <div className="quanTriTaiKhoanVaiTro">{cacVaiTro.map((item) => <Badge key={item} variant="neutral">{item}</Badge>)}</div> },
    { khoa: 'trangThaiTaiKhoan', tieuDe: 'Trạng thái', render: (giaTri) => <TrangThaiBadge trangThai={giaTri} /> },
    { khoa: 'thaoTac', tieuDe: 'Thao tác', render: (_, taiKhoan) => <Button size="sm" variant="secondary" onClick={() => xemChiTiet(taiKhoan._id)}>Xem</Button> },
  ];
  const dong = (nhan, giaTri) => <div className="quanTriTaiKhoanDong"><dt>{nhan}</dt><dd>{giaTri || '—'}</dd></div>;
  const dangKhoa = xacNhan?.dich === TRANG_THAI_TAI_KHOAN.BI_KHOA;

  return <div className="quanTriTaiKhoanPage">
    <PageHeader title="Tài khoản" description="Xem và quản lý tài khoản Người dùng, Người bán." />
    <form className="quanTriTaiKhoanBoLoc" onSubmit={(event) => { event.preventDefault(); capNhatQuery('tuKhoa', oTim.trim()); }}>
      <Field label="Tìm theo tên, email hoặc số điện thoại"><Input value={oTim} onChange={(event) => setOTim(event.target.value)} maxLength={100} placeholder="Nhập từ khóa" /></Field>
      <Field label="Vai trò"><Select value={vaiTro} onChange={(event) => capNhatQuery('vaiTro', event.target.value)}>
        <option value="">Tất cả</option><option value={VAI_TRO.NGUOI_DUNG}>Người dùng</option><option value={VAI_TRO.NGUOI_BAN}>Người bán</option>
      </Select></Field>
      <Field label="Trạng thái"><Select value={trangThai} onChange={(event) => capNhatQuery('trangThaiTaiKhoan', event.target.value)}>
        <option value="">Tất cả</option><option value={TRANG_THAI_TAI_KHOAN.HOAT_DONG}>Hoạt động</option><option value={TRANG_THAI_TAI_KHOAN.BI_KHOA}>Bị khóa</option>
      </Select></Field>
      <Button type="submit" variant="secondary">Tìm kiếm</Button>
    </form>
    {dangTai ? <Skeleton variant="block" count={3} /> : loiTai ? <ErrorState message={loiTai} taiLai={() => setLanTai((lan) => lan + 1)} />
      : duLieu.danhSach.length ? <><p className="quanTriTaiKhoanSoLuong">{duLieu.phanTrang.tongSo} tài khoản</p><DataTable cot={cot} hang={duLieu.danhSach} khoaHang="_id" />
        <Pagination trang={duLieu.phanTrang.trang} tongTrang={duLieu.phanTrang.tongTrang} onChange={(moi) => capNhatQuery('trang', moi === 1 ? '' : String(moi))} /></>
        : <EmptyState icon="user" title="Không có tài khoản phù hợp" description="Thử thay đổi từ khóa hoặc bộ lọc." />}

    <Modal open={Boolean(idChiTiet) && !xacNhan && !moMatKhau} onClose={() => setIdChiTiet(null)} title="Chi tiết tài khoản">
      {dangTaiChiTiet ? <Skeleton variant="block" count={2} /> : loiChiTiet ? <ErrorState message={loiChiTiet} taiLai={() => xemChiTiet(idChiTiet)} /> : chiTiet && <div className="quanTriTaiKhoanChiTiet">
        <dl>{dong('Họ tên', chiTiet.hoTen)}{dong('Email', chiTiet.email)}{dong('Ngày sinh', chiTiet.ngaySinh && dinhDangNgay(chiTiet.ngaySinh))}
          {dong('Giới tính', chiTiet.gioiTinh)}{dong('Số điện thoại', chiTiet.soDienThoai)}{dong('Địa chỉ nhận hàng', chiTiet.diaChiNhanHang)}
          {dong('Vai trò', chiTiet.vaiTro.join(', '))}{dong('Trạng thái', chiTiet.trangThaiTaiKhoan)}</dl>
        {chiTiet.cuaHang && <section className="quanTriTaiKhoanCuaHang"><h3>Cửa hàng</h3><p>{chiTiet.cuaHang.tenCuaHang} · {chiTiet.cuaHang.trangThaiHoatDong}</p>
          <Link to={`${DUONG_DAN.QUAN_TRI_VIEN.CUA_HANG}?tuKhoa=${encodeURIComponent(chiTiet.cuaHang.tenCuaHang)}`} onClick={() => setIdChiTiet(null)}>Xem trong mục Cửa hàng</Link></section>}
        <div className="quanTriTaiKhoanHanhDong"><Button variant="secondary" onClick={() => { setMoMatKhau(true); setLoiMatKhau(''); }}>Đặt lại mật khẩu</Button>
          <Button variant={chiTiet.trangThaiTaiKhoan === TRANG_THAI_TAI_KHOAN.HOAT_DONG ? 'danger' : 'primary'}
            onClick={() => { setXacNhan({ _id: chiTiet._id, hoTen: chiTiet.hoTen, laNguoiBan: chiTiet.vaiTro.includes(VAI_TRO.NGUOI_BAN),
              dich: chiTiet.trangThaiTaiKhoan === TRANG_THAI_TAI_KHOAN.HOAT_DONG ? TRANG_THAI_TAI_KHOAN.BI_KHOA : TRANG_THAI_TAI_KHOAN.HOAT_DONG }); setLoiXuLy(''); }}>
            {chiTiet.trangThaiTaiKhoan === TRANG_THAI_TAI_KHOAN.HOAT_DONG ? 'Khóa tài khoản' : 'Mở khóa'}</Button></div>
      </div>}
    </Modal>
    <ConfirmDialog open={Boolean(xacNhan)} onClose={() => { if (!dangXuLy) setXacNhan(null); }} onConfirm={capNhatTrangThai}
      title={dangKhoa ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
      message={loiXuLy || `${dangKhoa ? 'Khóa' : 'Mở khóa'} tài khoản “${xacNhan?.hoTen}”?${dangKhoa && xacNhan?.laNguoiBan ? ' Cửa hàng của tài khoản này vẫn hiển thị. Hãy cân nhắc ngừng hoạt động cửa hàng ở mục Cửa hàng.' : ''}`}
      confirmLabel={dangKhoa ? 'Khóa tài khoản' : 'Mở khóa'} danger={dangKhoa} loading={dangXuLy} />
    <Modal open={moMatKhau} onClose={dongMatKhau} title="Đặt lại mật khẩu">
      <form className="quanTriTaiKhoanFormMatKhau" onSubmit={datLaiMatKhau} noValidate>
        <p>Tối thiểu 8 ký tự. Sau khi lưu, các thiết bị đang đăng nhập phải đăng nhập lại. Hãy báo mật khẩu mới qua kênh an toàn.</p>
        <Field label="Mật khẩu mới" required><Input type={hienMatKhau ? 'text' : 'password'} autoComplete="new-password" value={matKhauMoi} onChange={(event) => { setMatKhauMoi(event.target.value); setLoiMatKhau(''); }} /></Field>
        <Field label="Nhập lại mật khẩu mới" required error={loiMatKhau}><Input type={hienMatKhau ? 'text' : 'password'} autoComplete="new-password" value={nhapLai} onChange={(event) => { setNhapLai(event.target.value); setLoiMatKhau(''); }} /></Field>
        <label className="quanTriTaiKhoanHienMatKhau"><input type="checkbox" checked={hienMatKhau} onChange={(event) => setHienMatKhau(event.target.checked)} /> Hiện mật khẩu</label>
        <div className="quanTriTaiKhoanHanhDong"><Button variant="secondary" onClick={dongMatKhau} disabled={dangXuLy}>Hủy</Button><Button type="submit" loading={dangXuLy}>Đặt lại mật khẩu</Button></div>
      </form>
    </Modal>
  </div>;
}
