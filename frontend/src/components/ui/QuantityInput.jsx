import Icon from './Icon.jsx';
import './QuantityInput.css';

export default function QuantityInput({ value, min = 1, max = Infinity, onChange, disabled = false }) {
  const gioiHan = (so) => Math.min(max, Math.max(min, so));
  const thayDoi = (giaTri) => { if (Number.isInteger(giaTri)) onChange(gioiHan(giaTri)); };
  return <div className="quantityInput"><button type="button" aria-label="Giảm số lượng" disabled={disabled || value <= min} onClick={() => thayDoi(value - 1)}><Icon name="minus" /></button><input type="number" aria-label="Số lượng" value={value} min={min} max={Number.isFinite(max) ? max : undefined} disabled={disabled} onChange={(event) => thayDoi(Number(event.target.value))} onBlur={(event) => { if (!event.target.value) onChange(min); }} /><button type="button" aria-label="Tăng số lượng" disabled={disabled || value >= max} onClick={() => thayDoi(value + 1)}><Icon name="plus" /></button></div>;
}
