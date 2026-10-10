import { useEffect, useState } from "react";
import { getCached, peekCache, toApiError } from "../lib/api.js";

// GET with the shared cache. Returns { data, error, loading, reload }.
// Seeds from cache synchronously so returning to a page renders instantly, without a skeleton flash.
export function useApi(url, params) {
  const key = url ? `${url}?${JSON.stringify(params || {})}` : null;
  const [state, setState] = useState(() => {
    const cached = url ? peekCache(url, params) : undefined;
    return { data: cached, error: null, loading: Boolean(url) && cached === undefined };
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!url) return undefined;
    let alive = true;
    setState((s) => ({ ...s, loading: s.data === undefined, error: null }));
    getCached(url, params)
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((err) => alive && setState({ data: undefined, error: toApiError(err), loading: false }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  return { ...state, reload: () => setNonce((n) => n + 1) };
}
