import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi, errorMessage, fieldErrors } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import Button from '../../components/Button.jsx';
import Field from '../../components/Field.jsx';
import { ErrorState, Loading } from '../../components/States.jsx';
import { formatDate, LEVEL_LABELS } from '../../utils/format.js';
import { ConfirmDelete, FileUpload, Modal, Notice, PageTitle, StatusBadge } from './ui.jsx';

const lines = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean);

const toForm = (w) => ({
  title: w?.title || '',
  category: w?.category || '',
  shortDescription: w?.shortDescription || '',
  overview: w?.overview || '',
  imageUrl: w?.imageUrl || '',
  bannerUrl: w?.bannerUrl || '',
  duration: w?.duration || '',
  skillLevel: w?.skillLevel || 'BEGINNER',
  priceInr: w?.priceInr ?? '',
  location: w?.location || '',
  learningOutcomes: (w?.learningOutcomes || []).join('\n'),
  curriculum: (w?.curriculum || []).join('\n'),
  schedule: (w?.schedule || []).map((d) => `${d.day} | ${d.title} | ${d.description}`).join('\n'),
  materialsProvided: (w?.materialsProvided || []).join('\n'),
  whatToBring: (w?.whatToBring || []).join('\n'),
  faqs: (w?.faqs || []).map((f) => `${f.question} | ${f.answer}`).join('\n'),
  displayOrder: w?.displayOrder ?? 0,
  active: w?.active ?? true,
});

function toRequest(f) {
  return {
    ...f,
    priceInr: f.priceInr === '' ? null : Number(f.priceInr),
    displayOrder: Number(f.displayOrder) || 0,
    learningOutcomes: lines(f.learningOutcomes),
    curriculum: lines(f.curriculum),
    materialsProvided: lines(f.materialsProvided),
    whatToBring: lines(f.whatToBring),
    schedule: lines(f.schedule).map((l) => {
      const [day = '', title = '', ...rest] = l.split('|').map((p) => p.trim());
      return { day, title, description: rest.join(' | ') };
    }),
    faqs: lines(f.faqs).map((l) => {
      const [question = '', ...rest] = l.split('|').map((p) => p.trim());
      return { question, answer: rest.join(' | ') };
    }),
  };
}

