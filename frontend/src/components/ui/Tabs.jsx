import { useRef } from 'react';
import './Tabs.css';

export default function Tabs({ items, value, onChange, label = 'Các mục' }) {
  const refs = useRef({});
  const xuLyPhim = (event, index) => {
    const huong = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!huong && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const moi = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + huong + items.length) % items.length;
    onChange(items[moi].value);
    refs.current[items[moi].value]?.focus();
  };
  return <div className="tabs" role="tablist" aria-label={label}>{items.map((item, index) => <button key={item.value} ref={(node) => { refs.current[item.value] = node; }} type="button" role="tab" aria-selected={value === item.value} tabIndex={value === item.value ? 0 : -1} onClick={() => onChange(item.value)} onKeyDown={(event) => xuLyPhim(event, index)}>{item.label}</button>)}</div>;
}
