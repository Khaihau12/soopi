import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GiaTien from '../components/GiaTien.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Icon from '../components/ui/Icon.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Skeleton from '../components/ui/Skeleton.jsx';
import { useYeuThich } from '../hooks/YeuThichContext.jsx';
import useThongBao from '../hooks/useThongBao.js';
import { boLuuSanPhamYeuThich, laySanPhamYeuThich } from '../services/sanPhamYeuThich.api.js';
import { taoUrlAnh } from '../utils/dinhDang.js';
import { DUONG_DAN } from '../utils/hangSo.js';
import './SanPhamYeuThichPage.css';

export default function SanPhamYeuThichPage() {
  const [trang, setTrang] = useState(1);
  const [duLieu, setDuLieu] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');
  const [lanTai, setLanTai] = useState(0);
  const [dangBo, setDangBo] = useState('');
  const { taiLai: taiLaiId } = useYeuThich();
  const thongBao = useThongBao();

  useEffect(() => {
    let conHieuLuc = true;
    setDangTai(true); setLoi('');
    laySanPhamYeuThich({ trang }).then((data) => {
      if (!conHieuLuc) return;
      if (trang > 1 && !data.danhSach.length && data.phanTrang.tongSo > 0) { setTrang(trang - 1); return; }
      setDuLieu(data);
    }).catch((loiApi) => { if (conHieuLuc) setLoi(loiApi.message); })
      .finally(() => { if (conHieuLuc) setDangTai(false); });
    return () => { conHieuLuc = false; };
  }, [trang, lanTai]);

  const boLuu = async (id) => {
    setDangBo(id);
    try {
      await boLuuSanPhamYeuThich(id);
      taiLaiId();
      setLanTai((cu) => cu + 1);
      thongBao.thanhCong('Đã bỏ lưu sản phẩm');
    } catch (loiApi) { thongBao.loi(loiApi.message); }
    finally { setDangBo(''); }
  };

  return <div className="yeuThichPage"><PageHeader title="Sản phẩm yêu thích" description="Lưu sản phẩm để xem lại khi cần. Giá và tình trạng bán luôn được cập nhật." />
    {dangTai && !duLieu ? <Skeleton variant="block" count={3} /> : loi ? <ErrorState message={loi} taiLai={() => setLanTai((cu) => cu + 1)} />
      : !duLieu?.danhSach.length ? <EmptyState icon="heart" title="Bạn chưa lưu sản phẩm nào"
        description="Bấm biểu tượng trái tim trên sản phẩm bạn quan tâm để lưu tại đây."
        actionLabel="Khám phá sản phẩm" actionTo={DUONG_DAN.SAN_PHAM} />
        : <><p className="yeuThichSoLuong">{duLieu.phanTrang.tongSo} sản phẩm đã lưu</p>
          <div className="yeuThichDanhSach" aria-busy={dangTai}>{duLieu.danhSach.map((item) => {
            const sanPham = item.sanPham;
            const anh = sanPham && taoUrlAnh(sanPham.hinhAnh?.[0]);
            return <article key={item._id} className="yeuThichDong">
              <div className="yeuThichAnh">{anh ? <img src={anh} alt="" loading="lazy" /> : <Icon name="image" size={28} />}</div>
              <div className="yeuThichNoiDung"><h2>{sanPham?.tenSanPham || 'Sản phẩm không còn tồn tại'}</h2>
                {item.conBan ? <><p>{sanPham.cuaHang?.tenCuaHang || 'Cửa hàng'}</p><GiaTien giaGoc={sanPham.giaGoc} giaBanThucTe={sanPham.giaBanThucTe} kichThuoc="nho" />
                  {sanPham.soLuongTon === 0 && <span className="yeuThichTrangThai">Tạm hết hàng</span>}</>
                  : <span className="yeuThichTrangThai">Sản phẩm đã ngừng bán hoặc cửa hàng ngừng hoạt động</span>}</div>
              <div className="yeuThichHanhDong">{item.conBan && <Link to={DUONG_DAN.chiTietSanPham(item.sanPhamId)}>Xem sản phẩm</Link>}
                <Button variant="ghost" disabled={Boolean(dangBo)} onClick={() => boLuu(item.sanPhamId)}>Bỏ lưu</Button></div>
            </article>;
          })}</div><Pagination trang={duLieu.phanTrang.trang} tongTrang={duLieu.phanTrang.tongTrang} onChange={setTrang} /></>}
  </div>;
}
