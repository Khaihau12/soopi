import { useContext } from 'react';
import { ThongBaoContext } from '../components/ui/ThongBaoProvider.jsx';

export default function useThongBao() {
  const thongBao = useContext(ThongBaoContext);
  if (!thongBao) throw new Error('useThongBao cần được dùng trong ThongBaoProvider');
  return thongBao;
}
