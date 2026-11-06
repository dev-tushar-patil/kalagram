import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useSettings } from '../context/SettingsContext.jsx';
import { FLOATING_MESSAGE, whatsappLink } from '../utils/whatsapp.js';
import WhatsAppIcon from './WhatsAppIcon.jsx';
import { WaveTop } from './Decor.jsx';

export default function Footer() {
  const s = useSettings();
  const socials = [
    ['Instagram', s.instagramUrl],
    ['Facebook', s.facebookUrl],
    ['YouTube', s.youtubeUrl],
  ].filter(([, url]) => url);

  return (
    <footer className="site-footer">
      <WaveTop />
      <div className="footer-body">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/images/brand/logo-light.webp" alt="Kalagram: Seven Elements. One Tradition." className="footer-logo" loading="lazy" />
            <p>A learning platform for natural building, rooted in tradition, people and the earth.</p>
          </div>
          <nav aria-label="Footer: explore">
            <h2>Explore</h2>
            <ul>
              <li><Link to="/about">About Kalagram</Link></li>
              <li><Link to="/workshops">Workshops</Link></li>
              <li><Link to="/gallery">Gallery</Link></li>
              <li><Link to="/resources">Resources</Link></li>
            </ul>
          </nav>
          <nav aria-label="Footer: take part">
            <h2>Take Part</h2>
            <ul>
              <li><Link to="/register">Register for a Workshop</Link></li>
              <li><Link to="/workshops#dates">Upcoming Dates</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
            {socials.length > 0 && (
              <ul className="footer-socials">
                {socials.map(([label, url]) => (
                  <li key={label}><a href={url} target="_blank" rel="noopener noreferrer">{label}</a></li>
                ))}
              </ul>
            )}
          </nav>
          <div>
            <h2>Reach Us</h2>
            <ul className="footer-contact">
              <li><Phone size={16} aria-hidden="true" /><a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a></li>
              <li>
                <WhatsAppIcon size={16} />
                <a href={whatsappLink(s.whatsapp, FLOATING_MESSAGE)} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
              </li>
              <li><Mail size={16} aria-hidden="true" /><a href={`mailto:${s.email}`}>{s.email}</a></li>
              <li><MapPin size={16} aria-hidden="true" /><span>{s.address}</span></li>
            </ul>
          </div>
        </div>
        <p className="footer-bottom">© {new Date().getFullYear()} Kalagram. Seven Elements. One Tradition.</p>
      </div>
    </footer>
  );
}
