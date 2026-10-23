import { useEffect, useMemo, useState } from 'react';
import Button from './ui/Button.jsx';
import Card from './ui/Card.jsx';
import ConfirmDialog from './ui/ConfirmDialog.jsx';
import Field from './ui/Field.jsx';
import Input from './ui/Input.jsx';
import Modal from './ui/Modal.jsx';
import Pagination from './ui/Pagination.jsx';
import Select from './ui/Select.jsx';
import { layDanhSachDanhMuc } from '../services/danhMuc.api.js';
import { layDanhSachSanPham, nguoiBanLayDanhSachSanPham } from '../services/sanPham.api.js';
import { dinhDangTien, taoUrlAnh } from '../utils/dinhDang.js';
import { LOAI_KHUYEN_MAI, PHAM_VI_KHUYEN_MAI } from '../utils/hangSo.js';
import './KhuyenMaiForm.css';

const SO_DONG_MOI_TRANG = 20;
const MUC_GOI_Y = [5, 10, 15, 20, 30, 50];

const gioVietNam = (giaTri) => {
  if (!giaTri) return '';
  const phan = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(giaTri));
  const lay = (ten) => phan.find((muc) => muc.type === ten)?.value;
  return `${lay('year')}-${lay('month')}-${lay('day')}T${lay('hour')}:${lay('minute')}`;
};

const taoDong = (muc) => ({ sanPham: muc.sanPham, kieu: muc.tyLeGiam != null ? 'tyLeGiam' : 'giaKhuyenMai', giaTri: String(muc.tyLeGiam ?? muc.giaKhuyenMai ?? '') });
const mucBanDau = (chiTiet) => chiTiet.length && chiTiet.every((dong) => dong.kieu === 'tyLeGiam' && dong.giaTri === chiTiet[0].giaTri) ? chiTiet[0].giaTri : '';

const loiCuaDong = (dong) => {
  const so = Number(dong.giaTri);
  if (dong.kieu === 'tyLeGiam') return !dong.giaTri || !Number.isFinite(so) || so <= 0 || so >= 100 ? 'Tỷ lệ giảm phải lớn hơn 0 và nhỏ hơn 100.' : '';
  return !dong.giaTri || !Number.isInteger(so) || so < 1 || so > Number(dong.sanPham.giaGoc) ? 'Giá sau giảm phải là số nguyên từ 1 đồng đến giá gốc.' : '';
};

const giaXemTruoc = (dong) => {
  if (loiCuaDong(dong)) return null;
  const goc = Number(dong.sanPham.giaGoc);
  return dong.kieu === 'tyLeGiam' ? Math.min(goc, Math.round(goc * (100 - Number(dong.giaTri)) / 100)) : Number(dong.giaTri);
};

const phanTramThucTe = (dong) => {
  const giaSau = giaXemTruoc(dong);
  const goc = Number(dong.sanPham.giaGoc);
  return giaSau === null || goc <= 0 ? null : Math.round((goc - giaSau) / goc * 10000) / 100;
};

