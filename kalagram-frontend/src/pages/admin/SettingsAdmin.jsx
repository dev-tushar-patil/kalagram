import { useEffect, useState } from 'react';
import { adminApi, errorMessage, publicApi } from '../../services/api.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import Button from '../../components/Button.jsx';
import Field from '../../components/Field.jsx';
import { ErrorState, Loading } from '../../components/States.jsx';
import { Notice, PageTitle } from './ui.jsx';

const GROUPS = [
  {
    title: 'Contact details',
    fields: [
      { key: 'phone', label: 'Phone number' },
      { key: 'whatsapp', label: 'WhatsApp number', hint: 'Digits only, with country code: 919011059088' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'address', label: 'Address shown on the site' },
      { key: 'mapsQuery', label: 'Google Maps location', hint: 'A place name or "latitude,longitude". Used for the map and directions.', span: true },
    ],
  },
  {
    title: 'Social media links',
    fields: [
      { key: 'instagramUrl', label: 'Instagram', type: 'url' },
      { key: 'facebookUrl', label: 'Facebook', type: 'url' },
      { key: 'youtubeUrl', label: 'YouTube', type: 'url' },
    ],
  },
  {
    title: 'Homepage content',
    fields: [
      { key: 'heroTitle', label: 'Hero heading', span: true },
      { key: 'heroSubtitle', label: 'Hero subtitle', area: 2, span: true },
      { key: 'aboutPreview', label: 'About Kalagram preview', area: 4, span: true },
      { key: 'ctaTitle', label: 'Bottom band heading', span: true },
      { key: 'ctaText', label: 'Bottom band text', area: 2, span: true },
    ],
  },
  {
    title: 'Gallery page numbers',
    fields: [1, 2, 3, 4].flatMap((n) => [
      { key: `stat${n}Value`, label: `Number ${n}` },
      { key: `stat${n}Label`, label: `Label ${n}` },
    ]),
  },
];

export default function SettingsAdmin() {
  const { data, loading, error, reload } = useFetch(publicApi.settings, []);
  const { updateLocal } = useSettings();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setSaveError('');
    setSaved('');
    try {
      const { data: updated } = await adminApi.put('/settings', form);
      setForm(updated);
      updateLocal(updated);
      setSaved('Settings saved. The website now shows these details.');
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading && !form) return <Loading label="Loading settings" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!form) return null;

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setSaved('');
  };

  return (
    <>
      <PageTitle title="Website Settings" />
      <form onSubmit={save} noValidate className="admin-stack">
        {GROUPS.map((group) => (
          <section className="admin-card" key={group.title}>
            <h2>{group.title}</h2>
            <div className="form-grid">
              {group.fields.map(({ key, label, hint, type, area, span }) => (
                <Field
                  key={key}
                  label={label}
                  hint={hint}
                  type={area ? undefined : type || 'text'}
                  as={area ? 'textarea' : 'input'}
                  rows={area}
                  className={span ? 'span-2' : ''}
                  value={form[key] ?? ''}
                  onChange={set(key)}
                />
              ))}
            </div>
          </section>
        ))}
        <Notice>{saveError}</Notice>
        <Notice kind="success">{saved}</Notice>
        <div className="admin-save-row"><Button type="submit" loading={busy}>Save Settings</Button></div>
      </form>
    </>
  );
}
