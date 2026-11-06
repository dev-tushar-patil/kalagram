import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Clock, Download, FileText, Infinity as InfinityIcon, Leaf, PlayCircle, Users } from 'lucide-react';
import { assetUrl, publicApi } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import PageHero from '../components/PageHero.jsx';
import Button from '../components/Button.jsx';
import { Reveal, SectionHeading, WaveTop } from '../components/Decor.jsx';
import { EmptyState, ErrorState, Loading } from '../components/States.jsx';

const ICONS = { book: BookOpen, video: PlayCircle, download: Download, article: FileText };
const TYPE_LABELS = { ARTICLE: 'Article', GUIDE: 'Guide', VIDEO: 'Video', DOWNLOAD: 'Download' };

function ResourceCard({ resource }) {
  const url = `/resources/${resource.slug}`;
  const isDownload = resource.type === 'DOWNLOAD' && resource.fileUrl;
  return (
    <motion.article className="resource-card" whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
      <Link to={url} className="resource-thumb" tabIndex={-1} aria-hidden="true">
        {resource.thumbnailUrl ? <img src={assetUrl(resource.thumbnailUrl)} alt="" loading="lazy" /> : <span className="thumb-blank"><Leaf size={36} /></span>}
        <span className="resource-tag">{TYPE_LABELS[resource.type]}</span>
      </Link>
      <div className="resource-body">
        <p className="resource-category">{resource.categoryName}</p>
        <h3><Link to={url}>{resource.title}</Link></h3>
        <p className="resource-desc">{resource.shortDescription}</p>
        <div className="resource-foot">
          {resource.readingMinutes
            ? <span><Clock size={15} aria-hidden="true" />{resource.readingMinutes} min read</span>
            : <span />}
          {isDownload
            ? <a className="link-arrow" href={assetUrl(resource.fileUrl)} download>Download <Download size={15} aria-hidden="true" /></a>
            : <Link className="link-arrow" to={url} aria-label={`Read more: ${resource.title}`}>{resource.type === 'VIDEO' ? 'Watch' : 'Read More'} <ArrowRight size={15} aria-hidden="true" /></Link>}
        </div>
      </div>
    </motion.article>
  );
}

export default function Resources() {
  usePageMeta('Resources', 'A curated library of knowledge, guides and learning material on natural building, mud houses and sustainable living.');
  const [params, setParams] = useSearchParams();
  const activeId = params.get('category');
  const categories = useFetch(publicApi.resourceCategories, []);
  const resources = useFetch(publicApi.resources, []);

  const list = resources.data || [];
  const active = useMemo(() => categories.data?.find((c) => String(c.id) === activeId), [categories.data, activeId]);
  const filtered = active ? list.filter((r) => r.categoryId === active.id) : list.filter((r) => !r.featured);
  const featured = list.filter((r) => r.featured);

  const pick = (id) => {
    setParams(String(id) === activeId ? {} : { category: id }, { replace: true, preventScrollReset: true });
    requestAnimationFrame(() => document.getElementById('library')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <>
      <PageHero
        title="Resources"
        subtitle="A curated library of knowledge, guides and learning material on natural building, mud houses and sustainable living."
        art="/images/resources/hero.webp"
        artAlt="A stack of books on natural building beside an open sketchbook, a clay pot and an earth block"
        crumb={{ label: 'Resources' }}
      />

      <section className="section category-cards" aria-label="Resource categories">
        {categories.data?.map((c, i) => {
          const Icon = ICONS[c.icon] || FileText;
          return (
            <Reveal key={c.id} delay={i * 0.06} className="grid-cell">
              <motion.button
                type="button"
                className={`category-card ${String(c.id) === activeId ? 'is-active' : ''}`}
                aria-pressed={String(c.id) === activeId}
                onClick={() => pick(c.id)}
                whileHover={{ y: -4 }}
              >
                <span className="blot-icon"><Icon size={34} strokeWidth={1.3} aria-hidden="true" /></span>
                <strong>{c.name}</strong>
                <span>{c.description}</span>
              </motion.button>
            </Reveal>
          );
        })}
      </section>

      {!active && (featured.length > 0 || resources.loading) && (
        <section className="section" aria-labelledby="featured-title">
          <SectionHeading id="featured-title" sprigs>Featured Resources</SectionHeading>
          {resources.loading && !resources.data && <Loading label="Loading resources" />}
          <div className="resource-grid">
            {featured.map((r, i) => <Reveal key={r.id} delay={i * 0.08} className="grid-cell"><ResourceCard resource={r} /></Reveal>)}
          </div>
        </section>
      )}

      {resources.error && <div className="section"><ErrorState error={resources.error} onRetry={resources.reload} message="We couldn't load the resources just now." /></div>}

      {resources.data && (
        <section className="section" id="library" aria-labelledby="library-title">
          <SectionHeading id="library-title">{active ? active.name : 'More to Explore'}</SectionHeading>
          {active && (
            <p className="center-text"><button type="button" className="text-button" onClick={() => setParams({}, { replace: true, preventScrollReset: true })}>Show all resources</button></p>
          )}
          {filtered.length === 0
            ? <EmptyState title="New material for this section is on the way." />
            : (
              <div className="resource-grid">
                {filtered.map((r, i) => <Reveal key={r.id} delay={i * 0.06} className="grid-cell"><ResourceCard resource={r} /></Reveal>)}
              </div>
            )}
        </section>
      )}

      <section className="earth-band" aria-labelledby="library-band">
        <WaveTop />
        <div className="earth-band-body library-band">
          <img className="band-figure" src="/images/resources/band-reader.webp" alt="" loading="lazy" />
          <div className="band-text ruled-light">
            <h2 id="library-band">Learning Library</h2>
            <p>Explore practical knowledge, real experiences and time-tested wisdom for building with nature.</p>
            <ul className="band-points">
              <li><Leaf size={22} strokeWidth={1.4} aria-hidden="true" />Practical &amp; Field-tested</li>
              <li><Users size={22} strokeWidth={1.4} aria-hidden="true" />Expert Insights</li>
              <li><InfinityIcon size={22} strokeWidth={1.4} aria-hidden="true" />For Learners at All Levels</li>
            </ul>
          </div>
          <Button to="/workshops" variant="light" arrow>Learn Hands-on</Button>
        </div>
      </section>
    </>
  );
}
