import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Birds } from './Decor.jsx';

/** Title on the left, illustration on the right: the header shared by the inner pages. */
export default function PageHero({ title, subtitle, art, artAlt = '', crumb, children, wave }) {
  return (
    <section className={`page-hero ${wave ? 'has-wave' : ''}`}>
      <div className="page-hero-inner">
        <motion.div
          className="page-hero-text"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {crumb && (
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span aria-hidden="true">›</span>
              {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
              {crumb.current && (
                <>
                  <span aria-hidden="true">›</span>
                  <span aria-current="page">{crumb.current}</span>
                </>
              )}
            </nav>
          )}
          <h1>{title}</h1>
          <span className="title-rule" aria-hidden="true" />
          {subtitle && <p className="lede">{subtitle}</p>}
          {children}
        </motion.div>
        {art && (
          <motion.div
            className="page-hero-art"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <img src={art} alt={artAlt} fetchpriority="high" />
            <Birds className="hero-birds" />
          </motion.div>
        )}
      </div>
    </section>
  );
}
