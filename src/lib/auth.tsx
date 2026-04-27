import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthState>({
  token: null,
  isAuthenticated: false,
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Extracts the `surdej-token` query parameter from the URL.
 * Once captured, removes it from the URL bar to keep things clean.
 */
function extractTokenFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('surdej-token');
  if (token) {
    params.delete('surdej-token');
    const newSearch = params.toString();
    const newUrl =
      window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);
  }
  return token;
}

const TOKEN_KEY = 'surdej-token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // 1. Check query parameter first
    const urlToken = extractTokenFromUrl();
    if (urlToken) {
      sessionStorage.setItem(TOKEN_KEY, urlToken);
      setState({ token: urlToken, isAuthenticated: true, isLoading: false });
      return;
    }

    // 2. Fall back to stored token
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (stored) {
      setState({ token: stored, isAuthenticated: true, isLoading: false });
      return;
    }

    // 3. No token available
    setState({ token: null, isAuthenticated: false, isLoading: false });
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
