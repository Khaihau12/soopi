import { Link } from 'react-router-dom';
import Spinner from './Spinner.jsx';
import './Button.css';

export default function Button({ variant = 'primary', size = 'md', loading = false, fullWidth = false, to, disabled = false, children, className = '', onClick, ...props }) {
  const tenLop = ['button', 'button' + variant[0].toUpperCase() + variant.slice(1), 'button' + size.toUpperCase(), fullWidth && 'buttonFullWidth', className].filter(Boolean).join(' ');
  const noiDung = <>{loading && <Spinner size="sm" />}<span>{children}</span></>;

  if (to) {
    return <Link to={to} className={tenLop} aria-disabled={disabled || loading || undefined} tabIndex={disabled || loading ? -1 : undefined} {...props} onClick={disabled || loading ? (event) => event.preventDefault() : onClick}>{noiDung}</Link>;
  }

  return <button type="button" className={tenLop} disabled={disabled || loading} aria-busy={loading || undefined} onClick={onClick} {...props}>{noiDung}</button>;
}
