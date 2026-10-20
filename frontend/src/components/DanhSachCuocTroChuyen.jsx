import EmptyState from './ui/EmptyState.jsx';
import ErrorState from './ui/ErrorState.jsx';
import Pagination from './ui/Pagination.jsx';
import Skeleton from './ui/Skeleton.jsx';
import { dinhDangNgayGio } from '../utils/dinhDang.js';

export default function DanhSachCuocTroChuyen({ duLieu, dangTai, loi, taiLai, nguoiBan, daChonId, onChon, onTrang }) {
  if (dangTai && !duLieu) return <Skeleton variant="block" count={3} />;
  if (loi && !duLieu) return <ErrorState message={loi} taiLai={taiLai} />;
  if (!duLieu?.danhSach.length) return <EmptyState icon="chat" title={nguoiBan ? 'Chưa có tin nhắn nào từ khách hàng' : 'Bạn chưa có cuộc trò chuyện nào'}
    description={nguoiBan ? 'Tin nhắn của khách gửi đến cửa hàng sẽ xuất hiện tại đây.' : 'Bạn có thể nhắn tin từ trang sản phẩm hoặc chi tiết đơn hàng.'} />;
  return <><div className="troChuyenDanhSach">{duLieu.danhSach.map((cuoc) => <button key={cuoc._id} type="button"
    className={`troChuyenMuc ${daChonId === cuoc._id ? 'dangChon' : ''}`} onClick={() => onChon(cuoc)}>
    <strong>{nguoiBan ? cuoc.nguoiDung.hoTen : cuoc.cuaHang.tenCuaHang}</strong>
    <span>{cuoc.tinNhanCuoi?.noiDung || 'Chưa có tin nhắn'}</span>
    <time dateTime={cuoc.thoiGianCapNhat}>{dinhDangNgayGio(cuoc.thoiGianCapNhat)}</time>
  </button>)}</div><Pagination trang={duLieu.phanTrang.trang} tongTrang={duLieu.phanTrang.tongTrang} onChange={onTrang} /></>;
}
