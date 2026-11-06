import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi, assetUrl, errorMessage, fieldErrors, publicApi } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import Button from '../../components/Button.jsx';
import Field from '../../components/Field.jsx';
import { EmptyState, ErrorState, Loading } from '../../components/States.jsx';
import { GALLERY_CATEGORIES } from '../../utils/format.js';
import { ConfirmDelete, FileUpload, Modal, Notice, PageTitle } from './ui.jsx';

function ImageDialog({ image, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: image?.title || '',
    altText: image?.altText || '',
    imageUrl: image?.imageUrl || '',
    category: image?.category || 'MUD_HOUSES',
    displayOrder: image?.displayOrder ?? 0,
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    const body = { ...form, displayOrder: Number(form.displayOrder) || 0 };
    try {
      if (image) await adminApi.put(`/gallery/${image.id}`, body);
      else await adminApi.post('/gallery', body);
      onSaved();
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Modal title={image ? 'Edit image' : 'Add image'} onClose={onClose}>
      <form onSubmit={save} noValidate className="admin-stack">
        <FileUpload label="Image *" value={form.imageUrl} onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))} />
        {errors.imageUrl && <small className="field-error">{errors.imageUrl}</small>}
        <Field label="Title" required value={form.title} onChange={set('title')} error={errors.title} maxLength={160} />
        <Field label="Description for screen readers" value={form.altText} onChange={set('altText')} error={errors.altText} maxLength={300} />
        <div className="form-grid">
          <Field label="Category" required as="select" value={form.category} onChange={set('category')} error={errors.category}>
            {Object.entries(GALLERY_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Field>
          <Field label="Display order" type="number" value={form.displayOrder} onChange={set('displayOrder')} hint="Lower numbers appear first." />
        </div>
        <Notice>{error}</Notice>
        <div className="modal-actions">
          <Button variant="secondary" size="small" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="small" loading={busy}>Save Image</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function GalleryAdmin() {
  const { data, loading, error, reload } = useFetch(publicApi.gallery, []);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  return (
    <>
      <PageTitle title="Gallery">
        <Button size="small" icon={<Plus size={17} aria-hidden="true" />} onClick={() => setEditing('new')}>Add Image</Button>
      </PageTitle>
      {loading && !data && <Loading label="Loading gallery" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data?.length === 0 && <EmptyState title="The gallery is empty. Add your first picture." />}
      {data?.length > 0 && (
        <ul className="admin-gallery">
          {data.map((image) => (
            <li key={image.id} className="admin-card">
              <img src={assetUrl(image.imageUrl)} alt={image.altText || image.title} loading="lazy" />
              <div className="admin-gallery-info">
                <strong>{image.title}</strong>
                <small className="muted">{GALLERY_CATEGORIES[image.category]}</small>
              </div>
              <div className="row-actions">
                <button type="button" className="icon-btn" aria-label={`Edit ${image.title}`} onClick={() => setEditing(image)}><Pencil size={17} /></button>
                <button type="button" className="icon-btn danger" aria-label={`Delete ${image.title}`} onClick={() => setDeleting(image)}><Trash2 size={17} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && <ImageDialog image={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={reload} />}
      {deleting && (
        <ConfirmDelete
          title="Delete image"
          message={`Delete "${deleting.title}" from the gallery?`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await adminApi.delete(`/gallery/${deleting.id}`);
            reload();
          }}
        />
      )}
    </>
  );
}
