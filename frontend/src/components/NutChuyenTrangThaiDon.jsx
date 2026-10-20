import { useState } from 'react';
import useThongBao from '../hooks/useThongBao.js';
import { capNhatTrangThaiDonHang } from '../services/donHang.api.js';
import { dinhDangTien, maDonHangHienThi } from '../utils/dinhDang.js';
import { HANH_DONG_TIEP_THEO, TRANG_THAI_XU_LY } from '../utils/hangSo.js';
import Button from './ui/Button.jsx';
import ConfirmDialog from './ui/ConfirmDialog.jsx';

export default function NutChuyenTrangThaiDon({ donHang, onDaCapNhat, onTaiLai }) {
  const [moXacNhan, setMoXacNhan] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState('');
  const thongBao = useThongBao();
  const hanhDong = HANH_DONG_TIEP_THEO[donHang.trangThaiXuLy];
  if (!donHang.coTheCapNhat || !hanhDong || hanhDong.dich !== donHang.trangThaiTiepTheo) return null;
  const thuTien = donHang.phuongThucThanhToan === 'COD'
    && donHang.trangThaiTiepTheo === TRANG_THAI_XU_LY.HOAN_THANH;
  const xacNhan = async () => {
    setDangGui(true); setLoi('');
    try {
      const ketQua = await capNhatTrangThaiDonHang(donHang._id, hanhDong.dich);
      setMoXacNhan(false);
      thongBao.thanhCong('Đã cập nhật trạng thái đơn hàng');
      await onDaCapNhat?.(ketQua.donHang);
    } catch (loiApi) {
      setMoXacNhan(false); setLoi(loiApi.message);
      if (loiApi.status === 409) await onTaiLai?.();
    } finally { setDangGui(false); }
  };
  const thongDiep = thuTien
    ? `Xác nhận đã giao hàng và thu đủ ${dinhDangTien(donHang.tongThanhToan)} cho đơn ${maDonHangHienThi(donHang._id)}?`
    : `Chuyển đơn ${maDonHangHienThi(donHang._id)} sang “${hanhDong.dich}”?`;
  return <>
    <Button size="sm" onClick={() => { setLoi(''); setMoXacNhan(true); }} disabled={dangGui}>{hanhDong.nhan}</Button>
    {loi && <p className="donHangBanLoi" role="alert">{loi}</p>}
    <ConfirmDialog open={moXacNhan} onClose={() => setMoXacNhan(false)} onConfirm={xacNhan}
      title={thuTien ? 'Xác nhận giao hàng và thu tiền' : 'Xác nhận đổi trạng thái'}
      message={thongDiep} confirmLabel={hanhDong.nhan} loading={dangGui} />
  </>;
}
