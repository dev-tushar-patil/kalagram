import { useState } from 'react';
import { CheckCircle2, ExternalLink, Home as HomeIcon, Leaf, Mail, MapPin, Phone, Send, Sprout, Users } from 'lucide-react';
import { errorMessage, fieldErrors, IS_PREVIEW, publicApi } from '../services/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { enquiryMessage, FLOATING_MESSAGE, whatsappLink } from '../utils/whatsapp.js';
import PageHero from '../components/PageHero.jsx';
import Button from '../components/Button.jsx';
import Field from '../components/Field.jsx';
import RegistrationForm from '../components/RegistrationForm.jsx';
import WhatsAppIcon from '../components/WhatsAppIcon.jsx';
import { PatternBorder, Reveal } from '../components/Decor.jsx';

const ENQUIRY_TYPES = ['Workshop Information', 'Group or Institution Booking', 'Collaboration', 'Building Consultation', 'Something Else'];
const EMPTY = { name: '', email: '', phone: '', enquiryFor: '', message: '' };
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE = /^\+?[0-9][0-9 ()-]{8,18}[0-9]$/;

function validate(v) {
  const e = {};
  if (!v.name.trim()) e.name = 'Name is required';
  if (!v.email.trim()) e.email = 'Email is required';
  else if (!EMAIL.test(v.email.trim())) e.email = 'Enter a valid email address';
  if (!v.phone.trim()) e.phone = 'Phone is required';
  else if (!PHONE.test(v.phone.trim())) e.phone = 'Enter a valid phone number';
  if (!v.enquiryFor) e.enquiryFor = 'Please choose what your enquiry is for';
  if (!v.message.trim()) e.message = 'Message is required';
  return e;
}

function EnquiryForm() {
  const { whatsapp } = useSettings();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentLink, setSentLink] = useState(null);

  const change = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  async function submit(e) {
    e.preventDefault();
    setFormError('');
    const problems = validate(values);
    setErrors(problems);
    if (Object.keys(problems).length) return;
    setSubmitting(true);
    try {
      const body = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]));
      await publicApi.enquire(body);
      const link = whatsappLink(whatsapp, enquiryMessage(body));
      setSentLink(link);
      setValues(EMPTY);
      // Browsers may block this; the confirmation below offers the same link as a button.
      window.open(link, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (sentLink) {
    return (
      <div className="confirmation small" role="status">
        <CheckCircle2 size={36} className="confirmation-icon" aria-hidden="true" />
        <h3>{IS_PREVIEW ? 'Your message is ready to send.' : 'Thank you, we have your message.'}</h3>
        <p>
          {IS_PREVIEW && 'This is a preview of the website, so your message has not been saved. '}
          WhatsApp should have opened with your enquiry ready; just press Send. If it didn't, use the button below.
        </p>
        <div className="form-actions center">
          <Button href={sentLink} className="btn-whatsapp" icon={<WhatsAppIcon size={18} />}>Open WhatsApp</Button>
          <Button variant="secondary" onClick={() => setSentLink(null)}>Send another message</Button>
        </div>
      </div>
    );
  }

  return (
    <form className="kg-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <Field label="Your Name" required value={values.name} onChange={change('name')} error={errors.name} autoComplete="name" maxLength={120} />
        <Field label="Your Email" required type="email" value={values.email} onChange={change('email')} error={errors.email} autoComplete="email" maxLength={160} />
        <Field label="Your Phone" required type="tel" className="span-2" value={values.phone} onChange={change('phone')} error={errors.phone} autoComplete="tel" maxLength={20} />
        <Field label="Enquiry For" required as="select" className="span-2" value={values.enquiryFor} onChange={change('enquiryFor')} error={errors.enquiryFor}>
          <option value="">Choose one</option>
          {ENQUIRY_TYPES.map((t) => <option key={t}>{t}</option>)}
        </Field>
        <Field label="Your Message" required as="textarea" rows={4} className="span-2" value={values.message} onChange={change('message')} error={errors.message} maxLength={2000} />
      </div>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <div className="form-actions">
        <Button type="submit" loading={submitting} icon={<Send size={18} aria-hidden="true" />}>{submitting ? 'Sending' : 'Send Message'}</Button>
      </div>
    </form>
  );
}

