import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarCheck, CheckCircle2 } from 'lucide-react';
import { errorMessage, fieldErrors, IS_PREVIEW, publicApi } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { formatDate, formatRange, seatsLabel } from '../utils/format.js';
import { registrationMessage, whatsappLink } from '../utils/whatsapp.js';
import Button from './Button.jsx';
import Field from './Field.jsx';
import WhatsAppIcon from './WhatsAppIcon.jsx';
import { ErrorState, Loading } from './States.jsx';

const EMPTY = { fullName: '', email: '', mobile: '', workshopId: '', batchId: '', participants: '1', city: '', message: '' };
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE = /^\+?[0-9][0-9 ()-]{8,18}[0-9]$/;
const MAX_PARTICIPANTS = 20;

function validate(v, batch) {
  const e = {};
  if (!v.fullName.trim()) e.fullName = 'Full name is required';
  if (!v.email.trim()) e.email = 'Email is required';
  else if (!EMAIL.test(v.email.trim())) e.email = 'Enter a valid email address';
  if (!v.mobile.trim()) e.mobile = 'Mobile number is required';
  else if (!PHONE.test(v.mobile.trim())) e.mobile = 'Enter a valid mobile number';
  if (!v.workshopId) e.workshopId = 'Please select a workshop';
  if (!v.batchId) e.batchId = 'Please select a batch';
  const count = Number(v.participants);
  if (!count || count < 1) e.participants = 'At least 1 participant';
  else if (batch && count > batch.availableSeats) e.participants = `Only ${seatsLabel(batch)} in this batch`;
  return e;
}

