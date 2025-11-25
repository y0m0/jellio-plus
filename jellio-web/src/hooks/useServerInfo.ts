import { useEffect, useRef, useState } from 'react';
import useAccessToken from '@/hooks/useAccessToken.ts';
import { getServerInfo } from '@/services/backendService.ts';
import type { ServerInfo, Maybe } from '@/types';

const useServerInfo = (): Maybe<ServerInfo> => {
  const accessToken = useAccessToken();
  const [serverInfo, setServerInfo] = useState<ServerInfo | null | undefined>();
  const attemptedOnceRef = useRef(false);

  useEffect(() => {
    // If token discovery not finished yet, wait (prevents unauthenticated first request)
    if (accessToken === undefined) return;

    let cancelled = false;
    const fetchServerInfo = async (): Promise<void> => {
      try {
        const info = await getServerInfo(accessToken ?? undefined);
        if (cancelled) return;
        setServerInfo({ accessToken: accessToken ?? '', ...info });
      } catch (error: any) {
        if (cancelled) return;
        const status = error?.response?.status as number | undefined;

        // Only treat 401/403 as unauthenticated if we have a definitive token state (null or real string)
        const tokenResolved = accessToken !== undefined;
        if (tokenResolved && (status === 401 || status === 403)) {
            setServerInfo(null);
            return;
        }

        console.warn('Non-auth (or pre-token) error fetching server info:', error);

        if (!attemptedOnceRef.current) {
          attemptedOnceRef.current = true;
          setTimeout(() => {
            if (!cancelled) void fetchServerInfo();
          }, 400);
        } else {
          setServerInfo(undefined);
        }
      }
    };

    void fetchServerInfo();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return serverInfo;
};

export default useServerInfo;