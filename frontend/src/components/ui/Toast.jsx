import Icon from './Icon.jsx';
import './Toast.css';

const BIEU_TUONG = { success: 'check', danger: 'alert', info: 'info' };

export default function Toast({ danhSach, dong }) {
  return <div className="toastList" aria-live="polite">{danhSach.map((item) => <div key={item.id} className={'toast toast' + item.variant[0].toUpperCase() + item.variant.slice(1)} role="status"><Icon name={BIEU_TUONG[item.variant]} /><span>{item.message}</span><button type="button" aria-label="Đóng thông báo" onClick={() => dong(item.id)}><Icon name="close" /></button></div>)}</div>;
}
