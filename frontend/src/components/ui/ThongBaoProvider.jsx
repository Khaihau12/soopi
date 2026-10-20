import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import Toast from './Toast.jsx';

export const ThongBaoContext = createContext(null);

export default function ThongBaoProvider({ children }) {
  const [danhSach, setDanhSach] = useState([]);
  const idRef = useRef(0);
  const timerRef = useRef(new Map());

  const dong = useCallback((id) => {
    clearTimeout(timerRef.current.get(id));
    timerRef.current.delete(id);
    setDanhSach((cu) => cu.filter((item) => item.id !== id));
  }, []);

  const them = useCallback((message, variant) => {
    const id = ++idRef.current;
    setDanhSach((cu) => [...cu.slice(-2), { id, message, variant }]);
    timerRef.current.set(id, setTimeout(() => dong(id), 4000));
  }, [dong]);

  useEffect(() => {
    const cacTimer = timerRef.current;
    return () => { cacTimer.forEach((timer) => clearTimeout(timer)); };
  }, []);

  const thongBao = {
    thanhCong: (message) => them(message, 'success'),
    loi: (message) => them(message, 'danger'),
    thongTin: (message) => them(message, 'info'),
  };
  return <ThongBaoContext.Provider value={thongBao}>{children}<Toast danhSach={danhSach} dong={dong} /></ThongBaoContext.Provider>;
}