function BatchDialog({ workshopId, batch, onClose, onSaved }) {
  const [form, setForm] = useState({
    label: batch?.label || '',
    startDate: batch?.startDate || '',
    endDate: batch?.endDate || '',
    totalSeats: batch?.totalSeats ?? 20,
    active: batch?.active ?? true,
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    const body = { ...form, workshopId, totalSeats: Number(form.totalSeats) };
    try {
      if (batch) await adminApi.put(`/batches/${batch.id}`, body);
      else await adminApi.post('/batches', body);
      onSaved();
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Modal title={batch ? 'Edit batch' : 'Add batch'} onClose={onClose}>
      <form onSubmit={save} noValidate>
        <div className="form-grid">
          <Field label="Label (optional)" className="span-2" value={form.label} onChange={set('label')} error={errors.label} maxLength={120} placeholder="e.g. Winter batch" />
          <Field label="Start date" required type="date" value={form.startDate} onChange={set('startDate')} error={errors.startDate} />
          <Field label="End date" required type="date" min={form.startDate} value={form.endDate} onChange={set('endDate')} error={errors.endDate} />
          <Field
            label="Total seats"
            required
            type="number"
            min={Math.max(1, batch?.bookedSeats || 1)}
            value={form.totalSeats}
            onChange={set('totalSeats')}
            error={errors.totalSeats}
            hint={batch ? `${batch.bookedSeats} already booked` : undefined}
          />
          <label className="check-field"><input type="checkbox" checked={form.active} onChange={set('active')} /> Open for registration</label>
        </div>
        <Notice>{error}</Notice>
        <div className="modal-actions">
          <Button variant="secondary" size="small" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="small" loading={busy}>Save Batch</Button>
        </div>
      </form>
    </Modal>
  );
}

function BatchManager({ workshopId }) {
  const { data, loading, error, reload } = useFetch(() => adminApi.get(`/workshops/${workshopId}/batches`).then((r) => r.data), [workshopId]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  return (
    <section className="admin-card">
      <div className="card-head">
        <h2>Batches &amp; Seats</h2>
        <Button size="small" variant="secondary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setEditing('new')}>Add Batch</Button>
      </div>
      {loading && !data && <Loading label="Loading batches" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data?.length === 0 && <p className="muted">No batches yet. Add one so visitors can register.</p>}
      {data?.length > 0 && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead><tr><th>Dates</th><th>Label</th><th>Booked</th><th>Available</th><th>Status</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {data.map((b) => (
                <tr key={b.id}>
                  <td className="nowrap">{formatDate(b.startDate)} to {formatDate(b.endDate)}</td>
                  <td>{b.label || <span className="muted">-</span>}</td>
                  <td>{b.bookedSeats} / {b.totalSeats}</td>
                  <td>{b.availableSeats}</td>
                  <td><StatusBadge value={b.open ? 'open' : b.availableSeats === 0 ? 'full' : 'closed'} /></td>
                  <td className="row-actions">
                    <button type="button" className="icon-btn" aria-label="Edit batch" onClick={() => setEditing(b)}><Pencil size={17} /></button>
                    <button type="button" className="icon-btn danger" aria-label="Delete batch" onClick={() => setDeleting(b)}><Trash2 size={17} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <BatchDialog workshopId={workshopId} batch={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={reload} />}
      {deleting && (
        <ConfirmDelete
          title="Delete batch"
          message={`Delete the batch starting ${formatDate(deleting.startDate)}?`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await adminApi.delete(`/batches/${deleting.id}`);
            reload();
          }}
        />
      )}
    </section>
  );
}

export default function WorkshopEditor() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { data: workshop, loading, error, reload } = useFetch(
    () => (isNew ? Promise.resolve(null) : adminApi.get(`/workshops/${id}`).then((r) => r.data)),
    [id],
  );
  const [form, setForm] = useState(toForm(null));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (workshop) setForm(toForm(workshop));
  }, [workshop]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    setSaved('');
  };

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    setErrors({});
    setSaved('');
    try {
      if (isNew) {
        const { data } = await adminApi.post('/workshops', toRequest(form));
        navigate(`/admin/workshops/${data.id}`, { replace: true });
      } else {
        await adminApi.put(`/workshops/${id}`, toRequest(form));
        setSaved('Workshop saved.');
      }
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading && !workshop && !isNew) return <Loading label="Loading workshop" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <PageTitle title={isNew ? 'Add Workshop' : form.title || 'Edit Workshop'}>
        <Link to="/admin/workshops" className="back-link"><ArrowLeft size={16} aria-hidden="true" />All workshops</Link>
      </PageTitle>

      <form onSubmit={save} noValidate className="admin-stack">
        <section className="admin-card">
          <h2>Basics</h2>
          <div className="form-grid">
            <Field label="Title" required value={form.title} onChange={set('title')} error={errors.title} maxLength={160} />
            <Field label="Category" required value={form.category} onChange={set('category')} error={errors.category} maxLength={120} hint="Visitors can filter workshops by category." />
            <Field label="Short description" required as="textarea" rows={2} className="span-2" value={form.shortDescription} onChange={set('shortDescription')} error={errors.shortDescription} maxLength={500} />
            <Field label="Overview" required as="textarea" rows={6} className="span-2" value={form.overview} onChange={set('overview')} error={errors.overview} hint="Leave a blank line between paragraphs." />
            <Field label="Duration" required value={form.duration} onChange={set('duration')} error={errors.duration} maxLength={60} placeholder="e.g. 5-7 Days" />
            <Field label="Skill level" required as="select" value={form.skillLevel} onChange={set('skillLevel')} error={errors.skillLevel}>
              {Object.entries(LEVEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Field>
            <Field label="Starting price (₹)" type="number" min="0" step="1" value={form.priceInr} onChange={set('priceInr')} error={errors.priceInr} hint="Leave empty to show “Price on request”." />
            <Field label="Location" value={form.location} onChange={set('location')} error={errors.location} maxLength={200} />
            <Field label="Display order" type="number" value={form.displayOrder} onChange={set('displayOrder')} hint="Lower numbers appear first." />
            <label className="check-field"><input type="checkbox" checked={form.active} onChange={set('active')} /> Show on the website</label>
          </div>
        </section>

        <section className="admin-card">
          <h2>Images</h2>
          <div className="form-grid">
            <FileUpload label="Card image" value={form.imageUrl} onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))} />
            <FileUpload label="Banner image (optional)" value={form.bannerUrl} onChange={(url) => setForm((f) => ({ ...f, bannerUrl: url }))} />
          </div>
        </section>

        <section className="admin-card">
          <h2>Details</h2>
          <div className="form-grid">
            <Field label="What you will learn" as="textarea" rows={6} value={form.learningOutcomes} onChange={set('learningOutcomes')} hint="One item per line." />
            <Field label="Course curriculum" as="textarea" rows={6} value={form.curriculum} onChange={set('curriculum')} hint="One item per line." />
            <Field label="Materials provided" as="textarea" rows={4} value={form.materialsProvided} onChange={set('materialsProvided')} hint="One item per line." />
            <Field label="What participants should bring" as="textarea" rows={4} value={form.whatToBring} onChange={set('whatToBring')} hint="One item per line." />
            <Field label="Day-wise schedule" as="textarea" rows={6} className="span-2" value={form.schedule} onChange={set('schedule')} hint="One day per line: Day 1 | Title | Description" />
            <Field label="Frequently asked questions" as="textarea" rows={5} className="span-2" value={form.faqs} onChange={set('faqs')} hint="One per line: Question | Answer" />
          </div>
        </section>

        <Notice>{formError}</Notice>
        <Notice kind="success">{saved}</Notice>
        <div className="admin-save-row">
          <Button type="submit" loading={busy}>{isNew ? 'Create Workshop' : 'Save Changes'}</Button>
        </div>
      </form>

      {!isNew && <BatchManager workshopId={Number(id)} />}
    </>
  );
}
