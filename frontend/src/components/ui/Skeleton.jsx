import './Skeleton.css';

export default function Skeleton({ variant = 'text', count = 1 }) {
  return <div className="skeletonGroup" aria-label="Đang tải nội dung">{Array.from({ length: count }, (_, index) => <span key={index} className={'skeleton skeleton' + variant[0].toUpperCase() + variant.slice(1)} />)}</div>;
}
