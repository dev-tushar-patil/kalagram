import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, CheckSquare, ChevronDown, Clock, IndianRupee, MapPin, Package, Backpack, Users } from 'lucide-react';
import { assetUrl, publicApi } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { formatPrice, formatRange, LEVEL_LABELS, seatsLabel } from '../utils/format.js';
import Button from '../components/Button.jsx';
import { PatternBorder, Reveal } from '../components/Decor.jsx';
import { EmptyState, ErrorState, Loading } from '../components/States.jsx';

function Faq({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq ${open ? 'is-open' : ''}`}>
      <h3>
        <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {faq.question}
          <ChevronDown size={20} aria-hidden="true" />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
            <p>{faq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BatchPicker({ workshop }) {
  const firstOpen = workshop.batches.find((b) => b.open);
  const [selected, setSelected] = useState(firstOpen?.id ?? null);
  const price = formatPrice(workshop.priceInr);

  useEffect(() => setSelected(workshop.batches.find((b) => b.open)?.id ?? null), [workshop]);

  return (
    <aside className="booking-card" aria-labelledby="booking-title" id="batches">
      <h2 id="booking-title">Upcoming Batches</h2>
      <p className="booking-price">
        <IndianRupee size={18} aria-hidden="true" />
        {price ? <>Starting at <strong>{price}</strong></> : <strong>Price on request</strong>}
      </p>
      {workshop.batches.length === 0 ? (
        <p className="booking-empty">No dates are open right now. Please contact us and we'll tell you when the next batch is announced.</p>
      ) : (
        <fieldset className="batch-options">
          <legend className="sr-only">Choose a batch</legend>
          {workshop.batches.map((b) => (
            <label key={b.id} className={`batch-option ${selected === b.id ? 'is-selected' : ''} ${b.open ? '' : 'is-disabled'}`}>
              <input type="radio" name="batch" value={b.id} disabled={!b.open} checked={selected === b.id} onChange={() => setSelected(b.id)} />
              <span className="batch-dates">{formatRange(b.startDate, b.endDate)}</span>
              {b.label && <span className="batch-label">{b.label}</span>}
              <span className="batch-seats"><Users size={14} aria-hidden="true" />{seatsLabel(b)} of {b.totalSeats}</span>
            </label>
          ))}
        </fieldset>
      )}
      {selected
        ? <Button to={`/register?workshop=${workshop.id}&batch=${selected}`} arrow className="btn-block">Register for this Batch</Button>
        : <Button to="/contact" variant="secondary" className="btn-block">Contact Us</Button>}
    </aside>
  );
}

function ListBlock({ icon: Icon, title, items }) {
  if (!items?.length) return null;
  return (
    <Reveal className="detail-block">
      <h2><Icon size={24} strokeWidth={1.5} aria-hidden="true" />{title}</h2>
      <ul className="dash-list">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </Reveal>
  );
}

export default function WorkshopDetails() {
  const { slug } = useParams();
  const { data: workshop, loading, error, reload } = useFetch(() => publicApi.workshop(slug), [slug]);
  usePageMeta(workshop?.title, workshop?.shortDescription);

  if (loading && !workshop) return <Loading label="Loading workshop" />;
  if (error?.response?.status === 404) {
    return (
      <div className="section">
        <EmptyState title="We couldn't find that workshop.">
          <Button to="/workshops" variant="secondary" size="small">See all workshops</Button>
        </EmptyState>
      </div>
    );
  }
  if (error) return <div className="section"><ErrorState error={error} onRetry={reload} /></div>;

  const banner = assetUrl(workshop.bannerUrl || workshop.imageUrl);

  return (
    <>
      <section className="detail-hero">
        <div className="detail-banner">
          {banner && <motion.img src={banner} alt="" initial={{ scale: 1.04 }} animate={{ scale: 1 }} transition={{ duration: 1.1, ease: 'easeOut' }} fetchpriority="high" />}
        </div>
        <motion.div className="detail-hero-text" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span aria-hidden="true">›</span>
            <Link to="/workshops">Workshops</Link><span aria-hidden="true">›</span>
            <span aria-current="page">{workshop.title}</span>
          </nav>
          <h1>{workshop.title}</h1>
          <span className="title-rule" aria-hidden="true" />
          <p className="lede">{workshop.shortDescription}</p>
          <ul className="fact-row">
            <li><Clock size={18} aria-hidden="true" /><span><small>Duration</small>{workshop.duration}</span></li>
            <li><BarChart3 size={18} aria-hidden="true" /><span><small>Skill level</small>{LEVEL_LABELS[workshop.skillLevel]}</span></li>
            {workshop.location && <li><MapPin size={18} aria-hidden="true" /><span><small>Location</small>{workshop.location}</span></li>}
          </ul>
        </motion.div>
      </section>

      <div className="section detail-layout">
        <div className="detail-main">
          <Reveal className="detail-block">
            <h2>Workshop Overview</h2>
            {workshop.overview.split(/\n\s*\n/).map((para) => <p key={para}>{para}</p>)}
          </Reveal>

          {workshop.learningOutcomes?.length > 0 && (
            <Reveal className="detail-block">
              <h2>What You Will Learn</h2>
              <ul className="check-list two-col">
                {workshop.learningOutcomes.map((item) => <li key={item}><CheckSquare size={21} strokeWidth={1.5} aria-hidden="true" />{item}</li>)}
              </ul>
            </Reveal>
          )}

          {workshop.curriculum?.length > 0 && (
            <Reveal className="detail-block">
              <h2>Course Curriculum</h2>
              <ol className="curriculum">
                {workshop.curriculum.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </Reveal>
          )}

          {workshop.schedule?.length > 0 && (
            <Reveal className="detail-block">
              <h2>Day-wise Schedule</h2>
              <ol className="timeline">
                {workshop.schedule.map((d) => (
                  <li key={d.day}>
                    <span className="timeline-day">{d.day}</span>
                    <div><strong>{d.title}</strong><p>{d.description}</p></div>
                  </li>
                ))}
              </ol>
            </Reveal>
          )}

          <div className="detail-columns">
            <ListBlock icon={Package} title="Materials Provided" items={workshop.materialsProvided} />
            <ListBlock icon={Backpack} title="What to Bring" items={workshop.whatToBring} />
          </div>

          {workshop.faqs?.length > 0 && (
            <Reveal className="detail-block">
              <h2>Frequently Asked Questions</h2>
              {workshop.faqs.map((faq) => <Faq key={faq.question} faq={faq} />)}
            </Reveal>
          )}
        </div>

        <BatchPicker workshop={workshop} />
      </div>

      <PatternBorder />
    </>
  );
}
