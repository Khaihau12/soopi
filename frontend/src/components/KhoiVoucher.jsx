import ChonVoucher from './ChonVoucher.jsx';

export default function KhoiVoucher({ duLieu, maDaChon, onThayDoi, dangTai }) {
  return <section className="thanhToanCard"><ChonVoucher loai="Toàn sàn" duLieu={duLieu} maDaChon={maDaChon} onThayDoi={onThayDoi} dangTai={dangTai} />
    {duLieu.voucherKhongHopLe.length > 0 && <div role="alert" className="thanhToanCanhBao"><strong>Voucher chưa áp dụng</strong><ul>{duLieu.voucherKhongHopLe.map((voucher) => <li key={voucher.maVoucher}>{voucher.maVoucher}: {voucher.lyDo}</li>)}</ul></div>}
  </section>;
}
