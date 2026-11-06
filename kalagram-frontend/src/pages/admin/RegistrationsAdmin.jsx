import { useEffect, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { adminApi, errorMessage } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import Button from '../../components/Button.jsx';
import Field from '../../components/Field.jsx';
import { EmptyState, ErrorState, Loading } from '../../components/States.jsx';
import { formatDateTime, formatRange } from '../../utils/format.js';
import { Modal, Notice, PageTitle, Pagination, StatusBadge } from './ui.jsx';

const STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
const EMPTY_FILTERS = { q: '', workshopId: '', status: '', from: '', to: '' };

const clean = (filters) => Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));

function RegistrationDialog({ registration, onClose, onChanged }) {
  const [current, setCurrent] = useState(registration);
  const [status, setStatus] = useState(registration.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  async function save() {
    setBusy(true);
    setError('');
    setSaved('');
    try {
      const { data } = await adminApi.put(`/registrations/${current.id}/status`, { status });
      setCurrent(data);
      setSaved('Status updated.');
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
      setStatus(current.status);
    } finally {
      setBusy(false);
    }
  }

  const rows = [
    ['Registration ID', current.registrationId],
    ['Name', current.fullName],
    ['Email', <a key="e" href={`mailto:${current.email}`}>{current.email}</a>],
    ['Mobile', <a key="m" href={`tel:${current.mobile.replace(/[^+\d]/g, '')}`}>{current.mobile}</a>],
    ['Workshop', current.workshopTitle],
    ['Batch', formatRange(current.startDate, current.endDate)],
    ['Participants', current.participants],
    ['City', current.city || '-'],
    ['Message', current.message || '-'],
    ['Received', formatDateTime(current.createdAt)],
  ];

  return (
    <Modal title="Registration details" onClose={onClose}>
      <dl className="detail-list">
        {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
      <div className="status-row">
        <Field label="Status" as="select" value={status} onChange={(e) => { setStatus(e.target.value); setSaved(''); }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </Field>
        <Button size="small" loading={busy} disabled={status === current.status} onClick={save}>Update Status</Button>
      </div>
      <small className="muted">Cancelling a registration returns its seats to the batch.</small>
      <Notice>{error}</Notice>
      <Notice kind="success">{saved}</Notice>
    </Modal>
  );
}

export default function RegistrationsAdmin() {
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const workshops = useFetch(() => adminApi.get('/workshops').then((r) => r.data), []);
  const { data, loading, error, reload } = useFetch(
    () => adminApi.get('/registrations', { params: { ...clean(filters), page, size: 20 } }).then((r) => r.data),
    [filters, page],
  );

  // Selects and dates apply at once; the search box waits until typing pauses.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) => {
        if (JSON.stringify(current) === JSON.stringify(draft)) return current;
        setPage(0);
        return draft;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [draft]);

  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  async function exportCsv() {
    setExporting(true);
    setExportError('');
    try {
      const response = await adminApi.get('/registrations/export', { params: clean(filters), responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kalagram-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(errorMessage(err, 'The export failed.'));
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageTitle title="Registrations">
        <Button variant="secondary" size="small" loading={exporting} icon={<Download size={16} aria-hidden="true" />} onClick={exportCsv}>Export CSV</Button>
      </PageTitle>
      <Notice>{exportError}</Notice>

      <section className="admin-card">
        <div className="filter-bar">
          <div className="search-field">
            <Search size={17} aria-hidden="true" />
            <input type="search" aria-label="Search by name, mobile or ID" placeholder="Search name, mobile or ID" value={draft.q} onChange={set('q')} />
          </div>
          <Field label="Workshop" as="select" value={draft.workshopId} onChange={set('workshopId')}>
            <option value="">All workshops</option>
            {workshops.data?.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
          </Field>
          <Field label="Status" as="select" value={draft.status} onChange={set('status')}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
          </Field>
          <Field label="Registered from" type="date" value={draft.from} onChange={set('from')} />
          <Field label="Registered to" type="date" value={draft.to} onChange={set('to')} />
        </div>

        {loading && !data && <Loading label="Loading registrations" />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {data?.content.length === 0 && <EmptyState title="No registrations match." />}
        {data?.content.length > 0 && (
          <>
            <p className="muted result-count">{data.totalElements} {data.totalElements === 1 ? 'registration' : 'registrations'}</p>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Mobile</th><th>Workshop</th><th>Batch</th><th>People</th><th>Status</th><th>Received</th></tr>
                </thead>
                <tbody>
                  {data.content.map((r) => (
                    <tr key={r.id}>
                      <td className="nowrap"><button type="button" className="table-link" onClick={() => setSelected(r)}>{r.registrationId}</button></td>
                      <td>{r.fullName}</td>
                      <td className="nowrap">{r.mobile}</td>
                      <td>{r.workshopTitle}</td>
                      <td className="nowrap">{formatRange(r.startDate, r.endDate)}</td>
                      <td>{r.participants}</td>
                      <td><StatusBadge value={r.status} /></td>
                      <td className="nowrap">{formatDateTime(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />
          </>
        )}
      </section>

      {selected && <RegistrationDialog registration={selected} onClose={() => setSelected(null)} onChanged={reload} />}
    </>
  );
}
