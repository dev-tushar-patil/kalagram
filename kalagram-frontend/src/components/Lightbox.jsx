import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { assetUrl } from '../services/api.js';

export default function Lightbox({ images, index, onClose, onNavigate }) {
  const closeButton = useRef(null);
  const image = images[index];
  const count = images.length;

  useEffect(() => {
    const previousFocus = document.activeElement;
    closeButton.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      previousFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((index + 1) % count);
      if (e.key === 'ArrowLeft') onNavigate((index - 1 + count) % count);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, count, onClose, onNavigate]);

  return createPortal(
    <motion.div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={image.title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button ref={closeButton} type="button" className="lightbox-btn lightbox-close" onClick={onClose} aria-label="Close image">
        <X size={26} />
      </button>
      {count > 1 && (
        <button type="button" className="lightbox-btn lightbox-prev" onClick={() => onNavigate((index - 1 + count) % count)} aria-label="Previous image">
          <ChevronLeft size={30} />
        </button>
      )}
      <figure className="lightbox-figure">
        <AnimatePresence mode="wait">
          <motion.img
            key={image.id}
            src={assetUrl(image.imageUrl)}
            alt={image.altText || image.title}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>
        <figcaption>{image.title} <span>{index + 1} / {count}</span></figcaption>
      </figure>
      {count > 1 && (
        <button type="button" className="lightbox-btn lightbox-next" onClick={() => onNavigate((index + 1) % count)} aria-label="Next image">
          <ChevronRight size={30} />
        </button>
      )}
    </motion.div>,
    document.body,
  );
}
