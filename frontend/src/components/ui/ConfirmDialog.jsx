import Button from './Button.jsx';
import Modal from './Modal.jsx';
import './ConfirmDialog.css';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Xác nhận', cancelLabel = 'Hủy', danger = false, loading = false }) {
  return <Modal open={open} onClose={loading ? undefined : onClose} title={title}><p>{message}</p><div className="confirmDialogActions"><Button variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button><Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button></div></Modal>;
}
