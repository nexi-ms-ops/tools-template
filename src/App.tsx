import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { health, auth, type User, type HealthResponse } from '@/services/surdej-api';
import { Activity, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <NoTokenPage />;
  }

  return <DashboardPage />;
}

function NoTokenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <div className="rounded-lg border bg-card p-8 max-w-md text-center shadow-sm">
        <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-semibold mb-2">No Token Provided</h1>
        <p className="text-muted-foreground text-sm">
          Append <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">?surdej-token=YOUR_TOKEN</code> to
          the URL to authenticate.
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          Contact <strong>Mikkel</strong> to get a token.
        </p>
      </div>
    </div>
  );
}

function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.allSettled([auth.me(), health.get()]).then(([userResult, healthResult]) => {
      if (userResult.status === 'fulfilled') setUser(userResult.value);
      else setError(userResult.reason?.message ?? 'Failed to load user');

      if (healthResult.status === 'fulfilled') setHealthData(healthResult.value);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">Surdej Demo</span>
          </div>
          {user && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">{user.email}</span>
              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
                {user.role}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 mb-6 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm animate-slide-up">
            <h2 className="text-sm font-medium text-muted-foreground mb-4">Current User</h2>
            {user ? (
              <div className="space-y-2">
                <p className="font-medium">{user.name ?? '(unnamed)'}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground font-mono">{user.id}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
          </div>

          {/* Health Card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm animate-slide-up" style={{ animationDelay: '50ms' }}>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">API Health</h2>
            {healthData ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">{healthData.status}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Version: <span className="font-mono">{healthData.version}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Uptime: {Math.round(healthData.uptime)}s
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
