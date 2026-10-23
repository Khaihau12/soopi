import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import TaiAnhLen from '../../components/TaiAnhLen.jsx';
import TrangThaiBadge from '../../components/TrangThaiBadge.jsx';
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
import Textarea from '../../components/ui/Textarea.jsx';
import useThongBao from '../../hooks/useThongBao.js';
import { quanTriCapNhatBanner, quanTriCapNhatTrangThaiBanner, quanTriLayDanhSachBanner, quanTriTaoBanner, quanTriXoaBanner } from '../../services/bannerQuangCao.api.js';
import { layDanhSachDanhMuc } from '../../services/danhMuc.api.js';
import { taoUrlAnh } from '../../utils/dinhDang.js';
import { TRANG_THAI_BANNER } from '../../utils/hangSo.js';
import './QuanTriF25.css';

const formRong = { tieuDe: '', noiDung: '', hinhAnh: '', danhMucId: '' };

export default function BannerQuanTriPage() {
  const thongBao = useThongBao();
  const [params, setParams] = useSearchParams();
  const [duLieu, setDuLieu] = useState({ danhSach: [], phanTrang: { trang: 1, tongTrang: 0 } });
  const [danhMuc, setDanhMuc] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const [form, setForm] = useState(null);
  const [loiForm, setLoiForm] = useState({});
  const [dangLuu, setDangLuu] = useState(false);
  const [xacNhan, setXacNhan] = useState(null);
  const [loiXuLy, setLoiXuLy] = useState('');
  const [dangXuLy, setDangXuLy] = useState(false);
  useEffect(() => {
    let conHieuLuc = true;
    layDanhSachDanhMuc().then((data) => { if (conHieuLuc) setDanhMuc(data.danhSach); }).catch(() => {});
    return () => { conHieuLuc = false; };
  }, []);
  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoi('');
    quanTriLayDanhSachBanner(Object.fromEntries(params))
      .then((data) => { if (conHieuLuc) setDuLieu(data); })
      .catch((err) => { if (conHieuLuc) setLoi(err.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [params, lanTai]);
  const suaQuery = (ten, giaTri) => {
    const moi = new URLSearchParams(params);
    if (giaTri) moi.set(ten, giaTri); else moi.delete(ten);
    if (ten !== 'trang') moi.delete('trang');
    setParams(moi);
  };
  const moForm = (banner = null) => { setLoiForm({}); setForm(banner ? { _id: banner._id, tieuDe: banner.tieuDe, noiDung: banner.noiDung || '', hinhAnh: banner.hinhAnh, danhMucId: banner.danhMucId || '' } : { ...formRong }); };
  const luuBanner = async (event) => {
    event.preventDefault();
    if (dangLuu) return;
    const moi = {};
    if (!form.tieuDe.trim()) moi.tieuDe = 'Vui lòng nhập tiêu đề banner.';
    if (!form.hinhAnh) moi.hinhAnh = 'Vui lòng tải một ảnh banner.';
    if (!form.danhMucId) moi.danhMucId = 'Vui lòng chọn danh mục banner sẽ dẫn đến.';
    if (Object.keys(moi).length) { setLoiForm(moi); return; }
    setDangLuu(true); setLoiForm({});
    try {
      const body = { tieuDe: form.tieuDe.trim(), noiDung: form.noiDung.trim(), hinhAnh: form.hinhAnh, danhMucId: form.danhMucId };
      if (form._id) await quanTriCapNhatBanner(form._id, body); else await quanTriTaoBanner(body);
      thongBao.thanhCong(form._id ? 'Đã cập nhật banner.' : 'Đã thêm banner.');
      setForm(null); setLanTai((so) => so + 1);
    } catch (err) { setLoiForm({ chung: err.message }); }
    finally { setDangLuu(false); }
  };
  const xuLyXacNhan = async () => {
    if (!xacNhan || dangXuLy) return;
    setDangXuLy(true); setLoiXuLy('');
    try {
      if (xacNhan.loai === 'xoa') await quanTriXoaBanner(xacNhan.banner._id);
      else await quanTriCapNhatTrangThaiBanner(xacNhan.banner._id, TRANG_THAI_BANNER.VO_HIEU_HOA);
      thongBao.thanhCong(xacNhan.loai === 'xoa' ? 'Đã xóa banner.' : 'Đã tắt banner.');
      setXacNhan(null); setLanTai((so) => so + 1);
    } catch (err) { setLoiXuLy(err.message); }
    finally { setDangXuLy(false); }
  };
  const batBanner = async (banner) => {
    try { await quanTriCapNhatTrangThaiBanner(banner._id, TRANG_THAI_BANNER.KICH_HOAT); thongBao.thanhCong('Đã bật banner.'); setLanTai((so) => so + 1); }
    catch (err) { setLoi(err.message); }
  };
  const cot = [
    { khoa: 'hinhAnh', tieuDe: 'Hình', render: (giaTri, item) => <img className="qtF25BannerAnh" src={taoUrlAnh(giaTri)} alt={item.tieuDe} /> },
    { khoa: 'tieuDe', tieuDe: 'Tiêu đề' },
    { khoa: 'noiDung', tieuDe: 'Nội dung', render: (giaTri) => <span className="qtF25RutGon">{giaTri || '—'}</span> },
    { khoa: 'danhMucId', tieuDe: 'Dẫn đến', render: (giaTri) => danhMuc.find((muc) => muc._id === giaTri)?.tenDanhMuc || 'Chưa chọn danh mục' },
    { khoa: 'trangThai', tieuDe: 'Trạng thái', render: (giaTri, item) => <div className="qtF25Actions"><TrangThaiBadge trangThai={giaTri} /><label className="qtF25Switch"><input type="checkbox" checked={giaTri === TRANG_THAI_BANNER.KICH_HOAT} aria-label={`${giaTri === TRANG_THAI_BANNER.KICH_HOAT ? 'Tắt' : 'Bật'} banner ${item.tieuDe}`} onChange={(event) => { if (event.target.checked) batBanner(item); else { setLoiXuLy(''); setXacNhan({ loai: 'tat', banner: item }); } }} /><span>{giaTri === TRANG_THAI_BANNER.KICH_HOAT ? 'Bật' : 'Tắt'}</span></label></div> },
    { khoa: 'thaoTac', tieuDe: 'Thao tác', render: (_, item) => <div className="qtF25Actions"><Button size="sm" variant="secondary" onClick={() => moForm(item)}>Sửa</Button><Button size="sm" variant="danger" onClick={() => { setLoiXuLy(''); setXacNhan({ loai: 'xoa', banner: item }); }}>Xóa</Button></div> },
  ];
  return <div className="qtF25Page">
    <PageHeader title="Banner quảng cáo" description="Giới thiệu danh mục trên trang chủ và dẫn khách đến sản phẩm phù hợp." actions={<Button onClick={() => moForm()}>Thêm banner</Button>} />
    <div className="qtF25Filters"><Field label="Trạng thái"><Select value={params.get('trangThai') || ''} onChange={(event) => suaQuery('trangThai', event.target.value)}><option value="">Tất cả</option>{Object.values(TRANG_THAI_BANNER).map((giaTri) => <option key={giaTri}>{giaTri}</option>)}</Select></Field></div>
    {dangTai ? <Skeleton variant="block" count={3} /> : loi ? <ErrorState message={loi} taiLai={() => { setLoi(''); setLanTai((so) => so + 1); }} /> : duLieu.danhSach.length ? <><DataTable cot={cot} hang={duLieu.danhSach} khoaHang="_id" /><Pagination trang={duLieu.phanTrang.trang} tongTrang={duLieu.phanTrang.tongTrang} onChange={(so) => suaQuery('trang', so === 1 ? '' : String(so))} /></> : <EmptyState title="Chưa có banner nào" description="Thêm banner để giới thiệu nội dung trên trang chủ." />}
    <Modal open={Boolean(form)} onClose={dangLuu ? undefined : () => setForm(null)} title={form?._id ? 'Sửa banner' : 'Thêm banner'}>
      {form && <form className="qtF25Form" onSubmit={luuBanner}>
        <Field label="Tiêu đề" required error={loiForm.tieuDe}><Input value={form.tieuDe} onChange={(event) => setForm({ ...form, tieuDe: event.target.value })} maxLength={200} /></Field>
        <Field label="Nội dung" error={loiForm.noiDung}><Textarea value={form.noiDung} onChange={(event) => setForm({ ...form, noiDung: event.target.value })} maxLength={1000} /></Field>
        <Field label="Dẫn đến danh mục" required error={loiForm.danhMucId}><Select value={form.danhMucId} onChange={(event) => setForm({ ...form, danhMucId: event.target.value })}><option value="">Chọn danh mục</option>{danhMuc.map((muc) => <option key={muc._id} value={muc._id}>{muc.tenDanhMuc}</option>)}</Select></Field>
        <div className="field"><label className="fieldLabel">Hình ảnh *</label><p className="fieldHint">Ảnh ngang tỷ lệ 16:9, JPG/PNG/WEBP, tối đa 5 MB.</p><TaiAnhLen value={form.hinhAnh ? [form.hinhAnh] : []} onChange={(anh) => setForm((truoc) => ({ ...truoc, hinhAnh: anh[0] || '' }))} toiDa={1} loaiAnh="banner" disabled={dangLuu} />{loiForm.hinhAnh && <p className="fieldError">{loiForm.hinhAnh}</p>}</div>
        {loiForm.chung && <p className="qtF25Loi" role="alert">{loiForm.chung}</p>}
        <div className="qtF25Actions"><Button type="button" variant="secondary" onClick={() => setForm(null)} disabled={dangLuu}>Hủy</Button><Button type="submit" loading={dangLuu}>Lưu banner</Button></div>
      </form>}
    </Modal>
    <ConfirmDialog open={Boolean(xacNhan)} onClose={() => { if (!dangXuLy) setXacNhan(null); }} onConfirm={xuLyXacNhan} title={xacNhan?.loai === 'xoa' ? 'Xóa banner' : 'Tắt banner'} message={loiXuLy || (xacNhan?.loai === 'xoa' ? `Xóa hẳn banner “${xacNhan?.banner.tieuDe}”? Thao tác này không thể hoàn tác.` : `Tắt banner “${xacNhan?.banner.tieuDe}”? Banner sẽ biến mất khỏi trang chủ.`)} confirmLabel={xacNhan?.loai === 'xoa' ? 'Xóa banner' : 'Tắt banner'} danger loading={dangXuLy} />
  </div>;
}
