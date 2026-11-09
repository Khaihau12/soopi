import { useEffect, useState } from 'react';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { nguoiBanLayLichSuTonKho } from '../../services/sanPham.api.js';
import { dinhDangNgayGio } from '../../utils/dinhDang.js';

export default function LichSuTonKhoModal({ sanPham, onClose }) {
  const [trang, setTrang] = useState(1);
  const [duLieu, setDuLieu] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);

  useEffect(() => {
    let daHuy = false;
    setDangTai(true);
    setLoi('');
    nguoiBanLayLichSuTonKho(sanPham._id, { trang }).then((ketQua) => {
      if (!daHuy) setDuLieu(ketQua);
    }).catch((error) => { if (!daHuy) setLoi(error.message); })
      .finally(() => { if (!daHuy) setDangTai(false); });
    return () => { daHuy = true; };
  }, [sanPham._id, trang, lanTai]);

  return <Modal open onClose={onClose} title="Lịch sử tồn kho" className="sanPhamBanLichSuModal">
    <div className="sanPhamBanLichSu">
      <div className="sanPhamBanLichSuDau">
        <strong>{sanPham.tenSanPham}</strong>
        {duLieu && <span>Hiện còn <strong>{duLieu.sanPham.soLuongTon}</strong> sản phẩm</span>}
      </div>
      <p className="sanPhamBanGhiChu">Hiển thị tối đa 300 biến động gần nhất, kể từ khi chức năng này được bật. Các thay đổi ngưỡng cảnh báo không làm thay đổi tồn kho.</p>
      {dangTai ? <Skeleton variant="block" count={2} /> : loi ? <ErrorState message={loi} taiLai={() => setLanTai((so) => so + 1)} />
        : !duLieu?.danhSach.length ? <EmptyState title="Chưa có biến động" description="Các lần nhập, bán và hoàn kho mới sẽ xuất hiện tại đây." />
          : <ol className="sanPhamBanDongLichSu">{duLieu.danhSach.map((dong) => <li key={dong._id}>
            <div className="sanPhamBanDongLichSuTren"><strong>{dong.loai}</strong><span className={dong.soLuongThayDoi > 0 ? 'sanPhamBanTang' : 'sanPhamBanGiam'}>
              {dong.soLuongThayDoi > 0 ? '+' : ''}{dong.soLuongThayDoi}
            </span></div>
            <div className="sanPhamBanDongLichSuDuoi"><span>{dinhDangNgayGio(dong.ngayTao)}</span><span>{dong.soLuongTruoc} → {dong.soLuongSau} sản phẩm</span></div>
          </li>)}</ol>}
      {duLieu?.phanTrang && <Pagination trang={trang} tongTrang={duLieu.phanTrang.tongTrang} onChange={setTrang} />}
    </div>
  </Modal>;
}
