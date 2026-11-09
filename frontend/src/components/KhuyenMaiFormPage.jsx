import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import KhuyenMaiForm from './KhuyenMaiForm.jsx';
import ErrorState from './ui/ErrorState.jsx';
import PageHeader from './ui/PageHeader.jsx';
import Skeleton from './ui/Skeleton.jsx';
import useThongBao from '../hooks/useThongBao.js';
import * as api from '../services/khuyenMai.api.js';
import { DUONG_DAN } from '../utils/hangSo.js';

export default function KhuyenMaiFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const thongBao = useThongBao();
  const [khuyenMai, setKhuyenMai] = useState(null);
  const [dangTai, setDangTai] = useState(Boolean(id));
  const [loiTai, setLoiTai] = useState('');
  const [loiGui, setLoiGui] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const duongDanVe = DUONG_DAN.NGUOI_BAN.KHUYEN_MAI;
  const taiLai = async () => {
    if (!id) return;
    setDangTai(true); setLoiTai('');
    try {
      const data = await api.nguoiBanLayChiTietKhuyenMai(id);
      setKhuyenMai(data.khuyenMai);
    } catch (loi) { setLoiTai(loi.message); }
    finally { setDangTai(false); }
  };
  useEffect(() => { taiLai(); }, [id]);
  const luu = async (duLieu) => {
    if (dangGui) return;
    setDangGui(true); setLoiGui('');
    try {
      if (id) await api.nguoiBanCapNhatKhuyenMai(id, duLieu);
      else await api.nguoiBanTaoKhuyenMai(duLieu);
      thongBao.thanhCong(id ? 'Cập nhật khuyến mãi thành công' : 'Tạo khuyến mãi thành công');
      navigate(duongDanVe);
    } catch (loi) { setLoiGui(loi.message); }
    finally { setDangGui(false); }
  };
  return <div>
    <PageHeader title={id ? 'Sửa chương trình khuyến mãi' : 'Tạo chương trình khuyến mãi'} description="Chọn sản phẩm thuộc cửa hàng bạn và đặt mức giảm." />
    {dangTai ? <Skeleton variant="block" count={2} /> : loiTai ? <ErrorState message={loiTai} taiLai={taiLai} /> : <KhuyenMaiForm key={id || 'them'} khuyenMai={khuyenMai} onSubmit={luu} dangGui={dangGui} loiChung={loiGui} onCancel={() => navigate(duongDanVe)} />}
  </div>;
}
