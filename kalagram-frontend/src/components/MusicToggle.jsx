import { motion } from 'framer-motion';
import { VolumeX } from 'lucide-react';
import { useMusic } from '../context/MusicContext.jsx';

function SoundWave() {
  return (
    <span className="sound-wave" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <motion.i
          key={i}
          animate={{ scaleY: [0.35, 1, 0.5, 0.85, 0.35] }}
          transition={{ duration: 1.3 + i * 0.17, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
        />
      ))}
    </span>
  );
}

export default function MusicToggle() {
  const { playing, toggle, unavailable } = useMusic();

  if (unavailable) return null;

  return (
    <motion.button
      type="button"
      className={`music-toggle ${playing ? 'is-on' : ''}`}
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? 'Music on. Turn nature sounds off' : 'Music off. Turn nature sounds on'}
      title="Birds, forest, flowing water and soft wind"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
    >
      {playing ? <SoundWave /> : <VolumeX size={17} aria-hidden="true" />}
      <span>{playing ? 'Music ON' : 'Music OFF'}</span>
    </motion.button>
  );
}
