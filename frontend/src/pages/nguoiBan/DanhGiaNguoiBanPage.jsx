import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Field from '../../components/ui/Field.jsx';
import Icon from '../../components/ui/Icon.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import SaoDanhGia from '../../components/SaoDanhGia.jsx';
import { nguoiBanLayDanhSachDanhGia, nguoiBanLayDanhSachSanPhamDanhGia } from '../../services/danhGia.api.js';
import { nguoiBanLayChiTietSanPham } from '../../services/sanPham.api.js';
import { dinhDangNgay, taoUrlAnh } from '../../utils/dinhDang.js';
import { DUONG_DAN } from '../../utils/hangSo.js';
import './DanhGiaNguoiBanPage.css';

const THONG_KE_RONG = { diemTrungBinh: 0, soDanhGia: 0, phanBoSao: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
const hienDiem = (diem) => Number(diem || 0).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const SAP_XEP_SAN_PHAM = [
  { value: 'nhieuDanhGia', label: 'Nhiều đánh giá nhất' },
  { value: 'diemThap', label: 'Điểm thấp nhất trước' },
  { value: 'ten', label: 'Tên A–Z' },
];
const SAP_XEP_DANH_GIA = [
  { value: 'moiNhat', label: 'Mới nhất' },
  { value: 'saoThap', label: 'Sao thấp trước' },
  { value: 'saoCao', label: 'Sao cao trước' },
];

function AnhSanPham({ hinhAnh }) {
  const url = taoUrlAnh(Array.isArray(hinhAnh) ? hinhAnh[0] : hinhAnh);
  return url ? <img className="danhGiaBanAnh" src={url} alt="" />
    : <span className="danhGiaBanAnh danhGiaBanAnhTrong" aria-label="Sản phẩm chưa có ảnh"><Icon name="image" size={20} /></span>;
}

function BoChonSanPham({ tuKhoa, onTuKhoa, sapXep, onSapXep, danhSach, tongQuan = THONG_KE_RONG, sanPhamId, onChon,
  dangTai, loi, taiLai, tongSo, onXemThem }) {
  return <div className="danhGiaBanBoChon">
    <div className="danhGiaBanTimKiem"><Field label="Tìm sản phẩm"><Input type="search" value={tuKhoa} maxLength={100}
      onChange={(event) => onTuKhoa(event.target.value)} placeholder="Nhập tên sản phẩm" /></Field>
      {tuKhoa && <Button variant="ghost" size="sm" onClick={() => onTuKhoa('')}>Xóa</Button>}</div>
    <Field label="Sắp xếp sản phẩm"><Select value={sapXep} onChange={(event) => onSapXep(event.target.value)}>
      {SAP_XEP_SAN_PHAM.map((muc) => <option key={muc.value} value={muc.value}>{muc.label}</option>)}</Select></Field>
    <div className="danhGiaBanSanPhamCuon">
      <button type="button" className="danhGiaBanSanPhamChon" aria-current={!sanPhamId ? 'true' : undefined} onClick={() => onChon('')}>
        <span className="danhGiaBanSanPhamChu"><strong>Tất cả sản phẩm</strong><small>{tongQuan.soDanhGia
          ? `${hienDiem(tongQuan.diemTrungBinh)} ★ · ${tongQuan.soDanhGia} đánh giá` : 'Chưa có đánh giá'}</small></span>
      </button>
      {danhSach.map((sanPham) => <button type="button" key={sanPham._id} className="danhGiaBanSanPhamChon"
        aria-current={sanPhamId === sanPham._id ? 'true' : undefined} onClick={() => onChon(sanPham._id)}>
        <AnhSanPham hinhAnh={sanPham.hinhAnh} /><span className="danhGiaBanSanPhamChu"><strong>{sanPham.tenSanPham}</strong>
          <small>{sanPham.soDanhGia ? `${hienDiem(sanPham.diemTrungBinh)} ★ · ${sanPham.soDanhGia} đánh giá` : 'Chưa có đánh giá'}</small>
          {sanPham.soDanhGiaThap > 0 && <small className="danhGiaBanCanChuY">{sanPham.soDanhGiaThap} đánh giá thấp</small>}</span>
      </button>)}
      {dangTai && <Skeleton variant="block" count={2} />}
      {loi && <ErrorState message={loi} taiLai={taiLai} />}
      {!dangTai && !loi && !danhSach.length && tuKhoa && <p className="danhGiaBanGoiY">Không tìm thấy sản phẩm. Thử từ khóa khác.</p>}
      {!dangTai && !loi && danhSach.length < tongSo && <Button variant="secondary" fullWidth onClick={onXemThem}>
        Xem thêm sản phẩm ({danhSach.length}/{tongSo})</Button>}
    </div>
  </div>;
}

function TongQuanDanhGia({ thongKe, soSao, onChonSao }) {
  return <section className="danhGiaBanTongQuan" aria-label="Tổng quan đánh giá">
    <div className="danhGiaBanDiem"><strong>{hienDiem(thongKe.diemTrungBinh)}<span>/5</span></strong>
      <SaoDanhGia giaTri={thongKe.diemTrungBinh} /><span>{thongKe.soDanhGia} đánh giá</span></div>
    <div className="danhGiaBanPhanBo">{[5, 4, 3, 2, 1].map((sao) => {
      const soLuong = thongKe.phanBoSao?.[sao] || 0;
      const phanTram = thongKe.soDanhGia ? Math.round(soLuong * 100 / thongKe.soDanhGia) : 0;
      return <button key={sao} type="button" className="danhGiaBanThanhSao" aria-pressed={soSao === String(sao)}
        onClick={() => onChonSao(soSao === String(sao) ? '' : String(sao))}
        aria-label={`${sao} sao: ${soLuong} đánh giá, ${phanTram} phần trăm. Bấm để lọc`}>
        <span>{sao} sao</span><span className="danhGiaBanThanhNen"><span style={{ width: `${phanTram}%` }} /></span>
        <span>{soLuong} <small>({phanTram}%)</small></span></button>;
    })}</div>
  </section>;
}

function NoiDungDanhGia({ noiDung }) {
  const [moRong, setMoRong] = useState(false);
  const [coTheMo, setCoTheMo] = useState(false);
  const vanBanRef = useRef(null);
  useEffect(() => {
    const vanBan = vanBanRef.current;
    const kiemTra = () => { if (!moRong) setCoTheMo(vanBan.scrollHeight > vanBan.clientHeight + 1); };
    kiemTra();
    const theoDoi = new ResizeObserver(kiemTra);
    theoDoi.observe(vanBan.parentElement);
    return () => theoDoi.disconnect();
  }, [noiDung, moRong]);
  return <div className="danhGiaBanNoiDung"><p ref={vanBanRef} className={!moRong ? 'danhGiaBanThuGon' : ''}>{noiDung}</p>
    {(coTheMo || moRong) && <button type="button" className="danhGiaBanNutChu" aria-expanded={moRong} onClick={() => setMoRong(!moRong)}>
      {moRong ? 'Thu gọn' : 'Xem thêm'}</button>}</div>;
}

export default function DanhGiaNguoiBanPage() {
  const [params, setParams] = useSearchParams();
  const sanPhamId = params.get('sanPhamId') || '';
  const soSao = params.get('soSao') || '';
  const sapXep = params.get('sapXep') || 'moiNhat';
  const sapXepSanPham = params.get('sapXepSanPham') || 'nhieuDanhGia';
  const tuKhoa = params.get('tuKhoa') || '';
  const trang = Math.max(1, Number(params.get('trang')) || 1);
  const [tuKhoaNhap, setTuKhoaNhap] = useState(tuKhoa);
  const [danhSachSanPham, setDanhSachSanPham] = useState([]);
  const [tongSanPham, setTongSanPham] = useState(0);
  const [trangSanPham, setTrangSanPham] = useState(1);
  const [dangTaiSanPham, setDangTaiSanPham] = useState(true);
  const [loiSanPham, setLoiSanPham] = useState('');
  const [lanTaiSanPham, setLanTaiSanPham] = useState(0);
  const [sanPhamDaChon, setSanPhamDaChon] = useState(null);
  const [tongQuan, setTongQuan] = useState(THONG_KE_RONG);
  const [duLieu, setDuLieu] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const [moChonSanPham, setMoChonSanPham] = useState(false);

  const doiLoc = (ten, giaTri) => {
    const moi = new URLSearchParams(params);
    if (giaTri) moi.set(ten, giaTri); else moi.delete(ten);
    moi.delete('trang'); setParams(moi);
  };
  const xoaBoLoc = () => {
    const moi = new URLSearchParams(params);
    moi.delete('soSao'); moi.delete('sapXep'); moi.delete('trang'); setParams(moi);
  };
  const chonSanPham = (id) => { doiLoc('sanPhamId', id); setMoChonSanPham(false); };

  useEffect(() => { setTuKhoaNhap(tuKhoa); }, [tuKhoa]);
  useEffect(() => {
    if (tuKhoaNhap === tuKhoa) return undefined;
    const hen = setTimeout(() => doiLoc('tuKhoa', tuKhoaNhap), 350);
    return () => clearTimeout(hen);
  }, [tuKhoaNhap, tuKhoa]);
  useEffect(() => { setTrangSanPham(1); setDanhSachSanPham([]); }, [tuKhoa, sapXepSanPham]);
  useEffect(() => {
    let conHieuLuc = true;
    setDangTaiSanPham(true); setLoiSanPham('');
    nguoiBanLayDanhSachSanPhamDanhGia({ tuKhoa, sapXep: sapXepSanPham, trang: trangSanPham, gioiHan: 20 })
      .then((data) => { if (conHieuLuc) {
        setDanhSachSanPham((cu) => trangSanPham === 1 ? data.danhSach : [...cu, ...data.danhSach]);
        setTongSanPham(data.phanTrang.tongSo);
      } }).catch((loiApi) => { if (conHieuLuc) setLoiSanPham(loiApi.message); })
      .finally(() => { if (conHieuLuc) setDangTaiSanPham(false); });
    return () => { conHieuLuc = false; };
  }, [tuKhoa, sapXepSanPham, trangSanPham, lanTaiSanPham]);
  useEffect(() => {
    let conHieuLuc = true;
    if (!sanPhamId) { setSanPhamDaChon(null); return undefined; }
    const trongDanhSach = danhSachSanPham.find((muc) => muc._id === sanPhamId);
    if (trongDanhSach) { setSanPhamDaChon(trongDanhSach); return undefined; }
    nguoiBanLayChiTietSanPham(sanPhamId).then((data) => { if (conHieuLuc) setSanPhamDaChon(data.sanPham); })
      .catch(() => { if (conHieuLuc) setSanPhamDaChon(null); });
    return () => { conHieuLuc = false; };
  }, [sanPhamId, danhSachSanPham]);
  useEffect(() => {
    let conHieuLuc = true;
    nguoiBanLayDanhSachDanhGia({ gioiHan: 1 }).then((data) => { if (conHieuLuc) setTongQuan(data.thongKe); });
    return () => { conHieuLuc = false; };
  }, [lanTai]);
  useEffect(() => { setDuLieu(null); }, [sanPhamId]);
  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoi('');
    nguoiBanLayDanhSachDanhGia({ ...(sanPhamId ? { sanPhamId } : {}), ...(soSao ? { soSao } : {}), sapXep, trang })
      .then((data) => { if (conHieuLuc) { setDuLieu(data); if (!sanPhamId) setTongQuan(data.thongKe); } })
      .catch((loiApi) => { if (conHieuLuc) setLoi(loiApi.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [sanPhamId, soSao, sapXep, trang, lanTai]);

  const thongKe = duLieu?.thongKe || THONG_KE_RONG;
  const coLocDanhGia = Boolean(soSao || params.get('sapXep'));
  const boChon = { tuKhoa: tuKhoaNhap, onTuKhoa: setTuKhoaNhap, sapXep: sapXepSanPham,
    onSapXep: (giaTri) => doiLoc('sapXepSanPham', giaTri), danhSach: danhSachSanPham,
    tongQuan, sanPhamId, onChon: chonSanPham, dangTai: dangTaiSanPham, loi: loiSanPham,
    taiLai: () => setLanTaiSanPham((cu) => cu + 1), tongSo: tongSanPham,
    onXemThem: () => setTrangSanPham((cu) => cu + 1) };

  return <div className="danhGiaBanPage">
    <PageHeader title="Đánh giá của khách" description="Xem khách nhận xét về sản phẩm của cửa hàng bạn." />
    <div className="danhGiaBanBoCuc">
      <aside className="danhGiaBanCotTrai" aria-label="Chọn sản phẩm"><h2>Sản phẩm</h2><BoChonSanPham {...boChon} /></aside>
      <div className="danhGiaBanCotPhai">
        <div className="danhGiaBanDoiMobile"><Button variant="secondary" onClick={() => setMoChonSanPham(true)}>
          Đang xem: {sanPhamDaChon?.tenSanPham || (sanPhamId ? 'Sản phẩm đã chọn' : 'Tất cả sản phẩm')} · Đổi
        </Button></div>
        <div className="danhGiaBanTieuDe">{sanPhamId && sanPhamDaChon && <AnhSanPham hinhAnh={sanPhamDaChon.hinhAnh} />}
          <h2>{sanPhamId ? sanPhamDaChon?.tenSanPham || 'Sản phẩm đã chọn' : 'Tất cả sản phẩm'}</h2>
          {sanPhamId && <Button variant="ghost" size="sm" onClick={() => chonSanPham('')}>Xem tất cả sản phẩm</Button>}</div>
        {!sanPhamId && !dangTaiSanPham && !loiSanPham && tongSanPham === 0 ? <EmptyState title="Cửa hàng chưa có sản phẩm"
          description="Thêm sản phẩm để bắt đầu nhận đánh giá của khách." actionLabel="Thêm sản phẩm" actionTo={DUONG_DAN.NGUOI_BAN.THEM_SAN_PHAM} /> : <>
          {dangTai && !duLieu ? <><Skeleton variant="block" count={1} /><Skeleton variant="block" count={2} /></>
            : loi ? <ErrorState message={loi} taiLai={() => setLanTai((cu) => cu + 1)} /> : <>
              <TongQuanDanhGia thongKe={thongKe} soSao={soSao} onChonSao={(sao) => doiLoc('soSao', sao)} />
              <div className="danhGiaBanCongCu"><div className="danhGiaBanLocSao" role="group" aria-label="Lọc theo số sao">
                {['', '5', '4', '3', '2', '1'].map((sao) => <button type="button" key={sao || 'tat-ca'}
                  className="danhGiaBanChip" aria-pressed={soSao === sao} onClick={() => doiLoc('soSao', sao)}>
                  {sao ? `${sao} sao (${thongKe.phanBoSao?.[sao] || 0})` : `Tất cả (${thongKe.soDanhGia})`}</button>)}
              </div><Field label="Sắp xếp đánh giá"><Select value={sapXep} onChange={(event) => doiLoc('sapXep', event.target.value)}>
                {SAP_XEP_DANH_GIA.map((muc) => <option key={muc.value} value={muc.value}>{muc.label}</option>)}
              </Select></Field></div>
              <div className="danhGiaBanKetQua" aria-live="polite"><span>Hiển thị {duLieu?.danhSach?.length || 0} trong {duLieu?.phanTrang?.tongSo || 0} đánh giá</span>
                {coLocDanhGia && <Button variant="ghost" size="sm" onClick={xoaBoLoc}>Xóa bộ lọc</Button>}</div>
              <div aria-busy={dangTai} className={dangTai ? 'danhGiaBanDangTai' : ''}>
                {duLieu?.danhSach?.length ? <><div className="danhGiaBanDanhSach">{duLieu.danhSach.map((danhGia) => <article key={danhGia._id} className="danhGiaBanDong">
                  <div className="danhGiaBanNguoiMua"><Avatar hoTen={danhGia.taiKhoan.hoTen} /><strong>{danhGia.taiKhoan.hoTen}</strong>
                    <time dateTime={danhGia.ngayDanhGia}>{dinhDangNgay(danhGia.ngayDanhGia)}</time></div>
                  <div className="danhGiaBanSao"><SaoDanhGia giaTri={danhGia.soSao} />
                    {danhGia.soSao <= 2 && <span className="danhGiaBanCanChuY">Cần chú ý</span>}</div>
                  <NoiDungDanhGia noiDung={danhGia.noiDung} />
                  {!sanPhamId && <button type="button" className="danhGiaBanLienKetSanPham" onClick={() => chonSanPham(danhGia.sanPham._id)}>
                    <AnhSanPham hinhAnh={danhGia.sanPham.hinhAnh} />{danhGia.sanPham.tenSanPham}</button>}
                </article>)}</div><Pagination trang={duLieu.phanTrang.trang} tongTrang={duLieu.phanTrang.tongTrang}
                  onChange={(soTrang) => { const moi = new URLSearchParams(params); moi.set('trang', String(soTrang)); setParams(moi); }} /></>
                  : !dangTai && <EmptyState title={thongKe.soDanhGia ? 'Không có đánh giá khớp bộ lọc' : 'Chưa có đánh giá nào'}
                    description={thongKe.soDanhGia ? 'Thử chọn mức sao khác hoặc xóa bộ lọc.' : 'Đánh giá sẽ xuất hiện khi khách nhận hàng thành công và gửi nhận xét.'}
                    actionLabel={thongKe.soDanhGia && coLocDanhGia ? 'Xóa bộ lọc' : undefined}
                    onAction={thongKe.soDanhGia && coLocDanhGia ? xoaBoLoc : undefined} />}</div>
            </>}
        </>}
      </div>
    </div>
    <Modal open={moChonSanPham} onClose={() => setMoChonSanPham(false)} title="Chọn sản phẩm"><BoChonSanPham {...boChon} /></Modal>
  </div>;
}
