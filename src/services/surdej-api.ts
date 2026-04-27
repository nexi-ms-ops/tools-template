const TOKEN_KEY = 'surdej-token';

/**
 * Base API client. Reads the Surdej Bearer token from sessionStorage.
 * All service methods go through this.
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(res.status, body || res.statusText);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`API ${status}: ${body}`);
    this.name = 'ApiError';
  }
}

// ─── Health ───

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
  uptime: number;
}

export interface ReadyResponse {
  ready: boolean;
}

export interface LiveResponse {
  live: boolean;
}

export const health = {
  get: () => request<HealthResponse>('/api/health'),
  ready: () => request<ReadyResponse>('/api/health/ready'),
  live: () => request<LiveResponse>('/api/health/live'),
};

// ─── Config ───

export const config = {
  get: () => request<unknown>('/api/config'),
};

// ─── Auth ───

export interface LookupRequest {
  email: string;
}

export interface LookupTenant {
  id: string;
  name: string;
  slug: string;
  providers: string[];
}

export interface LookupResponse {
  outcome: string;
  tenants: LookupTenant[];
}

export interface LoginRequest {
  email: string;
  password?: string;
  tenantId?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export const auth = {
  lookup: (body: LookupRequest) =>
    request<LookupResponse>('/api/auth/lookup', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: LoginRequest) =>
    request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  me: () => request<User>('/api/auth/me'),
  logout: () =>
    request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  dev: {
    impersonate: (userId: string) =>
      request<unknown>('/api/auth/dev/impersonate', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    tenantUsers: () => request<User[]>('/api/auth/dev/tenant-users'),
  },
};

// ─── Users ───

export const users = {
  list: () => request<User[]>('/api/users'),
  get: (id: string) => request<User>(`/api/users/${encodeURIComponent(id)}`),
};

// ─── Features ───

export interface Feature {
  featureId: string;
  title: string;
  ring: number;
  enabledByDefault: boolean;
  description?: string;
}

export interface UpdateFeatureRequest {
  ring?: number;
  enabledByDefault?: boolean;
  title?: string;
  description?: string;
}

export const features = {
  list: () => request<Feature[]>('/api/features'),
  get: (id: string) =>
    request<Feature>(`/api/features/${encodeURIComponent(id)}`),
  update: (id: string, body: UpdateFeatureRequest) =>
    request<Feature>(`/api/features/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};

// ─── Skins ───

export interface Skin {
  id: string;
  name: string;
  sidebarItems?: string[];
}

export interface CreateSkinRequest {
  name: string;
  sidebarItems?: string[];
}

export interface UpdateSkinRequest {
  name?: string;
  sidebarItems?: string[];
}

export const skins = {
  list: () => request<Skin[]>('/api/skins'),
  get: (skinId: string) =>
    request<Skin>(`/api/skins/${encodeURIComponent(skinId)}`),
  create: (body: CreateSkinRequest) =>
    request<Skin>('/api/skins', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (skinId: string, body: UpdateSkinRequest) =>
    request<Skin>(`/api/skins/${encodeURIComponent(skinId)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  delete: (skinId: string) =>
    request<unknown>(`/api/skins/${encodeURIComponent(skinId)}`, {
      method: 'DELETE',
    }),
};

// ─── Virtual Pages ───

export interface VirtualPage {
  id: string;
  slug: string;
  title: string;
  content?: string;
}

export interface CreatePageRequest {
  slug: string;
  title: string;
  content?: string;
}

export const pages = {
  list: (skinId: string) =>
    request<VirtualPage[]>(
      `/api/skins/${encodeURIComponent(skinId)}/pages`,
    ),
  create: (skinId: string, body: CreatePageRequest) =>
    request<VirtualPage>(
      `/api/skins/${encodeURIComponent(skinId)}/pages`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
  update: (skinId: string, pageId: string, body: Partial<CreatePageRequest>) =>
    request<VirtualPage>(
      `/api/skins/${encodeURIComponent(skinId)}/pages/${encodeURIComponent(pageId)}`,
      { method: 'PUT', body: JSON.stringify(body) },
    ),
  delete: (skinId: string, pageId: string) =>
    request<unknown>(
      `/api/skins/${encodeURIComponent(skinId)}/pages/${encodeURIComponent(pageId)}`,
      { method: 'DELETE' },
    ),
};

// ─── Tenants ───

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isDemo?: boolean;
  domains?: string[];
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  domains?: string[];
}

export const tenants = {
  list: () => request<Tenant[]>('/api/tenants'),
  get: (id: string) =>
    request<Tenant>(`/api/tenants/${encodeURIComponent(id)}`),
  create: (body: CreateTenantRequest) =>
    request<Tenant>('/api/tenants', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<CreateTenantRequest>) =>
    request<Tenant>(`/api/tenants/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    request<unknown>(`/api/tenants/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

// ─── Feedback ───

export interface FeedbackRequest {
  type: 'bug' | 'feature' | 'general';
  message: string;
  context?: Record<string, unknown>;
}

export interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  context?: Record<string, unknown>;
  createdAt: string;
}

export const feedback = {
  submit: (body: FeedbackRequest) =>
    request<unknown>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  list: () => request<FeedbackItem[]>('/api/feedback'),
};

// ─── Workers ───

export interface Worker {
  id: string;
  name?: string;
  status?: string;
}

export interface WorkerHealth {
  natsConnected: boolean;
  total: number;
  online: number;
  degraded: number;
  offline: number;
}

export const workers = {
  list: () => request<Worker[]>('/api/workers'),
  health: () => request<WorkerHealth>('/api/workers/health'),
  metrics: () => request<unknown[]>('/api/workers/metrics'),
  get: (id: string) =>
    request<Worker>(`/api/workers/${encodeURIComponent(id)}`),
  drain: (id: string) =>
    request<unknown>(`/api/workers/${encodeURIComponent(id)}/drain`, {
      method: 'POST',
    }),
};

// ─── Jobs ───

export interface Job {
  id: string;
  type: string;
  status: string;
}

export interface ExportTenantRequest {
  tenantId: string;
}

export interface CopyTenantRequest {
  sourceTenantId: string;
  newName: string;
  newSlug: string;
}

export const jobs = {
  list: () => request<Job[]>('/api/jobs'),
  exportTenant: (body: ExportTenantRequest) =>
    request<unknown>('/api/jobs/export-tenant', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  copyTenant: (body: CopyTenantRequest) =>
    request<unknown>('/api/jobs/copy-tenant', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ─── AI ───

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
}

export const ai = {
  chat: (body: ChatRequest) =>
    request<unknown>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  stream: async (body: { messages: ChatMessage[] }): Promise<ReadableStream<Uint8Array>> => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/ai/stream', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new ApiError(res.status, res.statusText);
    if (!res.body) throw new Error('No response body');
    return res.body;
  },
};

// ─── Blobs ───

export const blobs = {
  upload: async (file: File) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const form = new FormData();
    form.append('file', file);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/blobs', {
      method: 'POST',
      headers,
      body: form,
    });

    if (!res.ok) throw new ApiError(res.status, res.statusText);
    return res.json();
  },
  get: (id: string) =>
    request<unknown>(`/api/blobs/${encodeURIComponent(id)}`),
  delete: (id: string) =>
    request<unknown>(`/api/blobs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

// ─── Knowledge ───

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type?: string;
}

export interface CreateKnowledgeRequest {
  title: string;
  content: string;
  type?: string;
}

export const knowledge = {
  list: (params?: { q?: string; type?: string }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.type) qs.set('type', params.type);
    const search = qs.toString();
    return request<KnowledgeItem[]>(`/api/knowledge${search ? `?${search}` : ''}`);
  },
  get: (id: string) =>
    request<KnowledgeItem>(`/api/knowledge/${encodeURIComponent(id)}`),
  create: (body: CreateKnowledgeRequest) =>
    request<KnowledgeItem>('/api/knowledge', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<CreateKnowledgeRequest>) =>
    request<KnowledgeItem>(`/api/knowledge/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    request<unknown>(`/api/knowledge/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

// ─── ACL ───

export interface Role {
  id: string;
  name: string;
  permissions: string[];
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
}

export interface AclContext {
  role: string;
  permissions: string[];
  tenantMemberships: unknown[];
}

export interface TenantMember {
  userId: string;
  roleId: string;
  user?: User;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  resource: string;
  userId: string;
  tenantId?: string;
  timestamp: string;
}

export const acl = {
  roles: () => request<Role[]>('/api/acl/roles'),
  permissions: () => request<Permission[]>('/api/acl/permissions'),
  myContext: () => request<AclContext>('/api/acl/my-context'),
  members: {
    list: (tenantId: string) =>
      request<TenantMember[]>(
        `/api/acl/tenants/${encodeURIComponent(tenantId)}/members`,
      ),
    add: (tenantId: string, body: { userId: string; roleId: string }) =>
      request<unknown>(
        `/api/acl/tenants/${encodeURIComponent(tenantId)}/members`,
        { method: 'POST', body: JSON.stringify(body) },
      ),
    update: (
      tenantId: string,
      userId: string,
      body: { roleId: string },
    ) =>
      request<unknown>(
        `/api/acl/tenants/${encodeURIComponent(tenantId)}/members/${encodeURIComponent(userId)}`,
        { method: 'PUT', body: JSON.stringify(body) },
      ),
    remove: (tenantId: string, userId: string) =>
      request<unknown>(
        `/api/acl/tenants/${encodeURIComponent(tenantId)}/members/${encodeURIComponent(userId)}`,
        { method: 'DELETE' },
      ),
  },
  auditLog: (params?: {
    tenantId?: string;
    resource?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.tenantId) qs.set('tenantId', params.tenantId);
    if (params?.resource) qs.set('resource', params.resource);
    if (params?.action) qs.set('action', params.action);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const search = qs.toString();
    return request<AuditLogEntry[]>(`/api/acl/audit-log${search ? `?${search}` : ''}`);
  },
  impersonate: {
    start: (tenantId: string) =>
      request<unknown>('/api/acl/impersonate', {
        method: 'POST',
        body: JSON.stringify({ tenantId }),
      }),
    stop: () =>
      request<unknown>('/api/acl/impersonate', { method: 'DELETE' }),
  },
};

// ─── Modules ───

export interface Module {
  id: string;
  slug: string;
  name: string;
  apiBase: string;
}

export const modules = {
  list: () =>
    request<{ modules: Module[] }>('/api/modules'),
  get: (moduleId: string) =>
    request<Module>(`/api/modules/${encodeURIComponent(moduleId)}`),
};

// ─── Analyze ───

export interface AnalyzeJob {
  id: string;
  type: string;
  status: string;
  result?: {
    summary: string;
    tags: string[];
  };
}

export const analyze = {
  submit: (body: { text?: string; url?: string }) =>
    request<{ jobId: string; type: string; status: string }>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  list: () => request<AnalyzeJob[]>('/api/analyze'),
  get: (jobId: string) =>
    request<AnalyzeJob>(`/api/analyze/${encodeURIComponent(jobId)}`),
  file: async (jobId: string): Promise<Blob> => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(
      `/api/analyze/${encodeURIComponent(jobId)}/file`,
      { headers },
    );
    if (!res.ok) throw new ApiError(res.status, res.statusText);
    return res.blob();
  },
};

// ─── Platform ───

export interface PlatformHealth {
  status: string;
  database: { ok: boolean; latencyMs: number };
  nats: { ok: boolean; streams: unknown[] };
  workers: { total: number; online: number };
}

export const platform = {
  health: () => request<PlatformHealth>('/api/platform/health'),
  streams: () => request<unknown>('/api/platform/streams'),
  database: () => request<unknown>('/api/platform/database'),
  dlq: () => request<unknown[]>('/api/platform/dlq'),
};

// ─── Explorer ───

export interface EndpointDef {
  method: string;
  path: string;
  summary?: string;
  tags?: string[];
}

export interface CatalogSource {
  id: string;
  name: string;
  description: string;
  version?: string;
  endpoints: EndpointDef[];
}

export const explorer = {
  catalog: () => request<unknown>('/api/explorer/catalog'),
  register: (body: {
    id: string;
    name: string;
    description: string;
    version?: string;
    endpoints: EndpointDef[];
  }) =>
    request<unknown>('/api/explorer/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
