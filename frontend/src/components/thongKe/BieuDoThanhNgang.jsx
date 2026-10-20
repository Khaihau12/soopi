import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import EmptyState from '../ui/EmptyState.jsx';
import { dinhDangTien } from '../../utils/dinhDang.js';
import { layMauToken } from '../../utils/mauSac.js';
import './ThongKe.css';

const dinhDangSo = (so) => new Intl.NumberFormat('vi-VN').format(so);

export default function BieuDoThanhNgang({ duLieu = [] }) {
  const [mau, setMau] = useState({});
  const [giamChuyenDong, setGiamChuyenDong] = useState(false);
  useEffect(() => {
    setMau({ luoi: layMauToken('--mauLuoiBieuDo'), bieuDo: layMauToken('--mauBieuDo2'), chu: layMauToken('--chuPhu') });
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setGiamChuyenDong(media.matches);
    const capNhat = (event) => setGiamChuyenDong(event.matches);
    media.addEventListener('change', capNhat);
    return () => media.removeEventListener('change', capNhat);
  }, []);
  if (!duLieu.length) return <EmptyState title="Chưa có danh mục bán ra trong kỳ này" />;
  const hang = duLieu.map((item) => ({ ten: item.danhMuc?.tenDanhMuc || 'Danh mục không còn tồn tại', soLuongDaBan: item.soLuongDaBan, doanhThu: item.doanhThu }));
  return <div className="bieuDoKhung">
    <div className="bieuDoThanhCuon"><div className="bieuDoThanhNgang" style={{ height: Math.max(260, hang.length * 48) }} role="img" aria-label={`Biểu đồ danh mục được quan tâm, tính theo số lượng đã bán. Cao nhất: ${hang[0].ten}, ${dinhDangSo(hang[0].soLuongDaBan)} sản phẩm.`}>
      <ResponsiveContainer width="100%" height="100%"><BarChart data={hang} layout="vertical" margin={{ top: 8, right: 20, left: 12, bottom: 8 }}>
        <CartesianGrid stroke={mau.luoi} strokeDasharray="3 3" />
        <XAxis type="number" allowDecimals={false} stroke={mau.chu} />
        <YAxis type="category" dataKey="ten" width={150} stroke={mau.chu} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(giaTri) => [dinhDangSo(giaTri), 'Số lượng đã bán']} />
        <Bar dataKey="soLuongDaBan" fill={mau.bieuDo} isAnimationActive={!giamChuyenDong} />
      </BarChart></ResponsiveContainer>
    </div></div>
    <details><summary>Xem dạng bảng</summary><div className="bieuDoBangWrap"><table><thead><tr><th scope="col">Danh mục</th><th scope="col">Đã bán</th><th scope="col">Doanh thu dòng hàng</th></tr></thead><tbody>{hang.map((item, index) => <tr key={`${item.ten}-${index}`}><th scope="row">{item.ten}</th><td>{dinhDangSo(item.soLuongDaBan)}</td><td>{dinhDangTien(item.doanhThu)}</td></tr>)}</tbody></table></div></details>
  </div>;
}
