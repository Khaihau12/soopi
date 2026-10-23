import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';
import './Modal.css';

const BO_CHON_FOCUS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, title, children, className = '' }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const phanTuTruoc = document.activeElement;
    const overflowTruoc = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const focusDau = dialog.querySelector(BO_CHON_FOCUS);
    (focusDau || dialog).focus();

    const xuLyPhim = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
      }
      if (event.key !== 'Tab') return;
      const cacPhanTu = Array.from(dialog.querySelectorAll(BO_CHON_FOCUS));
      if (cacPhanTu.length === 0) { event.preventDefault(); return; }
      const dau = cacPhanTu[0];
      const cuoi = cacPhanTu[cacPhanTu.length - 1];
      if (event.shiftKey && (document.activeElement === dau || !dialog.contains(document.activeElement))) { event.preventDefault(); cuoi.focus(); }
      else if (!event.shiftKey && (document.activeElement === cuoi || !dialog.contains(document.activeElement))) { event.preventDefault(); dau.focus(); }
    };
    document.addEventListener('keydown', xuLyPhim);
    return () => {
      document.removeEventListener('keydown', xuLyPhim);
      document.body.style.overflow = overflowTruoc;
      phanTuTruoc?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(<div className="modalOverlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}><section ref={dialogRef} className={['modal', className].filter(Boolean).join(' ')} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}><div className="modalHeader"><h2 id={titleId}>{title}</h2><button className="modalClose" type="button" aria-label="Đóng hộp thoại" disabled={!onClose} onClick={onClose}><Icon name="close" /></button></div><div className="modalBody">{children}</div></section></div>, document.body);
}
