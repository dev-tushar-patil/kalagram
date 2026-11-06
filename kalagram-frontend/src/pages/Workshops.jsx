import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, Leaf, Sprout, SquareCheck, Users } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { publicApi } from '../services/api.js';
import { formatRange, seatsLabel } from '../utils/format.js';
import PageHero from '../components/PageHero.jsx';
import WorkshopCard from '../components/WorkshopCard.jsx';
import Button from '../components/Button.jsx';
import { PatternBorder, Reveal, SectionHeading } from '../components/Decor.jsx';
import { EmptyState, ErrorState, Loading } from '../components/States.jsx';

const FEATURES = [
  { Icon: CalendarDays, label: 'Hands-on Training' },
  { Icon: Leaf, label: 'Natural Materials' },
  { Icon: Users, label: 'Small Batches' },
  { Icon: Sprout, label: 'Sustainable Living' },
];

const TAKEAWAYS = [
  'Practical, hands-on construction experience',
  'Knowledge of natural and local building materials',
  'Design, climate and sustainability principles',
  'Confidence to build and maintain earthen structures',
];

function UpcomingDates({ workshops }) {
  const rows = workshops
    .flatMap((w) => (w.upcomingBatches || []).map((b) => ({ ...b, workshop: w })))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  if (rows.length === 0) {
    return (
      <EmptyState title="New dates are being planned.">
        <Button to="/contact" variant="secondary" size="small">Ask us about the next batch</Button>
      </EmptyState>
    );
  }
  return (
    <ul className="dates-list">
      {rows.map((b) => (
        <li key={b.id} className={b.open ? '' : 'is-full'}>
          <span className="dates-when"><CalendarDays size={18} aria-hidden="true" />{formatRange(b.startDate, b.endDate)}</span>
          <Link className="dates-what" to={`/workshops/${b.workshop.slug}`}>{b.workshop.title}</Link>
          <span className="dates-seats">{seatsLabel(b)}</span>
          {b.open
            ? <Button to={`/register?workshop=${b.workshop.id}&batch=${b.id}`} size="small">Book Seat</Button>
            : <span className="dates-closed">Sold out</span>}
        </li>
      ))}
    </ul>
  );
}

export default function Workshops() {
  usePageMeta('Our Workshops', 'Immersive, hands-on learning in natural and mud house construction: building, materials and mix design, earthen plaster and sustainable living spaces.');
  const { data: workshops, loading, error, reload } = useFetch(publicApi.workshops, []);
  const [category, setCategory] = useState('All');

  const categories = useMemo(() => ['All', ...new Set((workshops || []).map((w) => w.category))], [workshops]);
  const visible = (workshops || []).filter((w) => category === 'All' || w.category === category);

  return (
    <>
      <PageHero
        wave
        title="Our Workshops"
        subtitle="Immersive, hands-on learning experiences in natural and mud house construction."
        art="/images/workshops/hero.webp"
        artAlt="Learners gather around a teacher shaping earth blocks outside a thatched mud house"
      >
        <ul className="feature-row">
          {FEATURES.map(({ Icon, label }) => (
            <li key={label}>
              <motion.span whileHover={{ scale: 1.12, rotate: -4 }} className="feature-icon"><Icon size={32} strokeWidth={1.3} aria-hidden="true" /></motion.span>
              {label}
            </li>
          ))}
        </ul>
      </PageHero>

      <section className="section" aria-labelledby="programs-title" id="programs">
        <SectionHeading id="programs-title" sprigs>Workshop Programs</SectionHeading>

        {categories.length > 2 && (
          <div className="pill-row" role="group" aria-label="Filter workshops by category">
            {categories.map((c) => (
              <button key={c} type="button" className={`pill ${c === category ? 'is-active' : ''}`} aria-pressed={c === category} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
        )}

        {loading && !workshops && <Loading label="Loading workshops" />}
        {error && <ErrorState error={error} onRetry={reload} message="We couldn't load the workshops just now." />}
        {workshops?.length === 0 && (
          <EmptyState title="New workshops are being planned.">
            <Button to="/contact" variant="secondary" size="small">Ask us about the next batch</Button>
          </EmptyState>
        )}
        {visible.length > 0 && (
          <div className="workshop-grid">
            {visible.map((w, i) => (
              <Reveal key={w.id} delay={i * 0.07} className="grid-cell"><WorkshopCard workshop={w} /></Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="section takeaway" aria-labelledby="takeaway-title">
        <Reveal className="takeaway-art">
          <img src="/images/workshops/takeaway.webp" alt="A finished mud house with white motifs, set among trees and plants" loading="lazy" />
        </Reveal>
        <Reveal className="takeaway-text ruled" delay={0.08}>
          <h2 id="takeaway-title">What You'll Take Away</h2>
          <ul className="check-list">
            {TAKEAWAYS.map((t) => <li key={t}><SquareCheck size={22} strokeWidth={1.5} aria-hidden="true" />{t}</li>)}
          </ul>
        </Reveal>
        <Reveal className="earth-blob" delay={0.16}>
          <CalendarDays size={30} strokeWidth={1.4} aria-hidden="true" />
          <h2>Upcoming Workshops</h2>
          <p>Check schedules and book your seat.</p>
          <a className="btn btn-light btn-small" href="#dates"><span>View Dates</span></a>
        </Reveal>
      </section>

      {workshops && (
        <section className="section" id="dates" aria-labelledby="dates-title">
          <SectionHeading id="dates-title">Upcoming Dates</SectionHeading>
          <UpcomingDates workshops={workshops} />
        </section>
      )}

      <PatternBorder />
    </>
  );
}
