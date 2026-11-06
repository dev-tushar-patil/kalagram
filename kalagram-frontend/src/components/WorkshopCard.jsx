import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, CalendarDays, Clock, IndianRupee } from 'lucide-react';
import { assetUrl } from '../services/api.js';
import { formatPrice, formatRange, LEVEL_LABELS, seatsLabel } from '../utils/format.js';
import Button from './Button.jsx';

export default function WorkshopCard({ workshop }) {
  const detailsUrl = `/workshops/${workshop.slug}`;
  const next = workshop.upcomingBatches?.find((b) => b.open);
  const price = formatPrice(workshop.priceInr);

  return (
    <motion.article
      className="workshop-card"
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <Link to={detailsUrl} className="workshop-card-image" tabIndex={-1} aria-hidden="true">
        <img src={assetUrl(workshop.imageUrl)} alt="" loading="lazy" />
      </Link>
      <div className="workshop-card-body">
        <h3><Link to={detailsUrl}>{workshop.title}</Link></h3>
        <p className="workshop-card-desc">{workshop.shortDescription}</p>
        <ul className="workshop-meta">
          <li><Clock size={15} aria-hidden="true" />{workshop.duration}</li>
          <li><BarChart3 size={15} aria-hidden="true" />{LEVEL_LABELS[workshop.skillLevel]}</li>
          <li className="meta-wide"><IndianRupee size={15} aria-hidden="true" />{price ? `Starting at ${price}` : 'Price on request'}</li>
          <li className="meta-wide">
            <CalendarDays size={15} aria-hidden="true" />
            {next ? <span>{formatRange(next.startDate, next.endDate)} · {seatsLabel(next)}</span> : <span>New dates coming soon</span>}
          </li>
        </ul>
        <div className="workshop-card-actions">
          <Button to={detailsUrl} variant="secondary" size="small">View Details</Button>
          <Button to={`/register?workshop=${workshop.id}${next ? `&batch=${next.id}` : ''}`} size="small">Register Now</Button>
        </div>
      </div>
    </motion.article>
  );
}
