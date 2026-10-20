import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import './DropdownMenu.css';

export default function DropdownMenu({ label, children }) {
  const [mo, setMo] = useState(false);
  const ref = useRef(null);
  const nutRef = useRef(null);

  useEffect(() => {
    if (!mo) return undefined;
    const dongNeuNgoai = (event) => { if (!ref.current?.contains(event.target)) setMo(false); };
    const xuLyPhim = (event) => {
      if (event.key === 'Escape') { setMo(false); nutRef.current?.focus(); }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const muc = Array.from(ref.current?.querySelectorAll('[role="menuitem"]') || []);
        if (!muc.length) return;
        event.preventDefault();
        const viTri = muc.indexOf(document.activeElement);
        const tiep = event.key === 'ArrowDown' ? (viTri + 1) % muc.length : (viTri - 1 + muc.length) % muc.length;
        muc[tiep].focus();
      }
    };
    document.addEventListener('pointerdown', dongNeuNgoai);
    document.addEventListener('keydown', xuLyPhim);
    return () => { document.removeEventListener('pointerdown', dongNeuNgoai); document.removeEventListener('keydown', xuLyPhim); };
  }, [mo]);

  return <div className="dropdownMenu" ref={ref}><button ref={nutRef} type="button" className="dropdownMenuTrigger" aria-expanded={mo} aria-haspopup="menu" onClick={() => setMo(!mo)}>{label}<Icon name="chevronDown" /></button>{mo && <div className="dropdownMenuPanel" role="menu" onClick={() => setMo(false)}>{children}</div>}</div>;
}
