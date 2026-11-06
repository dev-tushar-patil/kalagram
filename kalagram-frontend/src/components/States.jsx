import { AlertTriangle, Sprout } from 'lucide-react';
import { errorMessage } from '../services/api.js';
import Button from './Button.jsx';

export function Loading({ label = 'Loading' }) {
  return (
    <div className="state-box" role="status" aria-live="polite">
      <span className="earth-loader" aria-hidden="true"><i /><i /><i /></span>
      <p>{label}…</p>
    </div>
  );
}

export function ErrorState({ error, onRetry, message }) {
  return (
    <div className="state-box" role="alert">
      <AlertTriangle size={30} aria-hidden="true" />
      <p>{message || errorMessage(error)}</p>
      {onRetry && <Button variant="secondary" size="small" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="state-box">
      <Sprout size={30} aria-hidden="true" />
      <p className="state-title">{title}</p>
      {children}
    </div>
  );
}
