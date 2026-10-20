import Button from './Button.jsx';
import Icon from './Icon.jsx';
import './ErrorState.css';

export default function ErrorState({ message = 'Không tải được dữ liệu. Vui lòng thử lại.', taiLai }) {
  return <div className="errorState" role="alert"><Icon name="alert" size={28} /><p>{message}</p>{taiLai && <Button variant="secondary" onClick={taiLai}>Thử lại</Button>}</div>;
}
