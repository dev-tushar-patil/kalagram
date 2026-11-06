import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi, errorMessage, fieldErrors, publicApi } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import Button from '../../components/Button.jsx';
import Field from '../../components/Field.jsx';
import { EmptyState, ErrorState, Loading } from '../../components/States.jsx';
import { ConfirmDelete, FileUpload, Modal, Notice, PageTitle, StatusBadge } from './ui.jsx';

const TYPES = { ARTICLE: 'Article', GUIDE: 'Guide', VIDEO: 'Video', DOWNLOAD: 'Downloadable file' };
const ICONS = { book: 'Book', video: 'Play button', download: 'Download arrow', article: 'Document' };

function ResourceDialog({ resource, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: resource?.title || '',
    categoryId: resource?.categoryId || categories[0]?.id || '',
    type: resource?.type || 'ARTICLE',
    shortDescription: resource?.shortDescription || '',
    body: resource?.body || '',
    thumbnailUrl: resource?.thumbnailUrl || '',
    fileUrl: resource?.fileUrl || '',
    videoUrl: resource?.videoUrl || '',
    readingMinutes: resource?.readingMinutes ?? '',
    featured: resource?.featured ?? false,
    published: resource?.published ?? true,
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
    const body = { ...form, categoryId: Number(form.categoryId), readingMinutes: form.readingMinutes === '' ? null : Number(form.readingMinutes) };
    try {
      if (resource) await adminApi.put(`/resources/${resource.id}`, body);
      else await adminApi.post('/resources', body);
      onSaved();
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Modal title={resource ? 'Edit resource' : 'Add resource'} onClose={onClose} wide>
      <form onSubmit={save} noValidate className="admin-stack">
        <Field label="Title" required value={form.title} onChange={set('title')} error={errors.title} maxLength={180} />
        <div className="form-grid">
          <Field label="Category" required as="select" value={form.categoryId} onChange={set('categoryId')} error={errors.categoryId}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Field>
          <Field label="Type" required as="select" value={form.type} onChange={set('type')} error={errors.type}>
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Field>
        </div>
        <Field label="Short description" required as="textarea" rows={2} value={form.shortDescription} onChange={set('shortDescription')} error={errors.shortDescription} maxLength={500} />
        {form.type === 'VIDEO' && <Field label="Video link" required type="url" value={form.videoUrl} onChange={set('videoUrl')} error={errors.videoUrl} placeholder="https://www.youtube.com/watch?v=..." hint="YouTube links play on the page. Other links open in a new tab." />}
        {(form.type === 'DOWNLOAD' || form.type === 'GUIDE' || form.type === 'ARTICLE') && (
          <FileUpload label={form.type === 'DOWNLOAD' ? 'PDF file *' : 'PDF file (optional)'} kind="file" accept="application/pdf" value={form.fileUrl} onChange={(url) => setForm((f) => ({ ...f, fileUrl: url }))} />
        )}
        <Field label="Text" as="textarea" rows={9} value={form.body} onChange={set('body')} error={errors.body} hint="Leave a blank line between paragraphs." />
        <div className="form-grid">
          <FileUpload label="Thumbnail" value={form.thumbnailUrl} onChange={(url) => setForm((f) => ({ ...f, thumbnailUrl: url }))} />
          <Field label="Reading time (minutes)" type="number" min="1" value={form.readingMinutes} onChange={set('readingMinutes')} error={errors.readingMinutes} />
        </div>
        <div className="check-row">
          <label className="check-field"><input type="checkbox" checked={form.featured} onChange={set('featured')} /> Featured</label>
          <label className="check-field"><input type="checkbox" checked={form.published} onChange={set('published')} /> Published</label>
        </div>
        <Notice>{error}</Notice>
        <div className="modal-actions">
          <Button variant="secondary" size="small" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="small" loading={busy}>Save Resource</Button>
        </div>
      </form>
    </Modal>
  );
}

function CategoryDialog({ category, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    icon: category?.icon || 'article',
    displayOrder: category?.displayOrder ?? 0,
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
      if (category) await adminApi.put(`/resource-categories/${category.id}`, body);
      else await adminApi.post('/resource-categories', body);
      onSaved();
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Modal title={category ? 'Edit category' : 'Add category'} onClose={onClose}>
      <form onSubmit={save} noValidate className="admin-stack">
        <Field label="Name" required value={form.name} onChange={set('name')} error={errors.name} maxLength={100} />
        <Field label="Description" value={form.description} onChange={set('description')} error={errors.description} maxLength={255} />
        <div className="form-grid">
          <Field label="Icon" as="select" value={form.icon} onChange={set('icon')}>
            {Object.entries(ICONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Field>
          <Field label="Display order" type="number" value={form.displayOrder} onChange={set('displayOrder')} />
        </div>
        <Notice>{error}</Notice>
        <div className="modal-actions">
          <Button variant="secondary" size="small" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="small" loading={busy}>Save Category</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ResourcesAdmin() {
  const resources = useFetch(() => adminApi.get('/resources').then((r) => r.data), []);
  const categories = useFetch(publicApi.resourceCategories, []);
  const [editing, setEditing] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  return (
    <>
      <PageTitle title="Resources">
        <Button size="small" icon={<Plus size={17} aria-hidden="true" />} disabled={!categories.data?.length} onClick={() => setEditing('new')}>Add Resource</Button>
      </PageTitle>

      <section className="admin-card">
        {resources.loading && !resources.data && <Loading label="Loading resources" />}
        {resources.error && <ErrorState error={resources.error} onRetry={resources.reload} />}
        {resources.data?.length === 0 && <EmptyState title="No resources yet." />}
        {resources.data?.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>Title</th><th>Category</th><th>Type</th><th>Status</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {resources.data.map((r) => (
                  <tr key={r.id}>
                    <td><button type="button" className="table-link" onClick={() => setEditing(r)}>{r.title}</button>{r.featured && <small className="muted"> (featured)</small>}</td>
                    <td>{r.categoryName}</td>
                    <td>{TYPES[r.type]}</td>
                    <td><StatusBadge value={r.published ? 'published' : 'draft'} /></td>
                    <td className="row-actions">
                      <button type="button" className="icon-btn" aria-label={`Edit ${r.title}`} onClick={() => setEditing(r)}><Pencil size={17} /></button>
                      <button type="button" className="icon-btn danger" aria-label={`Delete ${r.title}`} onClick={() => setDeleting(r)}><Trash2 size={17} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-card">
        <div className="card-head">
          <h2>Categories</h2>
          <Button size="small" variant="secondary" icon={<Plus size={16} aria-hidden="true" />} onClick={() => setEditingCategory('new')}>Add Category</Button>
        </div>
        {categories.error && <ErrorState error={categories.error} onRetry={categories.reload} />}
        <ul className="category-admin-list">
          {categories.data?.map((c) => (
            <li key={c.id}>
              <span><strong>{c.name}</strong><small className="muted">{c.description}</small></span>
              <span className="row-actions">
                <button type="button" className="icon-btn" aria-label={`Edit ${c.name}`} onClick={() => setEditingCategory(c)}><Pencil size={17} /></button>
                <button type="button" className="icon-btn danger" aria-label={`Delete ${c.name}`} onClick={() => setDeletingCategory(c)}><Trash2 size={17} /></button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {editing && <ResourceDialog resource={editing === 'new' ? null : editing} categories={categories.data || []} onClose={() => setEditing(null)} onSaved={resources.reload} />}
      {editingCategory && <CategoryDialog category={editingCategory === 'new' ? null : editingCategory} onClose={() => setEditingCategory(null)} onSaved={categories.reload} />}
      {deleting && (
        <ConfirmDelete
          title="Delete resource"
          message={`Delete "${deleting.title}"?`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await adminApi.delete(`/resources/${deleting.id}`);
            resources.reload();
          }}
        />
      )}
      {deletingCategory && (
        <ConfirmDelete
          title="Delete category"
          message={`Delete the category "${deletingCategory.name}"?`}
          onClose={() => setDeletingCategory(null)}
          onConfirm={async () => {
            await adminApi.delete(`/resource-categories/${deletingCategory.id}`);
            categories.reload();
          }}
        />
      )}
    </>
  );
}