export default function Contact() {
  usePageMeta('Contact Us', "We'd love to hear from you. Ask a question, join a workshop or collaborate with Kalagram in Pune, Maharashtra.");
  const s = useSettings();
  const query = encodeURIComponent(s.mapsQuery);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${query}`;

  const channels = [
    { Icon: Phone, title: 'Call Us', content: <a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a> },
    { Icon: Mail, title: 'Email Us', content: <a href={`mailto:${s.email}`}>{s.email}</a> },
    {
      Icon: WhatsAppIcon,
      title: 'WhatsApp',
      content: <a href={whatsappLink(s.whatsapp, FLOATING_MESSAGE)} target="_blank" rel="noopener noreferrer">+{s.whatsapp.slice(0, 2)} {s.whatsapp.slice(2)}</a>,
    },
    { Icon: MapPin, title: 'Visit Us', content: <span>{s.address}</span> },
  ];

  return (
    <>
      <PageHero
        title="Contact Us"
        subtitle="We'd love to hear from you. Whether you have a question, want to join a workshop or wish to collaborate, get in touch with us."
        art="/images/contact/hero.webp"
        artAlt="A small terracotta mud house with a tiled roof and clay pots beneath the trees"
        crumb={{ label: 'Contact Us' }}
      />

      <section className="section contact-grid" aria-label="Contact details and enquiry form">
        <img className="contact-leaf" src="/images/decor/leaf-tall.webp" alt="" loading="lazy" />
        <Reveal as="ul" className="channel-list">
          {channels.map(({ Icon, title, content }) => (
            <li key={title}>
              <span className="blot-icon"><Icon size={26} strokeWidth={1.5} aria-hidden="true" /></span>
              <div><strong>{title}</strong>{content}</div>
            </li>
          ))}
        </Reveal>
        <Reveal className="contact-form-col" delay={0.08}>
          <h2>Send Us a Message</h2>
          <EnquiryForm />
        </Reveal>
        <Reveal className="contact-visit" delay={0.16}>
          <img src="/images/contact/signpost.webp" alt="A wooden signpost reading Visit Kalagram" loading="lazy" />
          <Button href={directions} variant="soft" icon={<MapPin size={18} aria-hidden="true" />}>
            Get Directions on Maps <ExternalLink size={15} aria-hidden="true" />
          </Button>
        </Reveal>
      </section>

      <section className="section map-section" aria-label="Location map">
        <div className="map-frame">
          <iframe
            title="Map showing Kalagram's location"
            src={`https://www.google.com/maps?q=${query}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      <PatternBorder />

      <section className="section register-split" id="register" aria-labelledby="register-title">
        <Reveal className="register-art">
          <img src="/images/contact/teaching.webp" alt="A teacher explaining a house drawing to learners under a thatched roof" loading="lazy" />
        </Reveal>
        <Reveal className="register-col" delay={0.08}>
          <h2 id="register-title">Workshop Registration</h2>
          <p className="lede">Join our hands-on workshops and learn the art of natural building, from the earth and for the earth.</p>
          <RegistrationForm />
        </Reveal>
      </section>

      <section className="section promises" aria-label="What to expect">
        <ul>
          <li><Sprout size={34} strokeWidth={1.3} aria-hidden="true" />Hands-on Learning</li>
          <li><Users size={34} strokeWidth={1.3} aria-hidden="true" />Small Batches</li>
          <li><Leaf size={34} strokeWidth={1.3} aria-hidden="true" />Natural Materials</li>
          <li><HomeIcon size={34} strokeWidth={1.3} aria-hidden="true" />Real Project Experience</li>
        </ul>
      </section>

      <div className="hills" aria-hidden="true" />
    </>
  );
}
