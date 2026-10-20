import './Spinner.css';

export default function Spinner({ size = 'md' }) {
  return <span className={'spinner spinner' + size.toUpperCase()} role="status" aria-label="Đang tải" />;
}
