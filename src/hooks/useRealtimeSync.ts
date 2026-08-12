import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const SSE_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
  : 'http://localhost:3002';

const SSE_URL = `${SSE_BASE_URL}/api/v1/events`;

const MIN_RETRY_MS = 5_000;
const MAX_RETRY_MS = 60_000;

/**
 * Hook to listen to Server-Sent Events (SSE) and invalidate React Query cache.
 * Implements exponential-backoff reconnection so a flaky connection never
 * floods the server with rapid reconnects.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const retryDelay = useRef(MIN_RETRY_MS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;

    function connect() {
      if (unmounted.current) return;

      // Close any existing connection first
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      const es = new EventSource(SSE_URL);
      esRef.current = es;

      es.onopen = () => {
        if (unmounted.current) { es.close(); return; }
        console.log('[Realtime Sync] Connected to SSE');
        retryDelay.current = MIN_RETRY_MS; // reset backoff on success
      };

      es.addEventListener('invalidate', (event) => {
        if (unmounted.current) return;
        try {
          const data = JSON.parse(event.data);
          if (data?.entity) {
            console.log(`[Realtime Sync] Invalidating: ${data.entity}`);
            queryClient.invalidateQueries({ queryKey: [data.entity] });

            if (data.entity === 'pages' || data.entity === 'filiales') {
              queryClient.invalidateQueries({ queryKey: ['contactData'] });
              queryClient.invalidateQueries({ queryKey: ['domainesData'] });
            }
          }
        } catch (err) {
          console.error('[Realtime Sync] Parse error:', err);
        }
      });

      es.onerror = () => {
        if (unmounted.current) return;
        es.close();
        esRef.current = null;

        const delay = retryDelay.current;
        console.warn(`[Realtime Sync] SSE error — retrying in ${delay / 1000}s`);

        // Exponential backoff
        retryDelay.current = Math.min(retryDelay.current * 2, MAX_RETRY_MS);

        timerRef.current = setTimeout(() => {
          if (!unmounted.current) connect();
        }, delay);
      };
    }

    connect();

    return () => {
      unmounted.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      console.log('[Realtime Sync] Disconnected');
    };
  }, [queryClient]);
}