function Confirmation({ registration, onAnother }) {
  const { whatsapp } = useSettings();
  const heading = useRef(null);
  useEffect(() => {
    heading.current?.focus();
    heading.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <div className="confirmation" role="status">
      <CheckCircle2 size={44} className="confirmation-icon" aria-hidden="true" />
      <h2 ref={heading} tabIndex={-1}>{IS_PREVIEW ? 'One more step' : 'Registration received!'}</h2>
      {IS_PREVIEW ? (
        <p>Thank you, {registration.fullName}. This is a preview of the website, so your registration has not been saved and no seat is held yet. Please send these details to Kalagram on WhatsApp to register.</p>
      ) : (
        <p>Thank you, {registration.fullName}. Your seat is held and your registration is pending confirmation. We'll get in touch with the details and next steps.</p>
      )}
      <dl className="confirmation-details">
        <div><dt>Registration ID</dt><dd className="registration-id">{registration.registrationId}</dd></div>
        <div><dt>Workshop</dt><dd>{registration.workshopTitle}</dd></div>
        <div><dt>Dates</dt><dd>{formatRange(registration.startDate, registration.endDate)}</dd></div>
        <div><dt>Participants</dt><dd>{registration.participants}</dd></div>
        <div><dt>Status</dt><dd>{IS_PREVIEW ? 'Not yet sent' : 'Pending'}</dd></div>
      </dl>
      <p className="confirmation-hint">{IS_PREVIEW ? 'WhatsApp' : 'To reach us faster, send these details to Kalagram on WhatsApp. It'} opens with the message ready; just press Send.</p>
      <div className="form-actions center">
        <Button href={whatsappLink(whatsapp, registrationMessage(registration))} className="btn-whatsapp" icon={<WhatsAppIcon size={20} />}>
          Send Registration on WhatsApp
        </Button>
        <Button variant="secondary" onClick={onAnother}>Register someone else</Button>
      </div>
    </div>
  );
}

/** The full registration flow, used on the Register page and on the Contact page. */
export default function RegistrationForm({ initialWorkshopId, initialBatchId }) {
  const { data: workshops, loading, error, reload } = useFetch(publicApi.workshops, []);
  const [values, setValues] = useState({
    ...EMPTY,
    workshopId: initialWorkshopId ? String(initialWorkshopId) : '',
    batchId: initialBatchId ? String(initialBatchId) : '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState(null);

  const workshop = useMemo(
    () => workshops?.find((w) => String(w.id) === values.workshopId),
    [workshops, values.workshopId],
  );
  const batches = workshop?.upcomingBatches || [];
  const batch = batches.find((b) => String(b.id) === values.batchId);
  const maxParticipants = Math.min(MAX_PARTICIPANTS, batch?.availableSeats || MAX_PARTICIPANTS);

  // A link can name a workshop without a batch, or a batch that has since filled: pick the next open one.
  useEffect(() => {
    if (!workshop) return;
    if (!batch?.open) {
      const next = batches.find((b) => b.open);
      setValues((v) => ({ ...v, batchId: next ? String(next.id) : '' }));
    }
  }, [workshop, batch, batches]);

  useEffect(() => {
    if (Number(values.participants) > maxParticipants) {
      setValues((v) => ({ ...v, participants: String(maxParticipants) }));
    }
  }, [maxParticipants, values.participants]);

  const change = (name) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [name]: value, ...(name === 'workshopId' ? { batchId: '' } : {}) }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  async function submit(e) {
    e.preventDefault();
    setFormError('');
    const problems = validate(values, batch);
    setErrors(problems);
    if (Object.keys(problems).length) {
      setFormError('Please correct the highlighted fields.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await publicApi.register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        mobile: values.mobile.trim(),
        workshopId: Number(values.workshopId),
        batchId: Number(values.batchId),
        participants: Number(values.participants),
        city: values.city.trim() || null,
        message: values.message.trim() || null,
      });
      setRegistration(result);
      reload();
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err));
      // Someone else may have just taken the seats: show the current numbers.
      if (err.response?.status === 409) reload();
    } finally {
      setSubmitting(false);
    }
  }

  function startAnother() {
    setRegistration(null);
    setFormError('');
    setErrors({});
    setValues((v) => ({ ...EMPTY, workshopId: v.workshopId, batchId: v.batchId }));
  }

  if (registration) return <Confirmation registration={registration} onAnother={startAnother} />;
  if (loading && !workshops) return <Loading label="Loading workshops" />;
  if (error && !workshops) return <ErrorState error={error} onRetry={reload} />;

  return (
    <form className="kg-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <Field label="Full Name" required value={values.fullName} onChange={change('fullName')} error={errors.fullName} autoComplete="name" maxLength={120} />
        <Field label="Email Address" required type="email" value={values.email} onChange={change('email')} error={errors.email} autoComplete="email" maxLength={160} />
        <Field label="Mobile Number" required type="tel" value={values.mobile} onChange={change('mobile')} error={errors.mobile} autoComplete="tel" inputMode="tel" maxLength={20} placeholder="+91" />
        <Field label="Select Workshop" required as="select" value={values.workshopId} onChange={change('workshopId')} error={errors.workshopId}>
          <option value="">Choose a workshop</option>
          {workshops?.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
        </Field>
        <Field
          label="Select Batch / Preferred Date"
          required
          as="select"
          value={values.batchId}
          onChange={change('batchId')}
          error={errors.batchId}
          disabled={!workshop || batches.length === 0}
          hint={workshop && batches.length === 0 ? 'No dates are open right now. Please contact us to hear about the next batch.' : undefined}
        >
          <option value="">{workshop ? (batches.length ? 'Choose a batch' : 'No upcoming dates') : 'Choose a workshop first'}</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id} disabled={!b.open}>
              {formatDate(b.startDate)} to {formatDate(b.endDate)} ({seatsLabel(b)})
            </option>
          ))}
        </Field>
        <Field label="Number of Participants" required as="select" value={values.participants} onChange={change('participants')} error={errors.participants}>
          {Array.from({ length: maxParticipants }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
        </Field>
        <Field label="City" value={values.city} onChange={change('city')} error={errors.city} autoComplete="address-level2" maxLength={100} />
        <Field label="Message / Additional Information" as="textarea" rows={4} className="span-2" value={values.message} onChange={change('message')} error={errors.message} maxLength={2000} />
      </div>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <div className="form-actions">
        <Button type="submit" loading={submitting} icon={<CalendarCheck size={20} aria-hidden="true" />}>
          {submitting ? 'Registering' : 'Register for Workshop'}
        </Button>
        <p className="form-note">{IS_PREVIEW ? 'Preview website: your details go to Kalagram by WhatsApp and are not stored here.' : "We'll get in touch with the details and next steps."}</p>
      </div>
    </form>
  );
}
