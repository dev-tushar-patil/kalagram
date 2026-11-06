import { motion } from 'framer-motion';

/** Fades and lifts children in as they scroll into view. */
export function Reveal({ children, delay = 0, className, as = 'div' }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}

export function SectionHeading({ children, sprigs, subtitle, id }) {
  return (
    <Reveal className={`section-heading ${sprigs ? 'with-sprigs' : ''}`}>
      {sprigs && <img className="sprig sprig-left" src="/images/decor/sprig-left.webp" alt="" loading="lazy" />}
      <h2 id={id}>
        <span className="rule" aria-hidden="true" />
        <span>{children}</span>
        <span className="rule" aria-hidden="true" />
      </h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
      {sprigs && <img className="sprig sprig-right" src="/images/decor/sprig-right.webp" alt="" loading="lazy" />}
    </Reveal>
  );
}

/** The woven terracotta band used between sections in the designs. */
export function PatternBorder({ className = '' }) {
  return <div className={`pattern-border ${className}`} aria-hidden="true" />;
}

/** Hand-cut wavy edge for the top of terracotta bands. */
export function WaveTop() {
  return (
    <svg className="wave-top" viewBox="0 0 1200 42" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 42V24c58-9 122-14 186-6 72 9 118 3 188-5 84-10 152-8 232 4 74 11 138 11 206 0 76-12 142-16 214-4 64 11 118 12 174 4v29z" />
    </svg>
  );
}

/** A small flock drifting slowly across the hero sky. */
export function Birds({ className = '' }) {
  return (
    <motion.svg
      className={`birds ${className}`}
      viewBox="0 0 90 44"
      aria-hidden="true"
      animate={{ x: [0, 16, 0], y: [0, -6, 0] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M2 24c5-5 9-5 12 0 3-5 8-6 13-2M34 12c5-5 9-5 12 0 3-5 8-6 13-2M62 26c4-4 8-4 11 0 3-4 7-5 11-2" />
    </motion.svg>
  );
}

/** Leaves that loosen and fall gently. */
export function FloatingLeaves({ count = 3 }) {
  return (
    <div className="floating-leaves" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          className="floating-leaf"
          style={{ left: `${48 + i * 17}%`, top: `${2 + (i % 2) * 10}%` }}
          animate={{ y: [0, 46, 92], x: [0, 16, -6], rotate: [0, 28, -14], opacity: [0, 0.75, 0] }}
          transition={{ duration: 11 + i * 2.5, delay: i * 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path d="M4 20C4 10 11 4 21 3c0 10-6 17-16 17-1 0-1 0-1 0zM5 20C9 15 13 11 17 8" />
        </motion.svg>
      ))}
    </div>
  );
}
