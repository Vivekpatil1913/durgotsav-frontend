import { useEffect, useRef, useState } from "react";
import { getCached, peekCache, toApiError } from "../lib/api.js";

// Infinite list over a paged endpoint ({ data, meta: { page, totalPages, total } }).
// Returns { items, total, page, hasMore, loading, error, loadMore, retry }.
// Pages go through the shared cache; page 1 seeds from it so returning to a page renders instantly.
export function usePagedApi(url, limit) {
  const [state, setState] = useState(() => {
    const first = peekCache(url, { page: 1, limit });
    return {
      items: first?.data ?? [],
      page: first ? 1 : 0,
      totalPages: first?.meta?.totalPages ?? 1,
      total: first?.meta?.total ?? first?.data.length ?? 0,
      loading: !first,
      error: null,
    };
  });
  const busy = useRef(false);
  const alive = useRef(true);

  async function load(page) {
    if (busy.current) return;
    busy.current = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await getCached(url, { page, limit });
      if (!alive.current) return;
      setState((s) => {
        // A row added or removed between requests shifts the OFFSET pages — drop any repeats
        const seen = new Set(page === 1 ? [] : s.items.map((i) => i.id));
        const fresh = res.data.filter((i) => !seen.has(i.id));
        // No meta = an unpaged response (e.g. an older API): treat it as the only page
        return {
          items: page === 1 ? fresh : [...s.items, ...fresh],
          page,
          totalPages: res.meta?.totalPages ?? page,
          total: res.meta?.total ?? res.data.length,
          loading: false,
          error: null,
        };
      });
    } catch (err) {
      if (alive.current) setState((s) => ({ ...s, loading: false, error: toApiError(err) }));
    } finally {
      busy.current = false;
    }
  }

  useEffect(() => {
    alive.current = true;
    load(1);
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, limit]);

  const hasMore = state.page < state.totalPages;
  return {
    ...state,
    hasMore,
    loadMore: () => hasMore && !state.error && load(state.page + 1),
    retry: () => load(state.page + 1),
  };
}
