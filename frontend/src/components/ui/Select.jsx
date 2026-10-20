import './Select.css';

export default function Select({ className = '', children, ...props }) {
  return <select className={['select', className].filter(Boolean).join(' ')} {...props}>{children}</select>;
}
