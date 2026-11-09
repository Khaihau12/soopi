import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DanhMucChips from '../components/DanhMucChips.jsx';
import LuoiSanPham from '../components/LuoiSanPham.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { layDanhSachDanhMuc } from '../services/danhMuc.api.js';
import { layDanhSachCuaHangCongKhai } from '../services/cuaHang.api.js';
import { layDanhSachSanPham } from '../services/sanPham.api.js';
import { layDanhSachKhuyenMaiDangDienRa } from '../services/khuyenMai.api.js';
import { dinhDangTien } from '../utils/dinhDang.js';
import { DUONG_DAN } from '../utils/hangSo.js';
import './DanhSachSanPhamPage.css';

const chuanHoaTimKiem = (giaTri) => giaTri.toLocaleLowerCase('vi').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd');
const tenCuaHangKhop = (ten, tuKhoa) => {
  const tuKhoaThuong = tuKhoa.trim().toLocaleLowerCase('vi');
  return tuKhoaThuong === chuanHoaTimKiem(tuKhoaThuong)
    ? chuanHoaTimKiem(ten).includes(tuKhoaThuong)
    : ten.toLocaleLowerCase('vi').includes(tuKhoaThuong);
};

export default function DanhSachSanPhamPage({ cuaHangCoDinhId = '' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tuKhoa = searchParams.get('tuKhoa')?.trim() || '';
  const danhMucId = searchParams.get('danhMucId') || '';
  const khuyenMaiId = searchParams.get('khuyenMaiId') || '';
  const cuaHangId = cuaHangCoDinhId || searchParams.get('cuaHangId') || '';
  const giaTu = searchParams.get('giaTu') || '';
  const giaDen = searchParams.get('giaDen') || '';
  const soSaoToiThieu = searchParams.get('soSaoToiThieu') || '';
  const conHang = searchParams.get('conHang') === 'true';
  const sapXepChon = searchParams.get('sapXep') || (tuKhoa ? 'lien-quan' : 'moi-nhat');
  const sapXep = !tuKhoa && sapXepChon === 'lien-quan' ? 'moi-nhat' : sapXepChon;
  const trang = searchParams.get('trang') || '1';
  const duongDan = cuaHangCoDinhId ? DUONG_DAN.chiTietCuaHang(cuaHangCoDinhId) : DUONG_DAN.SAN_PHAM;
  const [danhMuc, setDanhMuc] = useState([]);
  const [cuaHang, setCuaHang] = useState([]);
  const [loiCuaHang, setLoiCuaHang] = useState('');
  const [lanTaiCuaHang, setLanTaiCuaHang] = useState(0);
  const [tenKhuyenMai, setTenKhuyenMai] = useState('');
  const [giaNhap, setGiaNhap] = useState({ giaTu, giaDen });
  const [loiGia, setLoiGia] = useState('');
  const [ketQua, setKetQua] = useState({ danhSach: [], cuaHangLienQuan: [], danhMucLienQuan: [], phanTrang: { trang: 1, tongSo: 0, tongTrang: 0 } });
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const [moBoLoc, setMoBoLoc] = useState(false);
  const [moThemDanhMuc, setMoThemDanhMuc] = useState(false);
  const [moThemCuaHang, setMoThemCuaHang] = useState(false);
  const [timCuaHang, setTimCuaHang] = useState('');
  const [goiYTimTiep, setGoiYTimTiep] = useState(null);
  const [dangTaiGoiY, setDangTaiGoiY] = useState(false);

  useEffect(() => { setGiaNhap({ giaTu, giaDen }); setLoiGia(''); }, [giaTu, giaDen]);
  useEffect(() => {
    let conHieuLuc = true;
    layDanhSachDanhMuc().then((data) => { if (conHieuLuc) setDanhMuc(data.danhSach); }).catch(() => {});
    return () => { conHieuLuc = false; };
  }, []);
  useEffect(() => {
    if (cuaHangCoDinhId) return undefined;
    let conHieuLuc = true;
    setLoiCuaHang('');
    layDanhSachCuaHangCongKhai().then((data) => { if (conHieuLuc) setCuaHang(data.danhSach); })
      .catch(() => { if (conHieuLuc) setLoiCuaHang('Không tải được danh sách cửa hàng.'); });
    return () => { conHieuLuc = false; };
  }, [cuaHangCoDinhId, lanTaiCuaHang]);
  useEffect(() => {
    let conHieuLuc = true;
    if (!khuyenMaiId) { setTenKhuyenMai(''); return undefined; }
    layDanhSachKhuyenMaiDangDienRa().then((data) => {
      if (conHieuLuc) setTenKhuyenMai(data.danhSach.find((muc) => muc._id === khuyenMaiId)?.tenKhuyenMai || 'Chương trình không còn hiệu lực');
    }).catch(() => { if (conHieuLuc) setTenKhuyenMai('Khuyến mãi'); });
    return () => { conHieuLuc = false; };
  }, [khuyenMaiId]);
  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoi(''); setGoiYTimTiep(null);
    layDanhSachSanPham({ tuKhoa, danhMucId, khuyenMaiId, cuaHangId, giaTu, giaDen, soSaoToiThieu, conHang: conHang ? 'true' : '', sapXep, trang })
      .then((data) => { if (conHieuLuc) setKetQua(data); })
      .catch((loiApi) => { if (conHieuLuc) setLoi(loiApi.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [tuKhoa, danhMucId, khuyenMaiId, cuaHangId, giaTu, giaDen, soSaoToiThieu, conHang, sapXep, trang, lanTai]);

  const coBoLocKhac = Boolean(danhMucId || khuyenMaiId || (!cuaHangCoDinhId && cuaHangId)
    || giaTu || giaDen || soSaoToiThieu || conHang);
  const tuKhoaRutGon = tuKhoa.split(/\s+/).slice(0, -1).join(' ');
  useEffect(() => {
    if (dangTai || loi || ketQua.danhSach.length || ketQua.phanTrang.tongSo > 0
      || (!tuKhoa && !coBoLocKhac)) return undefined;
    let conHieuLuc = true;
    setDangTaiGoiY(true);
    setGoiYTimTiep(null);
    const timGoiY = async () => {
      try {
        // Kiểm tra bằng API trước khi gợi ý để không dẫn người mua tới một danh sách rỗng khác.
        const moRong = await layDanhSachSanPham({ tuKhoa, cuaHangId: cuaHangCoDinhId, gioiHan: 1 });
        let rutGon = null;
        if (!moRong.phanTrang.tongSo && tuKhoaRutGon) {
          rutGon = await layDanhSachSanPham({ tuKhoa: tuKhoaRutGon, cuaHangId: cuaHangCoDinhId, gioiHan: 1 });
        }
        if (conHieuLuc) setGoiYTimTiep({ moRong, rutGon });
      } catch {
        if (conHieuLuc) setGoiYTimTiep(null);
      } finally {
        if (conHieuLuc) setDangTaiGoiY(false);
      }
    };
    timGoiY();
    return () => { conHieuLuc = false; };
  }, [dangTai, loi, ketQua.danhSach.length, ketQua.phanTrang.tongSo, tuKhoa,
    coBoLocKhac, cuaHangCoDinhId, tuKhoaRutGon, danhMucId, khuyenMaiId, cuaHangId,
    giaTu, giaDen, soSaoToiThieu, conHang, trang]);

  const suaQuery = (capNhat) => {
    const moi = new URLSearchParams(searchParams);
    Object.entries(capNhat).forEach(([ten, giaTri]) => { if (giaTri) moi.set(ten, giaTri); else moi.delete(ten); });
    if (!moi.get('tuKhoa') && moi.get('sapXep') === 'lien-quan') moi.delete('sapXep');
    moi.delete('trang');
    setSearchParams(moi);
  };
  const apDungGia = (event) => {
    event.preventDefault();
    const hopLe = (giaTri) => giaTri === '' || (/^\d+$/.test(giaTri) && Number.isSafeInteger(Number(giaTri)));
    if (!hopLe(giaNhap.giaTu) || !hopLe(giaNhap.giaDen)) {
      setLoiGia('Giá phải là số nguyên không âm.'); return;
    }
    if (giaNhap.giaTu !== '' && giaNhap.giaDen !== '' && Number(giaNhap.giaTu) > Number(giaNhap.giaDen)) {
      setLoiGia('Giá từ không được lớn hơn giá đến.'); return;
    }
    setLoiGia('');
    suaQuery({ giaTu: giaNhap.giaTu, giaDen: giaNhap.giaDen });
    setMoBoLoc(false);
  };
  const chuyenTrang = (soTrang) => {
    const query = new URLSearchParams(searchParams);
    if (soTrang === 1) query.delete('trang'); else query.set('trang', String(soTrang));
    setSearchParams(query);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const boLoc = [
    tuKhoa && { nhan: `Từ khóa: ${tuKhoa}`, capNhat: { tuKhoa: '' } },
    danhMucId && { nhan: `Danh mục: ${danhMuc.find((item) => item._id === danhMucId)?.tenDanhMuc || 'Đã chọn'}`, capNhat: { danhMucId: '' } },
    !cuaHangCoDinhId && cuaHangId && { nhan: `Cửa hàng: ${cuaHang.find((item) => item._id === cuaHangId)?.tenCuaHang || 'Đã chọn'}`, capNhat: { cuaHangId: '' } },
    (giaTu || giaDen) && { nhan: giaTu && giaDen
      ? `Giá: ${dinhDangTien(Number(giaTu))} – ${dinhDangTien(Number(giaDen))}`
      : giaTu ? `Giá từ ${dinhDangTien(Number(giaTu))}` : `Giá đến ${dinhDangTien(Number(giaDen))}`,
    capNhat: { giaTu: '', giaDen: '' } },
    soSaoToiThieu && { nhan: `Từ ${soSaoToiThieu} sao`, capNhat: { soSaoToiThieu: '' } },
    conHang && { nhan: 'Chỉ còn hàng', capNhat: { conHang: '' } },
    khuyenMaiId && { nhan: tenKhuyenMai || 'Khuyến mãi', capNhat: { khuyenMaiId: '' } },
  ].filter(Boolean);
  const soBoLoc = [danhMucId, !cuaHangCoDinhId && cuaHangId, giaTu || giaDen, soSaoToiThieu, conHang].filter(Boolean).length;
  const soTheoCuaHang = new Map((ketQua.cuaHangLienQuan || []).map((item) => [item._id, item.soSanPham]));
  const cuaHangCoSanPham = cuaHang.filter((item) => soTheoCuaHang.has(item._id) || item._id === cuaHangId)
    .sort((a, b) => (b._id === cuaHangId) - (a._id === cuaHangId)
      || (soTheoCuaHang.get(b._id) || 0) - (soTheoCuaHang.get(a._id) || 0)
      || a.tenCuaHang.localeCompare(b.tenCuaHang, 'vi'));
  const cuaHangTimDuoc = cuaHangCoSanPham.filter((item) => tenCuaHangKhop(item.tenCuaHang, timCuaHang));
  const cuaHangHien = timCuaHang.trim() || moThemCuaHang ? cuaHangTimDuoc : cuaHangTimDuoc.slice(0, 4);
  const cuaHangTheoTen = !cuaHangCoDinhId && tuKhoa ? cuaHang.filter((item) => tenCuaHangKhop(item.tenCuaHang, tuKhoa)).slice(0, 3) : [];
  const soTheoDanhMuc = new Map((ketQua.danhMucLienQuan || []).map((item) => [item._id, item.soSanPham]));
  const danhMucCoSanPham = danhMuc.filter((item) => soTheoDanhMuc.has(item._id) || item._id === danhMucId)
    .sort((a, b) => (soTheoDanhMuc.get(b._id) || 0) - (soTheoDanhMuc.get(a._id) || 0)
      || a.tenDanhMuc.localeCompare(b.tenDanhMuc, 'vi'));
  const danhMucHien = moThemDanhMuc ? danhMucCoSanPham : [
    ...danhMucCoSanPham.slice(0, 4),
    ...danhMucCoSanPham.filter((item) => item._id === danhMucId && !danhMucCoSanPham.slice(0, 4).some((dau) => dau._id === item._id)),
  ];
  const taoDuongDanGoiY = (capNhat = {}) => {
    const query = new URLSearchParams();
    const tuKhoaMoi = capNhat.tuKhoa === undefined ? tuKhoa : capNhat.tuKhoa;
    if (tuKhoaMoi) query.set('tuKhoa', tuKhoaMoi);
    if (capNhat.danhMucId) query.set('danhMucId', capNhat.danhMucId);
    return duongDan + (query.size ? `?${query}` : '');
  };
  const queryTrangDau = new URLSearchParams(searchParams);
  queryTrangDau.delete('trang');
  const duongDanTrangDau = duongDan + (queryTrangDau.size ? `?${queryTrangDau}` : '');
  const danhMucGoiY = (goiYTimTiep?.moRong?.danhMucLienQuan || [])
    .filter((item) => item.soSanPham > 0 && item._id !== danhMucId)
    .map((item) => ({ ...item, tenDanhMuc: danhMuc.find((muc) => muc._id === item._id)?.tenDanhMuc }))
    .filter((item) => item.tenDanhMuc)
    .sort((a, b) => b.soSanPham - a.soSanPham)
    .slice(0, 4);
  const coKetQuaKhiNoiLoc = coBoLocKhac && goiYTimTiep?.moRong?.phanTrang.tongSo > 0;
  const coKetQuaKhiRutGon = goiYTimTiep?.rutGon?.phanTrang.tongSo > 0;
  const saiTrang = ketQua.phanTrang.tongSo > 0 && !ketQua.danhSach.length;
  const moTaRong = saiTrang ? 'Hãy quay về trang đầu để xem các sản phẩm hiện có.'
    : coKetQuaKhiNoiLoc ? `Có ${goiYTimTiep.moRong.phanTrang.tongSo} sản phẩm khi bỏ các bộ lọc khác.`
      : coKetQuaKhiRutGon ? `Có ${goiYTimTiep.rutGon.phanTrang.tongSo} sản phẩm với từ khóa ngắn hơn.`
        : coBoLocKhac ? 'Thử bỏ từng bộ lọc phía trên để tìm được nhiều sản phẩm hơn.'
          : tuKhoa ? 'Thử tìm với từ khóa ngắn hơn hoặc xem tất cả sản phẩm.' : 'Hiện chưa có sản phẩm để hiển thị.';
  const nhanHanhDongRong = saiTrang ? 'Về trang đầu'
    : coKetQuaKhiNoiLoc ? (tuKhoa ? 'Bỏ bộ lọc khác, giữ từ khóa' : 'Bỏ bộ lọc khác')
      : coKetQuaKhiRutGon ? `Tìm “${tuKhoaRutGon}”`
        : tuKhoa || coBoLocKhac ? 'Xem tất cả sản phẩm' : undefined;
  const duongDanHanhDongRong = saiTrang ? duongDanTrangDau
    : coKetQuaKhiNoiLoc ? taoDuongDanGoiY()
      : coKetQuaKhiRutGon ? taoDuongDanGoiY({ tuKhoa: tuKhoaRutGon }) : duongDan;

  return <section className="danhSachSanPhamPage" aria-label="Danh sách sản phẩm">
    <div className="danhSachSanPhamHeading">
      {cuaHangCoDinhId ? <h2>Sản phẩm của cửa hàng</h2> : <h1>{khuyenMaiId ? tenKhuyenMai || 'Sản phẩm khuyến mãi' : tuKhoa ? `Kết quả cho “${tuKhoa}”` : 'Khám phá sản phẩm'}</h1>}
      {!dangTai && !loi && <p aria-live="polite">{ketQua.phanTrang.tongSo} sản phẩm</p>}
    </div>
    {khuyenMaiId && <Link to={duongDan}>Xem tất cả sản phẩm</Link>}
    <div className="danhSachSanPhamKhung">
      <aside className="danhSachSanPhamBoLoc" aria-label="Bộ lọc sản phẩm">
        <button className="danhSachSanPhamMoLoc" type="button" aria-expanded={moBoLoc} aria-controls="noi-dung-bo-loc-san-pham" onClick={() => setMoBoLoc(!moBoLoc)}>
          Bộ lọc{soBoLoc > 0 ? ` (${soBoLoc})` : ''}<span aria-hidden="true">{moBoLoc ? '−' : '+'}</span>
        </button>
        <div id="noi-dung-bo-loc-san-pham" className="danhSachSanPhamNoiDungLoc" data-open={moBoLoc}>
          <h2>Bộ lọc</h2>
          {!cuaHangCoDinhId && <section className="danhSachSanPhamNhom" aria-label="Lọc theo cửa hàng">
            <h3>Cửa hàng</h3>
            {loiCuaHang ? <p role="alert">{loiCuaHang} <button className="danhSachSanPhamLinkButton" type="button" onClick={() => setLanTaiCuaHang((lan) => lan + 1)}>Thử lại</button></p> : <>
              {cuaHangCoSanPham.length > 4 && <div className="danhSachSanPhamTruong"><label className="chiDocBangManHinh" htmlFor="tim-cua-hang">Tìm tên cửa hàng</label>
                <input id="tim-cua-hang" type="search" placeholder="Tìm tên cửa hàng" value={timCuaHang} onChange={(event) => setTimCuaHang(event.target.value)} /></div>}
              <div className="danhSachSanPhamLuaChonShop">
                <button type="button" className={!cuaHangId ? 'dangChon' : ''} aria-pressed={!cuaHangId} onClick={() => { suaQuery({ cuaHangId: '' }); setMoBoLoc(false); }}>Tất cả cửa hàng</button>
                {cuaHangHien.map((item) => <button key={item._id} type="button" className={cuaHangId === item._id ? 'dangChon' : ''} aria-pressed={cuaHangId === item._id}
                  onClick={() => { suaQuery({ cuaHangId: item._id }); setMoBoLoc(false); }}><span>{item.tenCuaHang}</span><small>{soTheoCuaHang.get(item._id) || 0}</small></button>)}
              </div>
              {!dangTai && !loi && !cuaHangTimDuoc.length && <p className="danhSachSanPhamChuPhu">Không có cửa hàng nào có sản phẩm khớp bộ lọc.</p>}
              {cuaHangCoSanPham.length > 4 && !timCuaHang.trim() && <button className="danhSachSanPhamLinkButton" type="button" onClick={() => setMoThemCuaHang(!moThemCuaHang)}>{moThemCuaHang ? 'Thu gọn' : 'Xem thêm cửa hàng'}</button>}
            </>}
          </section>}
          <section className="danhSachSanPhamNhom danhSachSanPhamDanhMuc" aria-label="Lọc theo danh mục"><h3>Danh mục</h3>
            <DanhMucChips danhSach={danhMucHien} danhMucId={danhMucId} query={searchParams} duongDan={duongDan} onChon={() => setMoBoLoc(false)} />
            {danhMucCoSanPham.length > 4 && <button className="danhSachSanPhamLinkButton" type="button" onClick={() => setMoThemDanhMuc(!moThemDanhMuc)}>{moThemDanhMuc ? 'Thu gọn' : 'Xem thêm danh mục'}</button>}
          </section>
          <section className="danhSachSanPhamNhom" aria-label="Lọc theo giá"><h3>Khoảng giá</h3>
            <p className="danhSachSanPhamChuPhu">Giá bán sau khuyến mãi</p>
            <form className="danhSachSanPhamGia" onSubmit={apDungGia}>
              <div className="danhSachSanPhamTruong"><label htmlFor="loc-gia-tu">Từ (đ)</label><input id="loc-gia-tu" type="number" min="0" step="1" inputMode="numeric" placeholder="0" value={giaNhap.giaTu} onChange={(event) => setGiaNhap({ ...giaNhap, giaTu: event.target.value })} /></div>
              <div className="danhSachSanPhamTruong"><label htmlFor="loc-gia-den">Đến (đ)</label><input id="loc-gia-den" type="number" min="0" step="1" inputMode="numeric" placeholder="Không giới hạn" value={giaNhap.giaDen} onChange={(event) => setGiaNhap({ ...giaNhap, giaDen: event.target.value })} /></div>
              <button type="submit">Áp dụng</button>
              {loiGia && <p className="danhSachSanPhamLoiGia" role="alert">{loiGia}</p>}
            </form>
          </section>
          <section className="danhSachSanPhamNhom danhSachSanPhamTruong" aria-label="Lọc theo đánh giá"><h3>Đánh giá</h3>
            <label className="chiDocBangManHinh" htmlFor="loc-danh-gia">Số sao tối thiểu</label>
            <select id="loc-danh-gia" value={soSaoToiThieu} onChange={(event) => { suaQuery({ soSaoToiThieu: event.target.value }); setMoBoLoc(false); }}>
              <option value="">Tất cả đánh giá</option>{[5, 4, 3, 2, 1].map((so) => <option key={so} value={so}>Từ {so} sao</option>)}
            </select>
          </section>
          <section className="danhSachSanPhamNhom" aria-label="Lọc theo tình trạng hàng">
            <h3>Tình trạng hàng</h3>
            <label className="danhSachSanPhamConHang"><input type="checkbox" checked={conHang} onChange={(event) => { suaQuery({ conHang: event.target.checked ? 'true' : '' }); setMoBoLoc(false); }} />
              <span>Chỉ hiện sản phẩm còn hàng</span></label>
          </section>
        </div>
      </aside>
      <div className="danhSachSanPhamKetQua">
        {cuaHangTheoTen.length > 0 && <section className="danhSachSanPhamShopLienQuan" aria-label="Cửa hàng phù hợp với từ khóa"><h2>Cửa hàng phù hợp</h2>
          <div>{cuaHangTheoTen.map((item) => <Link key={item._id} to={DUONG_DAN.chiTietCuaHang(item._id)}><span aria-hidden="true">{item.tenCuaHang.charAt(0).toLocaleUpperCase('vi')}</span><strong>{item.tenCuaHang}</strong><small>Xem cửa hàng</small></Link>)}</div>
        </section>}
        {boLoc.length > 0 && <div className="danhSachSanPhamDangLoc" aria-label="Bộ lọc đang áp dụng">
          <span>Đang lọc:</span>{boLoc.map((muc) => <button key={muc.nhan} type="button" onClick={() => suaQuery(muc.capNhat)} aria-label={`Bỏ lọc ${muc.nhan}`}>{muc.nhan} <span aria-hidden="true">×</span></button>)}
          <Link to={duongDan}>Xóa tất cả</Link>
        </div>}
        {!loi && (dangTai || ketQua.phanTrang.tongSo > 0) && <div className="danhSachSanPhamSapXep" role="group" aria-label="Sắp xếp sản phẩm"><span>Sắp xếp</span>
          {tuKhoa && <button type="button" className={sapXep === 'lien-quan' ? 'dangChon' : ''} aria-pressed={sapXep === 'lien-quan'} onClick={() => suaQuery({ sapXep: 'lien-quan' })}>Liên quan</button>}
          <button type="button" className={sapXep === 'moi-nhat' ? 'dangChon' : ''} aria-pressed={sapXep === 'moi-nhat'} onClick={() => suaQuery({ sapXep: 'moi-nhat' })}>Mới nhất</button>
          <button type="button" className={sapXep === 'danh-gia' ? 'dangChon' : ''} aria-pressed={sapXep === 'danh-gia'} onClick={() => suaQuery({ sapXep: 'danh-gia' })}>Đánh giá cao</button>
          <label className="chiDocBangManHinh" htmlFor="sap-xep-san-pham">Sắp xếp theo giá</label>
          <select id="sap-xep-san-pham" className={sapXep.startsWith('gia-') ? 'dangChon' : ''} aria-label="Sắp xếp theo giá" value={sapXep.startsWith('gia-') ? sapXep : ''} onChange={(event) => suaQuery({ sapXep: event.target.value })}>
            <option value="" disabled>Giá</option><option value="gia-tang">Giá thấp đến cao</option><option value="gia-giam">Giá cao đến thấp</option>
          </select>
        </div>}
        {loi ? <ErrorState message={loi} taiLai={() => setLanTai((lan) => lan + 1)} /> : <>
          <LuoiSanPham danhSach={ketQua.danhSach} dangTai={dangTai} hienCuaHang={!cuaHangCoDinhId} />
          {!dangTai && !ketQua.danhSach.length && <section className="danhSachSanPhamKetQuaRong" aria-label="Gợi ý tìm tiếp" aria-live="polite">
            <EmptyState title={saiTrang ? 'Trang này không còn sản phẩm' : 'Không tìm thấy sản phẩm phù hợp'}
              description={moTaRong} actionLabel={dangTaiGoiY ? undefined : nhanHanhDongRong}
              actionTo={duongDanHanhDongRong} />
            {ketQua.phanTrang.tongSo === 0 && <>
              {dangTaiGoiY && <p className="danhSachSanPhamDangTimGoiY" role="status">Đang tìm hướng khác phù hợp…</p>}
              {danhMucGoiY.length > 0 && <div className="danhSachSanPhamHuongTimTiep">
                <h3>{tuKhoa ? 'Danh mục có sản phẩm khớp từ khóa' : 'Danh mục còn sản phẩm'}</h3>
                <div className="danhSachSanPhamDanhMucGoiY">{danhMucGoiY.map((item) => <Link key={item._id}
                  to={taoDuongDanGoiY({ danhMucId: item._id })}>{item.tenDanhMuc} <span>({item.soSanPham})</span></Link>)}</div>
              </div>}
            </>}
          </section>}
          {!dangTai && <Pagination trang={ketQua.phanTrang.trang} tongTrang={ketQua.phanTrang.tongTrang} onChange={chuyenTrang} />}
        </>}
      </div>
    </div>
  </section>;
}
