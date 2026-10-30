import { useEffect, useState } from "react";
import { getCached, peekCache, toApiError } from "../lib/api.js";

// GET with the shared cache. Returns { data, error, loading, fetching, reload }.
// Seeds from cache synchronously so returning to a page renders instantly, without a skeleton flash.
// When params change the previous data stays (loading stays false); fetching is true until the new data arrives —
// already in the render where params change, since the data is tagged with the request it answers.
export function useApi(url, params) {
  const key = url ? `${url}?${JSON.stringify(params || {})}` : null;
  const [state, setState] = useState(() => {
    const cached = url ? peekCache(url, params) : undefined;
    return { data: cached, error: null, loading: Boolean(url) && cached === undefined, fetching: Boolean(url), for: null };
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!url) return undefined;
    let alive = true;
    setState((s) => ({ ...s, loading: s.data === undefined, fetching: true, error: null }));
    getCached(url, params)
      .then((data) => alive && setState({ data, error: null, loading: false, fetching: false, for: key }))
      .catch((err) => alive && setState({ data: undefined, error: toApiError(err), loading: false, fetching: false, for: key }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  const { for: answered, ...rest } = state;
  return { ...rest, fetching: Boolean(key) && (rest.fetching || answered !== key), reload: () => setNonce((n) => n + 1) };
}
