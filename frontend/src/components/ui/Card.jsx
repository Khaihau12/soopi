import './Card.css';

export default function Card({ as: Tag = 'div', className = '', children, ...props }) {
  return <Tag className={['card', className].filter(Boolean).join(' ')} {...props}>{children}</Tag>;
}
