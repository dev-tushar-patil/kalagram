import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext.jsx';
import { FLOATING_MESSAGE, whatsappLink } from '../utils/whatsapp.js';
import WhatsAppIcon from './WhatsAppIcon.jsx';

export default function WhatsAppFloat() {
  const { whatsapp } = useSettings();
  return (
    <motion.a
      className="whatsapp-float"
      href={whatsappLink(whatsapp, FLOATING_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Kalagram on WhatsApp"
      title="Chat with us on WhatsApp"
      whileHover={{ scale: 1.08, rotate: -4 }}
      whileTap={{ scale: 0.95 }}
    >
      <WhatsAppIcon size={30} />
    </motion.a>
  );
}
