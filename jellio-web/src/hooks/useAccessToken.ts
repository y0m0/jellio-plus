import { useEffect, useState } from 'react';
import type { Maybe } from '@/types';

// Synchronously attempt to read the token before first render
function readInitialToken(): Maybe<string> {
  try {
    const stored = localStorage.getItem('jellyfin_credentials');
    if (!stored) return null;
    const parsed = JSON.parse(stored);

    // Case 1: { Servers: [ { AccessToken } ] }
    if (parsed?.Servers && Array.isArray(parsed.Servers)) {
      const withToken = parsed.Servers.find((s: any) => s?.AccessToken);
      if (withToken?.AccessToken && typeof withToken.AccessToken === 'string') {
        return withToken.AccessToken;
      }
    }

    // Case 2: { AccessToken: "..." }
    if (typeof parsed?.AccessToken === 'string' && parsed.AccessToken.length > 0) {
      return parsed.AccessToken;
    }

    return null;
  } catch {
    return null;
  }
}

const useAccessToken = (): Maybe<string> => {
  const [accessToken, setAccessToken] = useState<Maybe<string>>(readInitialToken());

  // Optional: re-validate once after mount in case something changed
  useEffect(() => {
    setAccessToken(readInitialToken());
  }, []);

  return accessToken;
};

export default useAccessToken;