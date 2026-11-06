import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createNatureAudio } from '../utils/natureAudio.js';

const MusicContext = createContext(null);

/**
 * Sits in the public layout, which stays mounted across page changes, so sound and state carry over while
 * navigating. Always starts OFF on a fresh page load: browsers and the brief both forbid autoplay.
 */
export function MusicProvider({ children }) {
  const [playing, setPlaying] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const engine = useRef(null);

  useEffect(() => () => engine.current?.destroy(), []);

  const toggle = useCallback(async () => {
    if (playing) {
      engine.current?.stop();
      setPlaying(false);
      return;
    }
    try {
      if (!engine.current) engine.current = createNatureAudio();
      setPlaying(true);
      await engine.current.start();
    } catch {
      setPlaying(false);
      setUnavailable(true);
    }
  }, [playing]);

  const value = useMemo(() => ({ playing, toggle, unavailable }), [playing, toggle, unavailable]);
  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export const useMusic = () => useContext(MusicContext);
