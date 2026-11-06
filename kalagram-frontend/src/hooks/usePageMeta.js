import { useEffect } from 'react';

function setMeta(selector, attr, value) {
  const tag = document.head.querySelector(selector);
  if (tag && value) tag.setAttribute(attr, value);
}

/** Per-route document title and description, for search results and link previews. */
export function usePageMeta(title, description) {
  useEffect(() => {
    if (!title) return;
    const full = `${title} | Kalagram`;
    document.title = full;
    setMeta('meta[property="og:title"]', 'content', full);
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:description"]', 'content', description);
  }, [title, description]);
}
