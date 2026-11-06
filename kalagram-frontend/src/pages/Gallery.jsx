import { useState } from 'react';
import { motion } from 'framer-motion';
import { Armchair, Camera, Home as HomeIcon, Leaf, LayoutGrid, Mountain, Users } from 'lucide-react';
import { assetUrl, publicApi } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { useSettings } from '../context/SettingsContext.jsx';
import PageHero from '../components/PageHero.jsx';
import Lightbox from '../components/Lightbox.jsx';
import { PatternBorder, Reveal } from '../components/Decor.jsx';
import { EmptyState, ErrorState, Loading } from '../components/States.jsx';

const CATEGORIES = [
  { key: 'ALL', label: 'All', Icon: LayoutGrid },
  { key: 'MUD_HOUSES', label: 'Mud Houses', Icon: HomeIcon },
  { key: 'WORKSHOPS', label: 'Workshops', Icon: Users },
  { key: 'MATERIALS', label: 'Materials', Icon: Leaf },
  { key: 'SPACES_INTERIORS', label: 'Spaces & Interiors', Icon: Armchair },
  { key: 'CAMPUS_NATURE', label: 'Campus & Nature', Icon: Mountain },
];

/** A tile whose width follows its picture's proportions, giving the rows of the designs. */
function Tile({ image, onOpen }) {
  const [aspect, setAspect] = useState(1.5);
  return (
    <motion.button
      layout
      type="button"
      className="gallery-tile"
      style={{ flexGrow: aspect, flexBasis: `calc(var(--tile-height) * ${aspect})` }}
      onClick={onOpen}
      aria-label={`Open image: ${image.title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <img
        src={assetUrl(image.imageUrl)}
        alt={image.altText || image.title}
        loading="lazy"
        onLoad={(e) => e.target.naturalHeight && setAspect(e.target.naturalWidth / e.target.naturalHeight)}
      />
    </motion.button>
  );
}

export default function Gallery() {
  usePageMeta('Our Gallery', 'A visual journey through mud houses, workshops, people, materials and the living spaces at Kalagram.');
  const { data: images, loading, error, reload } = useFetch(publicApi.gallery, []);
  const [category, setCategory] = useState('ALL');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const s = useSettings();

  const visible = (images || []).filter((i) => category === 'ALL' || i.category === category);
  const stats = [
    { Icon: HomeIcon, value: s.stat1Value, label: s.stat1Label },
    { Icon: Users, value: s.stat2Value, label: s.stat2Label },
    { Icon: Camera, value: s.stat3Value, label: s.stat3Label },
    { Icon: Leaf, value: s.stat4Value, label: s.stat4Label },
  ];

  return (
    <>
      <PageHero
        wave
        title="Our Gallery"
        subtitle="A visual journey through our mud houses, workshops, people, materials and the living spaces at Kalagram."
        art="/images/gallery/hero.webp"
        artAlt="A long terracotta mud house with a veranda, clay pots and shade trees"
        crumb={{ label: 'Gallery' }}
      />

      <section className="section gallery-section" aria-label="Photographs">
        <img className="sprig sprig-left" src="/images/decor/sprig-left.webp" alt="" />
        <img className="sprig sprig-right" src="/images/decor/sprig-right.webp" alt="" />
        <div className="pill-row" role="group" aria-label="Filter gallery by category">
          {CATEGORIES.map(({ key, label, Icon }) => (
            <button key={key} type="button" className={`pill ${key === category ? 'is-active' : ''}`} aria-pressed={key === category} onClick={() => setCategory(key)}>
              <Icon size={17} strokeWidth={1.6} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {loading && !images && <Loading label="Loading the gallery" />}
        {error && <ErrorState error={error} onRetry={reload} message="We couldn't load the gallery just now." />}
        {images && visible.length === 0 && <EmptyState title="New pictures for this category are on the way." />}
        {visible.length > 0 && (
          <div className="gallery-grid">
            {visible.map((image, i) => <Tile key={image.id} image={image} onOpen={() => setLightboxIndex(i)} />)}
          </div>
        )}
      </section>

      <section className="section gallery-stats" aria-label="Kalagram in numbers">
        <img className="stats-art" src="/images/gallery/hut-strip.webp" alt="" loading="lazy" />
        <ul>
          {stats.map(({ Icon, value, label }, i) => (
            <Reveal as="li" key={label} delay={i * 0.06}>
              <Icon size={30} strokeWidth={1.4} aria-hidden="true" />
              <strong>{value}</strong>
              <span>{label}</span>
            </Reveal>
          ))}
        </ul>
        <img className="stats-tree" src="/images/gallery/tree.webp" alt="" loading="lazy" />
      </section>

      <PatternBorder />

      {lightboxIndex !== null && visible[lightboxIndex] && (
        <Lightbox images={visible} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
      )}
    </>
  );
}
