import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi, assetUrl } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import Button from '../../components/Button.jsx';
import { EmptyState, ErrorState, Loading } from '../../components/States.jsx';
import { formatPrice, LEVEL_LABELS } from '../../utils/format.js';
import { ConfirmDelete, PageTitle, StatusBadge } from './ui.jsx';

export default function WorkshopsAdmin() {
  const { data, loading, error, reload } = useFetch(() => adminApi.get('/workshops').then((r) => r.data), []);
  const [deleting, setDeleting] = useState(null);

  return (
    <>
      <PageTitle title="Workshops">
        <Button to="/admin/workshops/new" size="small" icon={<Plus size={17} aria-hidden="true" />}>Add Workshop</Button>
      </PageTitle>
      {loading && !data && <Loading label="Loading workshops" />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {data?.length === 0 && <EmptyState title="No workshops yet. Add your first one." />}
      {data?.length > 0 && (
        <div className="admin-card table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th aria-label="Image" /><th>Workshop</th><th>Duration</th><th>Level</th><th>Price</th><th>Upcoming</th><th>Status</th><th aria-label="Actions" /></tr>
            </thead>
            <tbody>
              {data.map((w) => (
                <tr key={w.id}>
                  <td>{w.imageUrl && <img className="table-thumb" src={assetUrl(w.imageUrl)} alt="" />}</td>
                  <td><Link to={`/admin/workshops/${w.id}`} className="table-link">{w.title}</Link><br /><small className="muted">{w.category}</small></td>
                  <td className="nowrap">{w.duration}</td>
                  <td>{LEVEL_LABELS[w.skillLevel]}</td>
                  <td className="nowrap">{formatPrice(w.priceInr) || <span className="muted">Not set</span>}</td>
                  <td>{w.upcomingBatches.length} {w.upcomingBatches.length === 1 ? 'batch' : 'batches'}</td>
                  <td><StatusBadge value={w.active ? 'active' : 'inactive'} /></td>
                  <td className="row-actions">
                    <Link to={`/admin/workshops/${w.id}`} className="icon-btn" aria-label={`Edit ${w.title}`}><Pencil size={17} /></Link>
                    <button type="button" className="icon-btn danger" aria-label={`Delete ${w.title}`} onClick={() => setDeleting(w)}><Trash2 size={17} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {deleting && (
        <ConfirmDelete
          title="Delete workshop"
          message={`Delete "${deleting.title}" and all its batches? This cannot be undone.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await adminApi.delete(`/workshops/${deleting.id}`);
            reload();
          }}
        />
      )}
    </>
  );
}
