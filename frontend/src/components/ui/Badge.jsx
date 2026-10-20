import './Badge.css';

export default function Badge({ variant = 'neutral', children }) {
  return <span className={'badge badge' + variant[0].toUpperCase() + variant.slice(1)}>{children}</span>;
}
