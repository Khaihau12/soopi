import './Icon.css';

const DUONG_NET = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  cart: <><path d="M3 4h2l2 12h11l2-9H6" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  store: <><path d="M3 9h18l-2-5H5L3 9Zm1 0v11h16V9M9 20v-7h6v7" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="M5 5l14 14M19 5 5 19" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronLeft: <path d="m15 5-7 7 7 7" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  trash: <><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v6M14 11v6" /></>,
  edit: <><path d="m4 20 4-.8L20 7l-3-3L5 16l-1 4ZM14 7l3 3" /></>,
  check: <path d="m4 12 5 5L20 6" />,
  alert: <><path d="M12 3 2 21h20L12 3Z" /><path d="M12 9v5m0 3h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10h.01" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
  starFill: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
  chat: <path d="M4 5h16v12H8l-4 3V5Z" />,
  package: <><path d="m3 7 9-4 9 4v10l-9 4-9-4V7Zm0 0 9 4 9-4m-9 4v10" /></>,
  tag: <><path d="M3 4h9l9 9-8 8-10-10V4Z" /><circle cx="8" cy="8" r="1" /></>,
  ticket: <path d="M3 7h18v4a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V7Zm9 0v11" />,
  logout: <><path d="M10 4H4v16h6m4-13 5 5-5 5m5-5H9" /></>,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  chart: <path d="M4 20V12m5 8V7m5 13v-5m5 5V4M2 20h20" />,
  upload: <path d="M4 17v3h16v-3M12 16V3m-5 5 5-5 5 5" />,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="1" /><path d="m3 17 5-5 4 4 3-3 6 6" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  eye: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="3" /></>,
};

export default function Icon({ name, size = 20, title }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill={name === 'starFill' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false">{DUONG_NET[name] || DUONG_NET.info}</svg>;
}
