import { useRef, useState } from 'react';
import { taoThanhToanVnpay } from '../services/giaoDichThanhToan.api.js';

export default function useThanhToanVnpay() {
  const [dangChuyen, setDangChuyen] = useState(false);
  const [loi, setLoi] = useState('');
  const dangChuyenRef = useRef(false);

  const thanhToan = async (giaoDichId) => {
    if (dangChuyenRef.current) return;
    dangChuyenRef.current = true;
    setDangChuyen(true);
    setLoi('');
    try {
      const { duongDanThanhToan } = await taoThanhToanVnpay(giaoDichId);
      window.location.assign(duongDanThanhToan);
    } catch (loiApi) {
      setLoi(loiApi.message || 'Không mở được VNPay. Vui lòng thử lại.');
      setDangChuyen(false);
      dangChuyenRef.current = false;
    }
  };

  return { thanhToan, dangChuyen, loi };
}
