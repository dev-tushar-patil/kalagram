import { motion } from 'framer-motion';
import { Compass, Eye, Home as HomeIcon, Leaf, SquareCheck, ThermometerSun, Users, Wind } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta.js';
import PageHero from '../components/PageHero.jsx';
import Button from '../components/Button.jsx';
import { PatternBorder, Reveal, SectionHeading } from '../components/Decor.jsx';

const PURPOSE = [
  { title: 'Revive', text: "India's natural building knowledge and practices.", art: 'purpose-revive' },
  { title: 'Educate', text: 'Through hands-on, experiential learning.', art: 'purpose-educate' },
  { title: 'Build Community', text: 'Among learners, builders and earth enthusiasts.', art: 'purpose-community' },
  { title: 'Promote Sustainability', text: 'For healthier homes, people and the planet.', art: 'purpose-sustain' },
];

const APPROACH = [
  'Learn by doing, in real natural settings.',
  'Work with local, low-impact and earth-based materials.',
  'Share practical knowledge with a sense of place, people and ecology.',
];

const WHY = [
  { Icon: ThermometerSun, title: 'Naturally comfortable', text: 'Thick earthen walls change temperature slowly, keeping rooms cooler in the day and gentler at night.' },
  { Icon: Wind, title: 'Healthy to live in', text: 'Earth walls breathe, help moderate indoor humidity and avoid many synthetic finishes.' },
  { Icon: Leaf, title: 'Light on the planet', text: 'Materials come from close to the site, avoiding much of the energy of firing and transport.' },
  { Icon: HomeIcon, title: 'Rooted in place', text: 'Local soils, local skills and local climate shape a home that belongs where it stands.' },
];

export default function About() {
  usePageMeta('About Kalagram', "Kalagram is a learning platform for natural building, reviving India's earth-based building traditions through hands-on learning and community sharing.");
  return (
    <>
      <PageHero
        title="About Kalagram"
        subtitle="A learning platform for natural building, rooted in tradition, people and the earth."
        art="/images/about/hero.webp"
        artAlt="A traditional mud house with a tiled roof and carved veranda pillars beneath a large tree"
        crumb={{ label: 'About Us' }}
      />

      <section className="section split" aria-labelledby="about-intro">
        <Reveal className="split-art">
          <img src="/images/about/story.webp" alt="Three builders laying earth blocks and mixing soil beside a rising wall" loading="lazy" />
        </Reveal>
        <Reveal className="split-text ruled" delay={0.1}>
          <h2 id="about-intro">Our Story</h2>
          <p>
            Kalagram was born from a simple yet powerful belief: that the wisdom of natural building holds the answers to many of
            today's living challenges. We are a collective of builders, designers and learners who are passionate about reviving and
            practising India's earth-based building traditions through hands-on learning and community sharing.
          </p>
        </Reveal>
      </section>

      <section className="section" aria-labelledby="purpose-title">
        <SectionHeading id="purpose-title">Our Purpose</SectionHeading>
        <ul className="purpose-grid">
          {PURPOSE.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.08} className="purpose-item">
              <motion.img src={`/images/about/${p.art}.webp`} alt="" loading="lazy" whileHover={{ scale: 1.05, rotate: -1 }} />
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="section mission-grid" aria-label="Our mission and vision">
        <Reveal className="mission-card">
          <Compass size={34} strokeWidth={1.4} aria-hidden="true" />
          <h2>Our Mission</h2>
          <p>To make natural building knowledge practical and within reach, so that more people can learn to build, repair and care for healthy homes with their own hands.</p>
        </Reveal>
        <Reveal className="mission-card" delay={0.1}>
          <Eye size={34} strokeWidth={1.4} aria-hidden="true" />
          <h2>Our Vision</h2>
          <p>A future in which earth-based building is once again a respected and everyday choice, carried forward by communities who value tradition, people and ecology.</p>
        </Reveal>
      </section>

      <section className="section split approach" aria-labelledby="approach-title">
        <Reveal className="split-art">
          <img src="/images/about/approach.webp" alt="Learners seated under a thatched roof around a teacher and a drawing of a house" loading="lazy" />
        </Reveal>
        <Reveal className="split-text ruled" delay={0.1}>
          <h2 id="approach-title">Our Approach</h2>
          <ul className="check-list">
            {APPROACH.map((item) => (
              <li key={item}><SquareCheck size={24} strokeWidth={1.5} aria-hidden="true" />{item}</li>
            ))}
          </ul>
          <img className="approach-branch" src="/images/about/branch.webp" alt="" loading="lazy" />
        </Reveal>
      </section>

      <PatternBorder />

      <section className="section" aria-labelledby="why-title">
        <SectionHeading id="why-title" sprigs>Why Natural Building?</SectionHeading>
        <ul className="why-grid">
          {WHY.map(({ Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={i * 0.07} className="soft-card">
              <span className="blot-icon"><Icon size={30} strokeWidth={1.4} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="section community" aria-labelledby="community-title">
        <Reveal className="community-card">
          <Users size={38} strokeWidth={1.3} aria-hidden="true" />
          <h2 id="community-title">Our Community</h2>
          <p>
            Our workshops bring together homeowners, students, architects, artisans and curious first-timers. People arrive as
            strangers and spend their days mixing, laying and plastering side by side. Whatever you come to learn, you will have
            good company on the way.
          </p>
          <div className="hero-actions center">
            <Button to="/workshops" arrow>Explore Workshops</Button>
            <Button to="/gallery" variant="secondary">See Our Gallery</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
