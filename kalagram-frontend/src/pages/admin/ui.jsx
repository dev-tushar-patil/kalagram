import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X } from 'lucide-react';
import { adminApi, assetUrl, errorMessage } from '../../services/api.js';
import Button from '../../components/Button.jsx';

export function PageTitle({ title, children }) {
  return (
    <header className="admin-title">
      <h1>{title}</h1>
      {children && <div className="admin-title-actions">{children}</div>}
    </header>
  );
}

export function StatusBadge({ value }) {
  return <span className={`badge badge-${String(value).toLowerCase()}`}>{String(value).replace(/_/g, ' ').toLowerCase()}</span>;
}

export function Notice({ kind = 'error', children }) {
  if (!children) return null;
  return <p className={kind === 'error' ? 'form-error' : 'form-success'} role={kind === 'error' ? 'alert' : 'status'}>{children}</p>;
}

export function Modal({ title, onClose, children, wide }) {
  const dialog = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialog} className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <header>
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Asks before a destructive action and shows why it failed, e.g. a workshop that still has registrations. */
export function ConfirmDelete({ title, message, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <p>{message}</p>
      <Notice>{error}</Notice>
      <div className="modal-actions">
        <Button variant="secondary" size="small" onClick={onClose}>Cancel</Button>
        <Button size="small" className="btn-danger" loading={busy} onClick={run}>Delete</Button>
      </div>
    </Modal>
  );
}

/** Uploads a file straight away and hands back its URL. */
export function FileUpload({ label, value, onChange, accept = 'image/jpeg,image/png,image/webp', kind = 'image' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await adminApi.post('/uploads', form);
      onChange(data.url);
    } catch (err) {
      setError(errorMessage(err, 'The upload failed.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field upload-field">
      <span className="upload-label">{label}</span>
      <div className="upload-row">
        {kind === 'image' && value && <img src={assetUrl(value)} alt="" className="upload-preview" />}
        {kind !== 'image' && value && <a href={assetUrl(value)} target="_blank" rel="noopener noreferrer" className="upload-file">Current file</a>}
        <label className={`btn btn-secondary btn-small upload-button ${busy ? 'is-busy' : ''}`}>
          <Upload size={16} aria-hidden="true" />
          <span>{busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}</span>
          <input type="file" accept={accept} onChange={upload} disabled={busy} className="sr-only" />
        </label>
        {value && <button type="button" className="text-button" onClick={() => onChange('')}>Remove</button>}
      </div>
      {error && <small className="field-error" role="alert">{error}</small>}
    </div>
  );
}

export function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pages">
      <Button variant="secondary" size="small" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</Button>
      <span>Page {page + 1} of {totalPages}</span>
      <Button variant="secondary" size="small" disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)}>Next</Button>
    </nav>
  );
}
