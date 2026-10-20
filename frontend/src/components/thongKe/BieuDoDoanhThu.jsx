import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import EmptyState from '../ui/EmptyState.jsx';
import { dinhDangTien } from '../../utils/dinhDang.js';
import { layMauToken } from '../../utils/mauSac.js';
import './ThongKe.css';

const dinhDangSo = (so) => new Intl.NumberFormat('vi-VN').format(so);
const nhanMoc = (moc) => moc.length === 7 ? `${moc.slice(5, 7)}/${moc.slice(0, 4)}` : `${moc.slice(8, 10)}/${moc.slice(5, 7)}/${moc.slice(0, 4)}`;
const rutGon = (so) => so >= 1000000 ? `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(so / 1000000)} tr` : so >= 1000 ? `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(so / 1000)} nghìn` : dinhDangSo(so);

export default function BieuDoDoanhThu({ duLieu = [], chiSo = 'doanhThu', kieu = 'cot' }) {
  const [mau, setMau] = useState({});
  const [giamChuyenDong, setGiamChuyenDong] = useState(false);
  useEffect(() => {
    setMau({ luoi: layMauToken('--mauLuoiBieuDo'), bieuDo: layMauToken('--mauBieuDo1'), chu: layMauToken('--chuPhu') });
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setGiamChuyenDong(media.matches);
    const capNhat = (event) => setGiamChuyenDong(event.matches);
    media.addEventListener('change', capNhat);
    return () => media.removeEventListener('change', capNhat);
  }, []);
  if (!duLieu.length) return <EmptyState title="Chưa có dữ liệu biểu đồ" />;
  const tong = duLieu.reduce((so, item) => so + item[chiSo], 0);
  const caoNhat = duLieu.reduce((cao, item) => item[chiSo] > cao[chiSo] ? item : cao, duLieu[0]);
  const tenChiSo = chiSo === 'doanhThu' ? 'doanh thu' : 'số đơn';
  const truc = <><CartesianGrid stroke={mau.luoi} strokeDasharray="3 3" /><XAxis dataKey="moc" tickFormatter={nhanMoc} interval="preserveStartEnd" minTickGap={26} stroke={mau.chu} /><YAxis tickFormatter={rutGon} width={72} stroke={mau.chu} /><Tooltip labelFormatter={nhanMoc} formatter={(giaTri) => [chiSo === 'doanhThu' ? dinhDangTien(giaTri) : dinhDangSo(giaTri), chiSo === 'doanhThu' ? 'Doanh thu' : 'Số đơn']} /></>;
  return <div className="bieuDoKhung">
    <div className="bieuDoDoanhThu" role="img" aria-label={`Biểu đồ ${tenChiSo}: tổng ${chiSo === 'doanhThu' ? dinhDangTien(tong) : dinhDangSo(tong)}, cao nhất ${nhanMoc(caoNhat.moc)} với ${chiSo === 'doanhThu' ? dinhDangTien(caoNhat[chiSo]) : dinhDangSo(caoNhat[chiSo])}`}>
      <ResponsiveContainer width="100%" height="100%">
        {kieu === 'duong' ? <LineChart data={duLieu} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>{truc}<Line type="monotone" dataKey={chiSo} stroke={mau.bieuDo} strokeWidth={2} dot={false} isAnimationActive={!giamChuyenDong} /></LineChart>
          : <BarChart data={duLieu} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>{truc}<Bar dataKey={chiSo} fill={mau.bieuDo} isAnimationActive={!giamChuyenDong} /></BarChart>}
      </ResponsiveContainer>
    </div>
    <details><summary>Xem dạng bảng</summary><div className="bieuDoBangWrap"><table><thead><tr><th scope="col">Mốc</th><th scope="col">Doanh thu</th><th scope="col">Số đơn</th></tr></thead><tbody>{duLieu.map((item) => <tr key={item.moc}><th scope="row">{nhanMoc(item.moc)}</th><td>{dinhDangTien(item.doanhThu)}</td><td>{dinhDangSo(item.soDon)}</td></tr>)}</tbody></table></div></details>
  </div>;
}
