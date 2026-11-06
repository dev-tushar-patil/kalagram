import { useCallback, useEffect, useRef, useState } from 'react';

/** Runs `loader` on mount and whenever `deps` change; ignores responses from superseded calls. */
export function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const latest = useRef(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(() => {
    const call = ++latest.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    return loaderRef.current()
      .then((data) => {
        if (call === latest.current) setState({ data, loading: false, error: null });
        return data;
      })
      .catch((error) => {
        if (call === latest.current) setState({ data: null, loading: false, error });
      });
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, reload };
}
