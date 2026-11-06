import { useState } from 'react';
import { adminApi, errorMessage } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import Button from '../../components/Button.jsx';
import Field from '../../components/Field.jsx';
import { EmptyState, ErrorState, Loading } from '../../components/States.jsx';
import { formatDateTime } from '../../utils/format.js';
import { Modal, Notice, PageTitle, Pagination, StatusBadge } from './ui.jsx';

const STATUSES = { NEW: 'New', IN_PROGRESS: 'In progress', RESOLVED: 'Resolved', CLOSED: 'Closed' };

function EnquiryDialog({ enquiry, onClose, onSaved }) {
  const [status, setStatus] = useState(enquiry.status);
  const [notes, setNotes] = useState(enquiry.internalNotes || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setBusy(true);
    setError('');
    try {
      await adminApi.put(`/enquiries/${enquiry.id}`, { status, internalNotes: notes });
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Modal title={`Enquiry from ${enquiry.name}`} onClose={onClose}>
      <dl className="detail-list">
        <div><dt>Email</dt><dd><a href={`mailto:${enquiry.email}`}>{enquiry.email}</a></dd></div>
        <div><dt>Phone</dt><dd><a href={`tel:${enquiry.phone.replace(/[^+\d]/g, '')}`}>{enquiry.phone}</a></dd></div>
        <div><dt>Enquiry for</dt><dd>{enquiry.enquiryFor}</dd></div>
        <div><dt>Received</dt><dd>{formatDateTime(enquiry.createdAt)}</dd></div>
        <div><dt>Message</dt><dd className="pre-wrap">{enquiry.message}</dd></div>
      </dl>
      <div className="admin-stack">
        <Field label="Status" as="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Field>
        <Field label="Internal notes" as="textarea" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} hint="Only visible to admins." maxLength={10000} />
      </div>
      <Notice>{error}</Notice>
      <div className="modal-actions">
        <Button variant="secondary" size="small" onClick={onClose}>Cancel</Button>
        <Button size="small" loading={busy} onClick={save}>Save</Button>
      </div>
    </Modal>
  );
}

export default function EnquiriesAdmin() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const { data, loading, error, reload } = useFetch(
    () => adminApi.get('/enquiries', { params: { ...(status ? { status } : {}), page, size: 20 } }).then((r) => r.data),
    [status, page],
  );

  return (
    <>
      <PageTitle title="Enquiries" />
      <section className="admin-card">
        <div className="filter-bar narrow">
          <Field label="Status" as="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
            <option value="">All statuses</option>
            {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Field>
        </div>
        {loading && !data && <Loading label="Loading enquiries" />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data?.content.length === 0 && <EmptyState title="No enquiries here yet." />}
        {data?.content.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Phone</th><th>Enquiry for</th><th>Message</th><th>Status</th><th>Received</th></tr></thead>
                <tbody>
                  {data.content.map((e) => (
                    <tr key={e.id}>
                      <td><button type="button" className="table-link" onClick={() => setSelected(e)}>{e.name}</button></td>
                      <td className="nowrap">{e.phone}</td>
                      <td>{e.enquiryFor}</td>
                      <td className="truncate">{e.message}</td>
                      <td><StatusBadge value={e.status} /></td>
                      <td className="nowrap">{formatDateTime(e.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />
          </>
        )}
      </section>
      {selected && <EnquiryDialog enquiry={selected} onClose={() => setSelected(null)} onSaved={reload} />}
    </>
  );
}