export default function KhuyenMaiForm({ phamVi, khuyenMai, onSubmit, dangGui, loiChung, onCancel }) {
  const laQuanTri = phamVi === PHAM_VI_KHUYEN_MAI.TOAN_SAN;
  const chiTietBanDau = (khuyenMai?.chiTiet || []).filter((muc) => muc.sanPham).map(taoDong);
  const [tenKhuyenMai, setTenKhuyenMai] = useState(khuyenMai?.tenKhuyenMai || '');
  const [loaiKhuyenMai, setLoaiKhuyenMai] = useState(laQuanTri ? (khuyenMai?.loaiKhuyenMai || LOAI_KHUYEN_MAI.GIAM_GIA) : LOAI_KHUYEN_MAI.GIAM_GIA);
  const [ngayBatDau, setNgayBatDau] = useState(gioVietNam(khuyenMai?.ngayBatDau));
  const [ngayKetThuc, setNgayKetThuc] = useState(gioVietNam(khuyenMai?.ngayKetThuc));
  const [chiTiet, setChiTiet] = useState(chiTietBanDau);
  const [mucChung, setMucChung] = useState(mucBanDau(chiTietBanDau));
  const [daTick, setDaTick] = useState(() => new Set());
  const [tuKhoaDong, setTuKhoaDong] = useState('');
  const [trangDong, setTrangDong] = useState(1);
  const [loi, setLoi] = useState({});
  const [xacNhanHuy, setXacNhanHuy] = useState(false);

  const [moChon, setMoChon] = useState(false);
  const [tuKhoa, setTuKhoa] = useState('');
  const [danhMucId, setDanhMucId] = useState('');
  const [danhMuc, setDanhMuc] = useState([]);
  const [trang, setTrang] = useState(1);
  const [ketQua, setKetQua] = useState({ danhSach: [], phanTrang: { trang: 1, tongTrang: 0, tongSo: 0 } });
  const [dangTaiSanPham, setDangTaiSanPham] = useState(false);
  const [loiSanPham, setLoiSanPham] = useState('');
  const [daChon, setDaChon] = useState(() => new Map());
  const [dangChonTatCa, setDangChonTatCa] = useState(false);

  const laySanPham = laQuanTri ? layDanhSachSanPham : nguoiBanLayDanhSachSanPham;
  const daThem = useMemo(() => new Set(chiTiet.map((dong) => String(dong.sanPham._id))), [chiTiet]);
  const loiDong = useMemo(() => chiTiet.filter((dong) => loiCuaDong(dong)), [chiTiet]);
  const mucGiamHopLe = mucChung !== '' && Number.isFinite(Number(mucChung)) && Number(mucChung) > 0 && Number(mucChung) < 100;
  const daThayDoi = tenKhuyenMai !== (khuyenMai?.tenKhuyenMai || '')
    || loaiKhuyenMai !== (laQuanTri ? (khuyenMai?.loaiKhuyenMai || LOAI_KHUYEN_MAI.GIAM_GIA) : LOAI_KHUYEN_MAI.GIAM_GIA)
    || ngayBatDau !== gioVietNam(khuyenMai?.ngayBatDau) || ngayKetThuc !== gioVietNam(khuyenMai?.ngayKetThuc)
    || mucChung !== mucBanDau(chiTietBanDau) || chiTiet.length !== chiTietBanDau.length
    || chiTiet.some((dong, viTri) => dong.sanPham._id !== chiTietBanDau[viTri]?.sanPham._id || dong.kieu !== chiTietBanDau[viTri]?.kieu || dong.giaTri !== chiTietBanDau[viTri]?.giaTri);

  useEffect(() => {
    if (!moChon) return undefined;
    let conHieuLuc = true;
    layDanhSachDanhMuc().then((data) => { if (conHieuLuc) setDanhMuc(data.danhSach || []); }).catch(() => {});
    return () => { conHieuLuc = false; };
  }, [moChon]);

  useEffect(() => {
    if (!moChon) return undefined;
    let conHieuLuc = true;
    setDangTaiSanPham(true); setLoiSanPham('');
    laySanPham({ tuKhoa, danhMucId, trang, gioiHan: 12 }).then((data) => { if (conHieuLuc) setKetQua(data); })
      .catch((loiApi) => { if (conHieuLuc) setLoiSanPham(loiApi.message); })
      .finally(() => { if (conHieuLuc) setDangTaiSanPham(false); });
    return () => { conHieuLuc = false; };
  }, [moChon, tuKhoa, danhMucId, trang, laQuanTri]);

  const doiDong = (id, thayDoi) => setChiTiet((cu) => cu.map((dong) => String(dong.sanPham._id) === String(id) ? { ...dong, ...thayDoi } : dong));
  const doiKieu = (dong, kieu) => {
    if (dong.kieu === kieu) return;
    const giaSau = giaXemTruoc(dong);
    const goc = Number(dong.sanPham.giaGoc);
    const tyLe = giaSau === null || goc <= 0 ? null : Math.round((goc - giaSau) / goc * 10000) / 100;
    const giaTri = giaSau === null ? '' : kieu === 'giaKhuyenMai' ? (giaSau >= 1 ? String(giaSau) : '') : tyLe > 0 && tyLe < 100 ? String(tyLe) : '';
    doiDong(dong.sanPham._id, { kieu, giaTri });
  };
  const tickDong = (id) => setDaTick((cu) => { const moi = new Set(cu); if (moi.has(id)) moi.delete(id); else moi.add(id); return moi; });
  const apDungMucChung = (chiDaTick = false) => {
    if (!mucGiamHopLe) return;
    setChiTiet((cu) => cu.map((dong) => !chiDaTick || daTick.has(String(dong.sanPham._id)) ? { ...dong, kieu: 'tyLeGiam', giaTri: mucChung } : dong));
    if (chiDaTick) setDaTick(new Set());
  };

  const dongModal = () => { if (dangChonTatCa) return; setMoChon(false); setDaChon(new Map()); };
  const tickSanPham = (sanPham) => setDaChon((cu) => { const moi = new Map(cu); if (moi.has(sanPham._id)) moi.delete(sanPham._id); else moi.set(sanPham._id, sanPham); return moi; });
  const chuaThemTrenTrang = ketQua.danhSach.filter((sanPham) => !daThem.has(String(sanPham._id)));
  const daTickHetTrang = chuaThemTrenTrang.length > 0 && chuaThemTrenTrang.every((sanPham) => daChon.has(sanPham._id));
  const tickCaTrang = () => setDaChon((cu) => {
    const moi = new Map(cu);
    for (const sanPham of chuaThemTrenTrang) { if (daTickHetTrang) moi.delete(sanPham._id); else moi.set(sanPham._id, sanPham); }
    return moi;
  });

  const chonTatCaKetQua = async () => {
    if (dangChonTatCa) return;
    setDangChonTatCa(true); setLoiSanPham('');
    try {
      const moi = new Map(daChon);
      const dauTien = await laySanPham({ tuKhoa, danhMucId, trang: 1, gioiHan: 50 });
      const themTrang = (data) => data.danhSach.forEach((sanPham) => { if (!daThem.has(String(sanPham._id))) moi.set(sanPham._id, sanPham); });
      themTrang(dauTien);
      for (let soTrang = 2; soTrang <= dauTien.phanTrang.tongTrang; soTrang += 1) themTrang(await laySanPham({ tuKhoa, danhMucId, trang: soTrang, gioiHan: 50 }));
      setDaChon(moi);
    } catch (loiApi) { setLoiSanPham(`Chưa chọn đủ sản phẩm: ${loiApi.message}`); }
    finally { setDangChonTatCa(false); }
  };

  const themDaChon = () => {
    if (!daChon.size) return;
    setChiTiet((cu) => [...cu, ...[...daChon.values()].filter((sanPham) => !daThem.has(String(sanPham._id)))
      .map((sanPham) => ({ sanPham, kieu: 'tyLeGiam', giaTri: mucGiamHopLe ? mucChung : '' }))]);
    setLoi((cu) => ({ ...cu, chiTiet: '' }));
    dongModal();
  };

  const chiTietLoc = chiTiet.filter((dong) => dong.sanPham.tenSanPham.toLocaleLowerCase('vi-VN').includes(tuKhoaDong.trim().toLocaleLowerCase('vi-VN')));
  const tongTrangDong = Math.ceil(chiTietLoc.length / SO_DONG_MOI_TRANG);
  const trangDongHienTai = Math.min(trangDong, Math.max(1, tongTrangDong));
  const dongHienThi = chiTietLoc.slice((trangDongHienTai - 1) * SO_DONG_MOI_TRANG, trangDongHienTai * SO_DONG_MOI_TRANG);
  const daTickHetDong = chiTiet.length > 0 && chiTiet.every((dong) => daTick.has(String(dong.sanPham._id)));
  const tyLeTrungBinh = chiTiet.map(phanTramThucTe).filter((giaTri) => giaTri !== null);
  const trungBinh = tyLeTrungBinh.length ? (tyLeTrungBinh.reduce((tong, giaTri) => tong + giaTri, 0) / tyLeTrungBinh.length).toFixed(1) : null;

  const nhayToiLoiDau = () => {
    const dong = loiDong[0];
    if (!dong) return;
    setTuKhoaDong(''); setTrangDong(Math.floor(chiTiet.indexOf(dong) / SO_DONG_MOI_TRANG) + 1);
    window.setTimeout(() => { const oNhap = document.getElementById(`khuyen-mai-${dong.sanPham._id}`); oNhap?.scrollIntoView({ behavior: 'smooth', block: 'center' }); oNhap?.focus(); }, 0);
  };

  const luu = (event) => {
    event.preventDefault();
    if (dangGui) return;
    const cacLoi = {};
    if (!tenKhuyenMai.trim() || tenKhuyenMai.trim().length > 200) cacLoi.tenKhuyenMai = 'Tên chương trình cần từ 1 đến 200 ký tự.';
    if (!ngayBatDau || Number.isNaN(new Date(`${ngayBatDau}:00+07:00`).getTime())) cacLoi.ngayBatDau = 'Vui lòng chọn thời gian bắt đầu hợp lệ.';
    if (!ngayKetThuc || Number.isNaN(new Date(`${ngayKetThuc}:00+07:00`).getTime()) || new Date(`${ngayKetThuc}:00+07:00`) <= new Date(`${ngayBatDau}:00+07:00`) || new Date(`${ngayKetThuc}:00+07:00`) <= new Date()) cacLoi.ngayKetThuc = 'Thời gian kết thúc phải sau thời gian bắt đầu và sau hiện tại.';
    if (!chiTiet.length) cacLoi.chiTiet = 'Chọn ít nhất một sản phẩm.';
    setLoi(cacLoi);
    if (Object.keys(cacLoi).length || loiDong.length) {
      if (Object.keys(cacLoi).length) window.setTimeout(() => document.getElementById(`khuyen-mai-${Object.keys(cacLoi)[0]}`)?.focus(), 0);
      else nhayToiLoiDau();
      return;
    }
    onSubmit({ tenKhuyenMai: tenKhuyenMai.trim(), loaiKhuyenMai,
      ngayBatDau: new Date(`${ngayBatDau}:00+07:00`).toISOString(), ngayKetThuc: new Date(`${ngayKetThuc}:00+07:00`).toISOString(),
      chiTiet: chiTiet.map((dong) => ({ sanPhamId: dong.sanPham._id, [dong.kieu]: Number(dong.giaTri) })) });
  };

  return <form className="khuyenMaiForm" noValidate onSubmit={luu}>
    <Card><h2>Thông tin chương trình</h2><div className="khuyenMaiFormFields">
      <Field label="Tên chương trình" required error={loi.tenKhuyenMai}><Input id="khuyen-mai-tenKhuyenMai" value={tenKhuyenMai} maxLength={201} disabled={dangGui} onChange={(event) => { setTenKhuyenMai(event.target.value); setLoi((cu) => ({ ...cu, tenKhuyenMai: '' })); }} /></Field>
      {laQuanTri ? <Field label="Loại khuyến mãi" required><Select value={loaiKhuyenMai} disabled={dangGui} onChange={(event) => setLoaiKhuyenMai(event.target.value)}>{Object.values(LOAI_KHUYEN_MAI).map((giaTri) => <option key={giaTri}>{giaTri}</option>)}</Select></Field>
        : <p>Người bán chỉ tạo chương trình giảm giá. Mức giảm được tính từ giá gốc của từng sản phẩm.</p>}
      <Field label="Bắt đầu" required hint="Giờ Việt Nam" error={loi.ngayBatDau}><Input id="khuyen-mai-ngayBatDau" type="datetime-local" value={ngayBatDau} disabled={dangGui} onChange={(event) => { setNgayBatDau(event.target.value); setLoi((cu) => ({ ...cu, ngayBatDau: '' })); }} /></Field>
      <Field label="Kết thúc" required hint="Giờ Việt Nam" error={loi.ngayKetThuc}><Input id="khuyen-mai-ngayKetThuc" type="datetime-local" value={ngayKetThuc} disabled={dangGui} onChange={(event) => { setNgayKetThuc(event.target.value); setLoi((cu) => ({ ...cu, ngayKetThuc: '' })); }} /></Field>
    </div></Card>

    <Card><div className="khuyenMaiFormHeading"><h2 id="khuyen-mai-chiTiet" tabIndex={-1}>Sản phẩm tham gia</h2><Button variant="secondary" disabled={dangGui} onClick={() => setMoChon(true)}>Chọn sản phẩm</Button></div>
      {loi.chiTiet && <p className="khuyenMaiFormLoi" role="alert">{loi.chiTiet}</p>}
      <div className="khuyenMaiQuick">
        <Field label="Mức giảm chung (%)" error={mucChung && !mucGiamHopLe ? 'Nhập mức giảm lớn hơn 0 và nhỏ hơn 100.' : ''}>
          <Input type="number" min="0.01" max="99.99" step="0.01" value={mucChung} disabled={dangGui} onChange={(event) => setMucChung(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); apDungMucChung(); } }} />
        </Field>
        <div className="khuyenMaiChips" aria-label="Mức giảm gợi ý">{MUC_GOI_Y.map((muc) => <Button key={muc} variant="ghost" size="sm" disabled={dangGui} onClick={() => setMucChung(String(muc))}>{muc}%</Button>)}</div>
        <div className="khuyenMaiQuickActions">
          <Button variant="secondary" disabled={dangGui || !chiTiet.length || !mucGiamHopLe} onClick={() => apDungMucChung()}>Áp dụng cho tất cả</Button>
          <Button variant="secondary" disabled={dangGui || !daTick.size || !mucGiamHopLe} onClick={() => apDungMucChung(true)}>Áp dụng cho {daTick.size} sản phẩm đã tick</Button>
          <Button variant="ghost" disabled={dangGui || !daTick.size} onClick={() => { setChiTiet((cu) => cu.filter((dong) => !daTick.has(String(dong.sanPham._id)))); setDaTick(new Set()); }}>Bỏ {daTick.size} sản phẩm đã tick</Button>
        </div>
      </div>
      {chiTiet.length > 0 && <>
        <div className="khuyenMaiFormSummary" role="status">{chiTiet.length} sản phẩm · {trungBinh === null ? 'chưa có mức giảm hợp lệ' : `giảm trung bình ${trungBinh}%`} · {loiDong.length} sản phẩm cần nhập/sửa mức giảm</div>
        {loiDong.length > 0 && <div className="khuyenMaiFormErrorSummary" role="alert">Có {loiDong.length} sản phẩm cần sửa. <Button variant="ghost" size="sm" onClick={nhayToiLoiDau}>Đến lỗi đầu tiên</Button></div>}
        {chiTiet.length > SO_DONG_MOI_TRANG && <Field label="Tìm trong sản phẩm đã thêm"><Input value={tuKhoaDong} onChange={(event) => { setTuKhoaDong(event.target.value); setTrangDong(1); }} placeholder="Tìm theo tên sản phẩm" /></Field>}
        <label className="khuyenMaiTickAll"><input type="checkbox" checked={daTickHetDong} disabled={dangGui} onChange={() => setDaTick(daTickHetDong ? new Set() : new Set(chiTiet.map((dong) => String(dong.sanPham._id))))} /> Chọn tất cả {chiTiet.length} sản phẩm</label>
        <div className="khuyenMaiTableScroll"><table className="khuyenMaiTable"><thead><tr><th scope="col">Chọn</th><th scope="col">Sản phẩm</th><th scope="col">Giá gốc</th><th scope="col">Kiểu giảm</th><th scope="col">Giá trị</th><th scope="col">Giá sau giảm</th><th scope="col">% giảm thực tế</th><th scope="col">Thao tác</th></tr></thead><tbody>
          {dongHienThi.map((dong) => {
            const id = String(dong.sanPham._id);
            const giaSau = giaXemTruoc(dong);
            const tyLe = phanTramThucTe(dong);
            const loiHienThi = loiCuaDong(dong);
            const tuyChinh = mucGiamHopLe && dong.giaTri !== '' && (dong.kieu !== 'tyLeGiam' || dong.giaTri !== mucChung);
            return <tr key={id} className={loiHienThi ? 'khuyenMaiTableError' : ''}>
              <td data-label="Chọn"><input type="checkbox" checked={daTick.has(id)} disabled={dangGui} aria-label={`Chọn ${dong.sanPham.tenSanPham}`} onChange={() => tickDong(id)} /></td>
              <td data-label="Sản phẩm"><div className="khuyenMaiProduct">
                {taoUrlAnh(dong.sanPham.hinhAnh?.[0]) && <img src={taoUrlAnh(dong.sanPham.hinhAnh[0])} alt="" />}
                <span><strong>{dong.sanPham.tenSanPham}</strong>{laQuanTri && dong.sanPham.cuaHang?.tenCuaHang && <small>{dong.sanPham.cuaHang.tenCuaHang}</small>}{tuyChinh && <small className="khuyenMaiCustom">Tùy chỉnh</small>}</span>
              </div></td>
              <td data-label="Giá gốc">{dinhDangTien(dong.sanPham.giaGoc)}</td>
              <td data-label="Kiểu giảm"><div className="khuyenMaiType" role="group" aria-label={`Kiểu giảm cho ${dong.sanPham.tenSanPham}`}>
                <button type="button" aria-pressed={dong.kieu === 'tyLeGiam'} disabled={dangGui} onClick={() => doiKieu(dong, 'tyLeGiam')}>%</button>
                <button type="button" aria-pressed={dong.kieu === 'giaKhuyenMai'} disabled={dangGui} onClick={() => doiKieu(dong, 'giaKhuyenMai')}>Giá cố định</button>
              </div></td>
              <td data-label="Giá trị"><Input id={`khuyen-mai-${id}`} type="number" min={dong.kieu === 'tyLeGiam' ? '0.01' : '1'} max={dong.kieu === 'tyLeGiam' ? '99.99' : dong.sanPham.giaGoc} step={dong.kieu === 'tyLeGiam' ? '0.01' : '1'} value={dong.giaTri} disabled={dangGui} aria-label={`${dong.kieu === 'tyLeGiam' ? 'Mức giảm phần trăm' : 'Giá sau giảm'} cho ${dong.sanPham.tenSanPham}`} aria-invalid={Boolean(loiHienThi)} aria-describedby={loiHienThi ? `khuyen-mai-loi-${id}` : undefined} onChange={(event) => doiDong(id, { giaTri: event.target.value })} />
                {loiHienThi && <small id={`khuyen-mai-loi-${id}`} className="khuyenMaiInlineError">{loiHienThi}</small>}
              </td>
              <td data-label="Giá sau giảm" className="khuyenMaiAfter">{giaSau === null ? '—' : dinhDangTien(giaSau)}</td>
              <td data-label="% giảm thực tế">{tyLe === null ? '—' : `${tyLe}%`}{dong.kieu === 'giaKhuyenMai' && tyLe !== null && <small>≈ giảm {tyLe}%</small>}</td>
              <td data-label="Thao tác"><div className="khuyenMaiRowActions">{tuyChinh && <Button variant="ghost" size="sm" disabled={dangGui} onClick={() => doiDong(id, { kieu: 'tyLeGiam', giaTri: mucChung })}>Đặt lại về mức chung</Button>}<Button variant="ghost" size="sm" disabled={dangGui} onClick={() => { setChiTiet((cu) => cu.filter((muc) => String(muc.sanPham._id) !== id)); setDaTick((cu) => { const moi = new Set(cu); moi.delete(id); return moi; }); }} aria-label={`Bỏ sản phẩm ${dong.sanPham.tenSanPham}`}>Bỏ</Button></div></td>
            </tr>;
          })}
        </tbody></table></div>
        {chiTietLoc.length === 0 && <p>Không có sản phẩm nào khớp từ khóa.</p>}
        {tongTrangDong > 1 && <Pagination trang={trangDongHienTai} tongTrang={tongTrangDong} onChange={setTrangDong} />}
      </>}
      {!chiTiet.length && <p>Chưa chọn sản phẩm nào. Bạn có thể chọn nhiều sản phẩm cùng lúc.</p>}
    </Card>

    {loiChung && <p className="khuyenMaiFormLoi" role="alert">{loiChung}</p>}
    <div className="khuyenMaiFormActions"><span>{chiTiet.length} sản phẩm trong chương trình</span><div><Button variant="secondary" disabled={dangGui} onClick={() => daThayDoi ? setXacNhanHuy(true) : onCancel()}>Hủy</Button><Button type="submit" loading={dangGui}>Lưu chương trình</Button></div></div>

    <Modal open={moChon} onClose={dangChonTatCa ? undefined : dongModal} title="Chọn sản phẩm"><div className="khuyenMaiPicker">
      <div className="khuyenMaiPickerFilters"><Field label="Tìm sản phẩm"><Input value={tuKhoa} disabled={dangChonTatCa} onChange={(event) => { setTuKhoa(event.target.value); setTrang(1); }} placeholder="Nhập tên sản phẩm" /></Field>
        <Field label="Danh mục"><Select value={danhMucId} disabled={dangChonTatCa} onChange={(event) => { setDanhMucId(event.target.value); setTrang(1); }}><option value="">Tất cả danh mục</option>{danhMuc.map((muc) => <option key={muc._id} value={muc._id}>{muc.tenDanhMuc}</option>)}</Select></Field></div>
      <div className="khuyenMaiPickerTools"><label><input type="checkbox" checked={daTickHetTrang} disabled={dangTaiSanPham || dangChonTatCa || !chuaThemTrenTrang.length} onChange={tickCaTrang} /> Chọn tất cả trên trang này</label>
        <Button variant="ghost" size="sm" loading={dangChonTatCa} disabled={dangTaiSanPham || !ketQua.phanTrang.tongSo} onClick={chonTatCaKetQua}>Chọn tất cả {ketQua.phanTrang.tongSo} kết quả phù hợp</Button></div>
      {dangTaiSanPham ? <p>Đang tải sản phẩm…</p> : loiSanPham ? <p className="khuyenMaiFormLoi" role="alert">{loiSanPham}</p> : !ketQua.danhSach.length ? <p>Không có sản phẩm phù hợp.</p> : <div className="khuyenMaiPickerList">{ketQua.danhSach.map((sanPham) => {
        const daCo = daThem.has(String(sanPham._id));
        return <label key={sanPham._id} className="khuyenMaiPickerItem"><input type="checkbox" checked={daCo || daChon.has(sanPham._id)} disabled={daCo || dangChonTatCa} aria-label={`Chọn ${sanPham.tenSanPham}${laQuanTri && sanPham.cuaHang?.tenCuaHang ? ` của ${sanPham.cuaHang.tenCuaHang}` : ''}`} onChange={() => tickSanPham(sanPham)} />
          {taoUrlAnh(sanPham.hinhAnh?.[0]) && <img src={taoUrlAnh(sanPham.hinhAnh[0])} alt="" />}
          <span><strong>{sanPham.tenSanPham}</strong>{laQuanTri && sanPham.cuaHang?.tenCuaHang && <small>{sanPham.cuaHang.tenCuaHang}</small>}<small>{dinhDangTien(sanPham.giaGoc)}{sanPham.soLuongTon != null ? ` · Còn ${sanPham.soLuongTon}` : ''}</small></span>
          {daCo && <small>Đã thêm</small>}
        </label>;
      })}</div>}
      <Pagination trang={ketQua.phanTrang.trang} tongTrang={ketQua.phanTrang.tongTrang} onChange={setTrang} />
      <div className="khuyenMaiPickerFooter"><strong>Đã chọn {daChon.size} sản phẩm</strong><div><Button variant="secondary" disabled={dangChonTatCa} onClick={dongModal}>Hủy</Button><Button disabled={!daChon.size || dangChonTatCa} onClick={themDaChon}>Thêm {daChon.size} sản phẩm vào chương trình</Button></div></div>
    </div></Modal>
    <ConfirmDialog open={xacNhanHuy} title="Hủy thay đổi?" message="Những thay đổi chưa lưu trong chương trình sẽ bị mất." confirmLabel="Hủy thay đổi" danger onClose={() => setXacNhanHuy(false)} onConfirm={onCancel} />
  </form>;
}
