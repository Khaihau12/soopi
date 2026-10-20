import { useCallback, useEffect, useRef, useState } from 'react';

export default function useGoiApi(hamGoi, phuThuoc = []) {
  const hamGoiRef = useRef(hamGoi);
  hamGoiRef.current = hamGoi;

  const lanGoiRef = useRef(0);
  const [lanTaiLai, setLanTaiLai] = useState(0);
  const [duLieu, setDuLieu] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState('');

  const taiLai = useCallback(() => setLanTaiLai((lan) => lan + 1), []);

  useEffect(() => {
    let conHieuLuc = true;
    const lanGoi = ++lanGoiRef.current;
    setDangTai(true);
    setLoi('');

    Promise.resolve()
      .then(() => hamGoiRef.current())
      .then((ketQua) => {
        if (conHieuLuc && lanGoi === lanGoiRef.current) setDuLieu(ketQua);
      })
      .catch((loiMoi) => {
        if (conHieuLuc && lanGoi === lanGoiRef.current) {
          setLoi(loiMoi?.message || 'Không tải được dữ liệu. Vui lòng thử lại.');
        }
      })
      .finally(() => {
        if (conHieuLuc && lanGoi === lanGoiRef.current) setDangTai(false);
      });

    return () => { conHieuLuc = false; };
  }, [...phuThuoc, lanTaiLai]);

  return { duLieu, dangTai, loi, taiLai };
}
