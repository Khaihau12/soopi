import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import { layChiTietYeuCauCuaToi, layDanhSachYeuCauCuaToi } from '../services/doiTraKhieuNai.api.js';
import { dinhDangNgayGio, maDonHangHienThi, taoUrlAnh } from '../utils/dinhDang.js';
import { DUONG_DAN, KET_QUA_XU_LY, LOAI_YEU_CAU, MAU_TRANG_THAI, TRANG_THAI_XU_LY_YEU_CAU } from '../utils/hangSo.js';
import './DoiTraKhieuNaiPage.css';

const TABS = [
  { value: 'tat-ca', label: 'Tất cả', query: {} },
  { value: 'cho-xu-ly', label: 'Chờ xử lý', query: { trangThaiXuLy: TRANG_THAI_XU_LY_YEU_CAU.CHO_XU_LY } },
  { value: 'da-xu-ly', label: 'Đã xử lý', query: { trangThaiXuLy: TRANG_THAI_XU_LY_YEU_CAU.DA_XU_LY } },
];

export function KetQuaYeuCau({ yeuCau }) {
  if (yeuCau.trangThaiXuLy !== TRANG_THAI_XU_LY_YEU_CAU.DA_XU_LY) return null;
  const biTuChoi = yeuCau.ketQuaXuLy === KET_QUA_XU_LY.TU_CHOI;
  return <div className={`doiTraKetQua ${biTuChoi ? 'biTuChoi' : 'duocChapNhan'}`}>
    <strong>{biTuChoi ? 'Người bán đã từ chối yêu cầu của bạn' : 'Người bán đã chấp nhận yêu cầu của bạn'}</strong>
    {biTuChoi && <><p>Yêu cầu này không thể gửi lại. Bạn có thể nhắn tin cho cửa hàng để trao đổi thêm.</p>
      {yeuCau.donHang.cuaHang?._id && <Button variant="secondary" to={`${DUONG_DAN.TRO_CHUYEN}?cuaHangId=${yeuCau.donHang.cuaHang._id}`}
        state={{ tenCuaHang: yeuCau.donHang.cuaHang.tenCuaHang }}>Nhắn tin cho cửa hàng</Button>}</>}
  </div>;
}

export default function DoiTraKhieuNaiPage() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((item) => item.value === params.get('tab')) || TABS[0];
  const trang = Math.max(1, Number(params.get('trang')) || 1);
  const [duLieu, setDuLieu] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const [idChiTiet, setIdChiTiet] = useState(null);
  const [chiTiet, setChiTiet] = useState(null);
  const [loiChiTiet, setLoiChiTiet] = useState('');
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false);
  const [lanTaiChiTiet, setLanTaiChiTiet] = useState(0);

  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoi('');
    layDanhSachYeuCauCuaToi({ ...tab.query, trang }).then((data) => {
      if (conHieuLuc) setDuLieu(data);
    }).catch((loiApi) => { if (conHieuLuc) { setDuLieu(null); setLoi(loiApi.message); } })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [tab.value, trang, lanTai]);

  useEffect(() => {
    if (!idChiTiet) return undefined;
    let conHieuLuc = true;
    setChiTiet(null); setLoiChiTiet(''); setDangTaiChiTiet(true);
    layChiTietYeuCauCuaToi(idChiTiet).then((data) => { if (conHieuLuc) setChiTiet(data.yeuCau); })
      .catch((loiApi) => { if (conHieuLuc) setLoiChiTiet(loiApi.message); })
      .finally(() => { if (conHieuLuc) setDangTaiChiTiet(false); });
    return () => { conHieuLuc = false; };
  }, [idChiTiet, lanTaiChiTiet]);

  return <div className="doiTraPage">
    <PageHeader title="Đổi trả và khiếu nại" description="Theo dõi yêu cầu đã gửi và kết quả từ cửa hàng." />
    <Tabs items={TABS} value={tab.value} onChange={(value) => setParams({ tab: value })} label="Lọc yêu cầu" />
    {dangTai ? <Skeleton variant="block" count={3} /> : loi ? <ErrorState message={loi} taiLai={() => setLanTai((lan) => lan + 1)} />
      : !duLieu?.danhSach.length ? <EmptyState title="Bạn chưa có yêu cầu nào" description="Yêu cầu sẽ xuất hiện tại đây sau khi bạn gửi từ chi tiết đơn đã hoàn thành."
        actionLabel="Xem đơn hàng" actionTo={DUONG_DAN.DON_HANG} /> : <>
        <div className="doiTraDanhSach">{duLieu.danhSach.map((yeuCau) => {
          const sanPham = yeuCau.chiTietDonHang.sanPham;
          const anh = taoUrlAnh(sanPham.hinhAnh?.[0]);
          return <article key={yeuCau._id} className="doiTraThe"><div className="doiTraTheDau">
            {anh ? <img src={anh} alt="" /> : <span className="doiTraAnhTrong">Chưa có ảnh</span>}
            <div><strong>{sanPham.tenSanPham}</strong><small>{yeuCau.donHang.cuaHang.tenCuaHang} · {dinhDangNgayGio(yeuCau.ngayTao)}</small>
              <div className="doiTraHuyHieu"><Badge variant="info">{yeuCau.loaiYeuCau}</Badge><Badge variant={MAU_TRANG_THAI[yeuCau.ketQuaXuLy || yeuCau.trangThaiXuLy] || 'neutral'}>{yeuCau.ketQuaXuLy || yeuCau.trangThaiXuLy}</Badge></div></div>
            <Button variant="secondary" size="sm" onClick={() => setIdChiTiet(yeuCau._id)}>Xem</Button></div>
            <KetQuaYeuCau yeuCau={yeuCau} /></article>;
        })}</div>
        <Pagination trang={duLieu.phanTrang.trang} tongTrang={duLieu.phanTrang.tongTrang}
          onChange={(soTrang) => setParams({ tab: tab.value, trang: String(soTrang) })} /></>}
    <Modal open={Boolean(idChiTiet)} onClose={() => setIdChiTiet(null)} title="Chi tiết yêu cầu">
      {dangTaiChiTiet ? <Skeleton variant="block" count={2} /> : loiChiTiet ? <ErrorState message={loiChiTiet} taiLai={() => setLanTaiChiTiet((lan) => lan + 1)} /> : chiTiet &&
        <div className="doiTraChiTiet"><strong>{chiTiet.chiTietDonHang.sanPham.tenSanPham}</strong>
          <p>{chiTiet.loaiYeuCau} · Gửi ngày {dinhDangNgayGio(chiTiet.ngayTao)}</p>
          <p>Cửa hàng: {chiTiet.donHang.cuaHang.tenCuaHang}</p>
          <p className="doiTraNoiDung">{chiTiet.noiDung}</p><KetQuaYeuCau yeuCau={chiTiet} />
          <Link to={DUONG_DAN.chiTietDonHang(chiTiet.donHang._id)} onClick={() => setIdChiTiet(null)}>Xem đơn {maDonHangHienThi(chiTiet.donHang._id)}</Link>
        </div>}
    </Modal>
  </div>;
}
