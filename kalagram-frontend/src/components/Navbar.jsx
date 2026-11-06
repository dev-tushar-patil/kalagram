import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, X } from 'lucide-react';
import { publicApi } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import Button from './Button.jsx';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/workshops', label: 'Workshops' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/resources', label: 'Resources', dropdown: true },
  { to: '/contact', label: 'Contact Us' },
];

function DesktopLink({ link, children }) {
  return (
    <NavLink to={link.to} end={link.end} className="nav-link">
      {({ isActive }) => (
        <>
          {children || link.label}
          {isActive && <motion.span layoutId="nav-active" className="nav-underline" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />}
          {!isActive && <span className="nav-hover-line" aria-hidden="true" />}
        </>
      )}
    </NavLink>
  );
}

function ResourcesMenu({ link, categories }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);
  const { pathname, search } = useLocation();

  useEffect(() => setOpen(false), [pathname, search]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e) => {
      if (!wrapper.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <div
      className="nav-dropdown"
      ref={wrapper}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <DesktopLink link={link} />
      <button
        type="button"
        className="nav-caret"
        aria-label="Show resource categories"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronDown size={15} style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            className="nav-menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
          >
            <li><Link to="/resources">All Resources</Link></li>
            {categories.map((c) => (
              <li key={c.id}><Link to={`/resources?category=${c.id}`}>{c.name}</Link></li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname, search } = useLocation();
  const { data: categories } = useFetch(publicApi.resourceCategories, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname, search]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="nav-inner">
        <Link to="/" className="nav-logo" aria-label="Kalagram home">
          <img src="/images/brand/logo.webp" alt="" width="210" height="112" />
        </Link>

        <nav className="nav-links" aria-label="Main">
          {LINKS.map((link) =>
            link.dropdown ? (
              <ResourcesMenu key={link.to} link={link} categories={categories || []} />
            ) : (
              <DesktopLink key={link.to} link={link} />
            ),
          )}
        </nav>

        <Button to="/register" size="small" className="nav-cta">Register Now</Button>

        <button
          type="button"
          className="nav-burger"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            className="mobile-nav"
            aria-label="Mobile"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {LINKS.map((link) => (
              <div key={link.to}>
                <NavLink to={link.to} end={link.end} className="mobile-link">{link.label}</NavLink>
                {link.dropdown && (categories || []).map((c) => (
                  <Link key={c.id} to={`/resources?category=${c.id}`} className="mobile-sublink">{c.name}</Link>
                ))}
              </div>
            ))}
            <Button to="/register" className="mobile-cta">Register Now</Button>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
