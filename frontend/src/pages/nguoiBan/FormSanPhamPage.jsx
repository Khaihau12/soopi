import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import SanPhamForm from '../../components/SanPhamForm.jsx';
import useThongBao from '../../hooks/useThongBao.js';
import { layDanhSachDanhMuc } from '../../services/danhMuc.api.js';
import { nguoiBanLayChiTietSanPham, nguoiBanTaoSanPham, nguoiBanCapNhatSanPham } from '../../services/sanPham.api.js';
import { DUONG_DAN } from '../../utils/hangSo.js';

export default function FormSanPhamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const thongBao = useThongBao();
  const [sanPham, setSanPham] = useState(null);
  const [danhMuc, setDanhMuc] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loiTai, setLoiTai] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [loiGui, setLoiGui] = useState('');

  const taiDuLieu = async () => {
    setDangTai(true); setLoiTai('');
    try {
      const [duLieuDanhMuc, duLieuSanPham] = await Promise.all([layDanhSachDanhMuc(), id ? nguoiBanLayChiTietSanPham(id) : Promise.resolve(null)]);
      setDanhMuc(duLieuDanhMuc.danhSach || []);
      setSanPham(duLieuSanPham?.sanPham || null);
    } catch (loi) { setLoiTai(loi.message); }
    finally { setDangTai(false); }
  };
  useEffect(() => { taiDuLieu(); }, [id]);

  const luu = async (duLieu) => {
    if (dangGui) return;
    setDangGui(true); setLoiGui('');
    try {
      if (id) await nguoiBanCapNhatSanPham(id, duLieu);
      else await nguoiBanTaoSanPham(duLieu);
      thongBao.thanhCong(id ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm thành công');
      navigate(DUONG_DAN.NGUOI_BAN.SAN_PHAM);
    } catch (loi) { setLoiGui(loi.message); }
    finally { setDangGui(false); }
  };

  return <div>
    <PageHeader title={id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'} description="Quản lý thông tin, hình ảnh và giá của sản phẩm thuộc cửa hàng bạn." />
    {dangTai ? <Skeleton variant="block" count={3} /> : loiTai ? <ErrorState message={loiTai} taiLai={taiDuLieu} /> : <>
      {danhMuc.length === 0 && <p>Chưa có danh mục để chọn. Vui lòng liên hệ Quản trị viên.</p>}
      <SanPhamForm key={id || 'them'} sanPham={sanPham} danhMuc={danhMuc} onSubmit={luu} dangGui={dangGui} loiChung={loiGui} />
    </>}
    <Button variant="ghost" to={DUONG_DAN.NGUOI_BAN.SAN_PHAM}>Quay lại danh sách</Button>
  </div>;
}
