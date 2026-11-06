import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import WhatsAppFloat from '../components/WhatsAppFloat.jsx';
import MusicToggle from '../components/MusicToggle.jsx';
import { Loading } from '../components/States.jsx';
import { MusicProvider } from '../context/MusicContext.jsx';

export default function SiteLayout() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Wait a beat for lazily loaded page content before jumping to the section.
      const timer = setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 400);
      return () => clearTimeout(timer);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [pathname, hash]);

  return (
    <MusicProvider>
      <a className="skip-link" href="#main">Skip to content</a>
      <Navbar />
      <main id="main" tabIndex={-1}>
        <Suspense fallback={<Loading label="Loading page" />}>
          <motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
            <Outlet />
          </motion.div>
        </Suspense>
      </main>
      <Footer />
      <MusicToggle />
      <WhatsAppFloat />
    </MusicProvider>
  );
}
