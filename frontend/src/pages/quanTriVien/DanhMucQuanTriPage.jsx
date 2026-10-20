import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Field from '../../components/ui/Field.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import useThongBao from '../../hooks/useThongBao.js';
import * as danhMucApi from '../../services/danhMuc.api.js';
import './DanhMucQuanTriPage.css';

export default function DanhMucQuanTriPage() {
  const thongBao = useThongBao();
  const [danhSach, setDanhSach] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loiTai, setLoiTai] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [danhMucSua, setDanhMucSua] = useState(null);
  const [moForm, setMoForm] = useState(false);
  const [tenDanhMuc, setTenDanhMuc] = useState('');
  const [loiTen, setLoiTen] = useState('');
  const [danhMucXoa, setDanhMucXoa] = useState(null);
  const [loiXoa, setLoiXoa] = useState('');

  const taiLai = async () => {
    setDangTai(true); setLoiTai('');
    try {
      const { danhSach: moi } = await danhMucApi.quanTriLayDanhSachDanhMuc();
      setDanhSach(moi);
    } catch (loi) { setLoiTai(loi.message); }
    finally { setDangTai(false); }
  };
  useEffect(() => { taiLai(); }, []);
  useEffect(() => {
    if (!moForm) return undefined;
    const id = requestAnimationFrame(() => document.getElementById('ten-danh-muc')?.focus());
    return () => cancelAnimationFrame(id);
  }, [moForm]);

  const moThem = () => { setDanhMucSua(null); setTenDanhMuc(''); setLoiTen(''); setMoForm(true); };
  const moSua = (danhMuc) => { setDanhMucSua(danhMuc); setTenDanhMuc(danhMuc.tenDanhMuc); setLoiTen(''); setMoForm(true); };
  const dongForm = () => { if (!dangGui) setMoForm(false); };
  const moXoa = (danhMuc) => { setDanhMucXoa(danhMuc); setLoiXoa(''); };
  const dongXoa = () => { if (!dangGui) setDanhMucXoa(null); };

  const luuDanhMuc = async (event) => {
    event.preventDefault();
    const tenChuan = tenDanhMuc.trim();
    if (!tenChuan) { setLoiTen('Vui lòng nhập tên danh mục.'); document.getElementById('ten-danh-muc')?.focus(); return; }
    if (tenChuan.length > 100) { setLoiTen('Tên danh mục không được quá 100 ký tự.'); document.getElementById('ten-danh-muc')?.focus(); return; }
    setDangGui(true); setLoiTen('');
    try {
      if (danhMucSua) await danhMucApi.quanTriSuaDanhMuc(danhMucSua._id, tenChuan);
      else await danhMucApi.quanTriThemDanhMuc(tenChuan);
      setMoForm(false);
      thongBao.thanhCong(danhMucSua ? 'Cập nhật danh mục thành công' : 'Thêm danh mục thành công');
      await taiLai();
    } catch (loi) { setLoiTen(loi.message); }
    finally { setDangGui(false); }
  };

  const xoaDanhMuc = async () => {
    setDangGui(true); setLoiXoa('');
    try {
      await danhMucApi.quanTriXoaDanhMuc(danhMucXoa._id);
      setDanhMucXoa(null);
      thongBao.thanhCong('Xóa danh mục thành công');
      await taiLai();
    } catch (loi) { setLoiXoa(loi.message); }
    finally { setDangGui(false); }
  };

  const cot = [
    { khoa: 'tenDanhMuc', tieuDe: 'Tên danh mục' },
    { khoa: 'soSanPham', tieuDe: 'Số sản phẩm' },
    { khoa: 'thaoTac', tieuDe: 'Thao tác', render: (_, danhMuc) => <div className="danhMucActions"><Button variant="ghost" size="sm" onClick={() => moSua(danhMuc)} aria-label={`Sửa danh mục ${danhMuc.tenDanhMuc}`}>Sửa</Button><Button variant="ghost" size="sm" className="danhMucDelete" onClick={() => moXoa(danhMuc)} aria-label={`Xóa danh mục ${danhMuc.tenDanhMuc}`}>Xóa</Button></div> },
  ];

  const thongBaoXoa = danhMucXoa && (
    loiXoa || `Xóa danh mục “${danhMucXoa.tenDanhMuc}”? Thao tác này không thể hoàn tác.${danhMucXoa.soSanPham > 0 ? ` Danh mục đang có ${danhMucXoa.soSanPham} sản phẩm, hệ thống sẽ không cho xóa. Hãy chuyển các sản phẩm sang danh mục khác trước.` : ''}`
  );

  return <div className="danhMucPage">
    <PageHeader title="Danh mục sản phẩm" description="Quản lý các nhóm sản phẩm trên Soopi." actions={<Button onClick={moThem}>Thêm danh mục</Button>} />
    {dangTai ? <Skeleton variant="block" count={3} /> : loiTai ? <ErrorState message={loiTai} taiLai={taiLai} /> : danhSach.length === 0 ? <EmptyState title="Chưa có danh mục nào" description="Thêm danh mục để phân loại sản phẩm." actionLabel="Thêm danh mục" onAction={moThem} /> : <DataTable cot={cot} hang={danhSach} khoaHang="_id" />}

    <Modal open={moForm} onClose={dangGui ? undefined : dongForm} title={danhMucSua ? 'Sửa danh mục' : 'Thêm danh mục'}>
      <form className="danhMucForm" noValidate onSubmit={luuDanhMuc}>
        <Field label="Tên danh mục" required error={loiTen}><Input id="ten-danh-muc" value={tenDanhMuc} maxLength={101} onChange={(event) => { setTenDanhMuc(event.target.value); setLoiTen(''); }} /></Field>
        <div className="danhMucFormActions"><Button variant="secondary" onClick={dongForm} disabled={dangGui}>Hủy</Button><Button type="submit" loading={dangGui}>Lưu</Button></div>
      </form>
    </Modal>
    <ConfirmDialog open={Boolean(danhMucXoa)} onClose={dongXoa} onConfirm={xoaDanhMuc} title="Xóa danh mục" message={thongBaoXoa} confirmLabel="Xóa danh mục" danger loading={dangGui} />
  </div>;
}
