import { Link } from 'react-router-dom';
import { CalendarRange, MessageSquare, UserCheck, Users } from 'lucide-react';
import { adminApi } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { ErrorState, Loading } from '../../components/States.jsx';
import { formatDate, formatDateTime } from '../../utils/format.js';
import { PageTitle, StatusBadge } from './ui.jsx';

export default function Dashboard() {
  const { data, loading, error, reload } = useFetch(() => adminApi.get('/dashboard').then((r) => r.data), []);

  if (loading && !data) return <Loading label="Loading dashboard" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const tiles = [
    { label: 'Total Registrations', value: data.totalRegistrations, note: `${data.registrationsLast30Days} in the last 30 days`, Icon: Users, to: '/admin/registrations' },
    { label: 'Upcoming Workshops', value: data.upcomingWorkshops, note: 'Batches open or scheduled', Icon: CalendarRange, to: '/admin/workshops' },
    { label: 'Total Enquiries', value: data.totalEnquiries, note: `${data.newEnquiries} new`, Icon: MessageSquare, to: '/admin/enquiries' },
    { label: 'Total Participants', value: data.totalParticipants, note: 'Excluding cancelled', Icon: UserCheck, to: '/admin/registrations' },
  ];

  return (
    <>
      <PageTitle title="Dashboard" />
      <div className="stat-tiles">
        {tiles.map(({ label, value, note, Icon, to }) => (
          <Link key={label} to={to} className="stat-tile">
            <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
            <strong>{value}</strong>
            <span>{label}</span>
            <small>{note}</small>
          </Link>
        ))}
      </div>

      <section className="admin-card">
        <h2>Recent Registrations</h2>
        {data.recentRegistrations.length === 0 ? (
          <p className="muted">No registrations yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Workshop</th><th>Batch</th><th>People</th><th>Status</th><th>Received</th></tr>
              </thead>
              <tbody>
                {data.recentRegistrations.map((r) => (
                  <tr key={r.id}>
                    <td className="nowrap">{r.registrationId}</td>
                    <td>{r.fullName}</td>
                    <td>{r.workshopTitle}</td>
                    <td className="nowrap">{formatDate(r.startDate)}</td>
                    <td>{r.participants}</td>
                    <td><StatusBadge value={r.status} /></td>
                    <td className="nowrap">{formatDateTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
