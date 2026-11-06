import { motion, useScroll, useTransform } from 'framer-motion';
import { Boxes, Flame, Home as HomeIcon, Leaf, Users, Waves, Wind } from 'lucide-react';
import { useSettings } from '../context/SettingsContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { publicApi } from '../services/api.js';
import Button from '../components/Button.jsx';
import WorkshopCard from '../components/WorkshopCard.jsx';
import { Birds, FloatingLeaves, Reveal, SectionHeading, WaveTop } from '../components/Decor.jsx';
import { EmptyState, ErrorState, Loading } from '../components/States.jsx';

const ELEMENTS = [
  { name: 'Earth', note: 'Soil', Icon: Boxes },
  { name: 'Water', note: '', Icon: Waves },
  { name: 'Fire', note: 'Energy', Icon: Flame },
  { name: 'Air', note: 'Ventilation', Icon: Wind },
  { name: 'Nature', note: 'Green Living', Icon: Leaf },
  { name: 'Space', note: 'Design', Icon: HomeIcon },
  { name: 'People', note: 'Community', Icon: Users },
];

function Hero() {
  const s = useSettings();
  const { scrollY } = useScroll();
  const artY = useTransform(scrollY, [0, 600], [0, 26]);

  return (
    <section className="home-hero">
      <motion.img
        className="home-hero-art"
        src="/images/home/hero.webp"
        alt="Workers raising the earthen walls of a traditional Indian mud house, beside a finished terracotta-roofed home"
        style={{ y: artY }}
        fetchpriority="high"
        width="2398"
        height="1034"
      />
      <Birds className="home-birds" />
      <FloatingLeaves />
      <motion.div
        className="home-hero-text"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <h1>{s.heroTitle}</h1>
        <span className="title-rule" aria-hidden="true" />
        <p className="lede">{s.heroSubtitle}</p>
        <div className="hero-actions">
          <Button to="/register" arrow>Join a Workshop</Button>
          <Button to="/workshops" variant="secondary">Explore Our Workshops</Button>
        </div>
      </motion.div>
    </section>
  );
}

function SevenElements() {
  return (
    <section className="section elements-section" aria-labelledby="elements-title">
      <SectionHeading id="elements-title" subtitle="An immersive learning experience around natural building, materials and sustainable living.">
        Seven Elements. One Tradition.
      </SectionHeading>
      <ul className="elements-row">
        {ELEMENTS.map(({ name, note, Icon }, i) => (
          <Reveal as="li" key={name} delay={i * 0.05} className="element">
            <motion.div className="element-inner" whileHover="hover" initial="rest" animate="rest">
              <motion.span
                className="element-icon"
                variants={{ rest: { scale: 1, y: 0, rotate: 0 }, hover: { scale: 1.12, y: -5, rotate: -3 } }}
                transition={{ type: 'spring', stiffness: 300, damping: 16 }}
              >
                <Icon size={46} strokeWidth={1.25} aria-hidden="true" />
              </motion.span>
              <strong>{name}</strong>
              {note && <span className="element-note">({note})</span>}
            </motion.div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function AboutPreview() {
  const { aboutPreview } = useSettings();
  return (
    <section className="section split">
      <Reveal className="split-art">
        <img src="/images/home/gazebo.webp" alt="A thatched pavilion among trees, with a clay pot and earthen benches" loading="lazy" />
      </Reveal>
      <Reveal className="split-text ruled" delay={0.1}>
        <h2>About Kalagram</h2>
        <p>{aboutPreview}</p>
        <Button to="/about" variant="text" arrow>Know More About Us</Button>
      </Reveal>
    </section>
  );
}

function UpcomingWorkshops() {
  const { data: workshops, loading, error, reload } = useFetch(publicApi.workshops, []);
  return (
    <section className="section" aria-labelledby="upcoming-title">
      <SectionHeading id="upcoming-title" sprigs>Upcoming Workshops</SectionHeading>
      {loading && !workshops && <Loading label="Finding upcoming workshops" />}
      {error && <ErrorState error={error} onRetry={reload} message="We couldn't load the workshops just now." />}
      {workshops?.length === 0 && (
        <EmptyState title="New workshops are being planned.">
          <Button to="/contact" variant="secondary" size="small">Ask us about the next batch</Button>
        </EmptyState>
      )}
      {workshops?.length > 0 && (
        <div className="workshop-grid">
          {workshops.map((w, i) => (
            <Reveal key={w.id} delay={i * 0.07} className="grid-cell"><WorkshopCard workshop={w} /></Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

function BottomCta() {
  const { ctaTitle, ctaText } = useSettings();
  return (
    <section className="earth-band" aria-labelledby="cta-title">
      <WaveTop />
      <div className="earth-band-body">
        <img className="band-plant" src="/images/home/band-plant-left.webp" alt="" loading="lazy" />
        <img className="band-figure" src="/images/home/band-builders.webp" alt="" loading="lazy" />
        <div className="band-text ruled-light">
          <h2 id="cta-title">{ctaTitle}</h2>
          <p>{ctaText}</p>
        </div>
        <Button to="/workshops" variant="light" arrow>Explore Workshops</Button>
        <img className="band-plant band-plant-end" src="/images/home/band-plant-right.webp" alt="" loading="lazy" />
      </div>
    </section>
  );
}

export default function Home() {
  usePageMeta('Mud House Building Workshops', 'Learn the traditional art of building healthy, beautiful and sustainable homes with earth. Hands-on natural building workshops by Kalagram, Pune.');
  return (
    <>
      <Hero />
      <SevenElements />
      <AboutPreview />
      <UpcomingWorkshops />
      <BottomCta />
    </>
  );
}
