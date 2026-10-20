import Button from './Button.jsx';
import Icon from './Icon.jsx';
import './EmptyState.css';

export default function EmptyState({ icon = 'package', title = 'Chưa có dữ liệu', description, actionLabel, actionTo, onAction }) {
  return <div className="emptyState"><Icon name={icon} size={32} /><h2>{title}</h2>{description && <p>{description}</p>}{actionLabel && <Button variant="secondary" to={actionTo} onClick={onAction}>{actionLabel}</Button>}</div>;
}
