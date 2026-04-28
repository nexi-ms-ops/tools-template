# Surdej Chat Frontend Integration Plan

This checklist prepares the repository to integrate the Surdej chat frontend while keeping Surdej API as the backend of record. The current app already has token capture in `src/lib/auth.tsx`, an API client in `src/services/surdej-api.ts`, and a dashboard shell in `src/App.tsx`; the first implementation phase can start by extending those locations.

## Current repository connection points

| Responsibility | Existing location | Integration notes |
| --- | --- | --- |
| Token bootstrap and session storage | `src/lib/auth.tsx` | Reuse `surdej-token` query parameter capture and `sessionStorage` token for chat, blob, analysis, and MCP calls. |
| Shared Surdej API fetch helpers | `src/services/surdej-api.ts` | Extend the existing `ai`, `blobs`, `analyze`, `jobs`, `workers`, and future MCP/use-case service wrappers here before wiring UI components. |
| Authenticated app shell | `src/App.tsx` | Add route or shell state for the chat experience after `DashboardPage` verifies auth and health. |
| Styling and UI primitives | `src/index.css`, `components.json`, Tailwind/Vite config | Match imported chat components to the existing Tailwind/shadcn/ui setup. |
| Build validation | `package.json` | Use `npm run build` and `npm run typecheck` once dependency installation and existing TypeScript config issues are resolved. |

## Phase 1: Scaffold and API connection (ready to begin)

- [ ] Confirm the chat contract with the Surdej API team for `POST /api/ai/chat`, including request shape, streamed response format, auth header expectations, error envelopes, and cancellation behavior.
- [ ] Update `src/services/surdej-api.ts` with typed chat request/response models for messages, conversation IDs, model selection, tool calls, file references, and prompt template metadata.
- [ ] Decide whether the current `ai.stream` wrapper should target `POST /api/ai/chat` for SSE streaming or remain separate from chat; document and implement one canonical streaming entry point.
- [ ] Add API helpers for required file-analysis flow:
  - [ ] Upload file through `blobs.upload` / `POST /api/blobs`.
  - [ ] Attach returned blob IDs to chat messages or analysis requests.
  - [ ] Poll or subscribe to `analyze`/worker job status where the Surdej API requires asynchronous processing.
- [ ] Add API helpers for MCP/tool invocation once endpoint names are confirmed, keeping the wrapper in `src/services/surdej-api.ts` and returning typed tool-call state to the UI.
- [ ] Add the first chat route or view entry point in `src/App.tsx` without removing the existing health dashboard.
- [ ] Validate Phase 1 with a local mock or dev Surdej API token using the existing `?surdej-token=YOUR_TOKEN` flow.

## Phase 2: Frontend component reuse/adaptation

- [ ] Inventory Surdej frontend components to reuse or adapt:
  - [ ] `ChatPage` for full-screen conversation layout.
  - [ ] `QuickChat` for compact assistant entry points.
  - [ ] File upload/attachment controls for blob-backed analysis.
  - [ ] Message list, composer, streaming indicator, retry controls, and error states.
- [ ] Map imported components to repository code locations before copying:
  - [ ] Page-level chat container under `src/` and reachable from `src/App.tsx`.
  - [ ] Shared API calls through `src/services/surdej-api.ts` only.
  - [ ] Auth state through `src/lib/auth.tsx` only.
  - [ ] Styling through existing Tailwind classes and `src/index.css` tokens.
- [ ] Preserve accessibility and keyboard behavior for message composer, file picker, send/stop actions, and streamed updates.
- [ ] Add empty, loading, streaming, failed, retry, and token-expired UI states.

## Phase 3: Use Case selector and prompt template injection

- [ ] Define the Use Case API contract with Surdej, including endpoint names, template identifiers, allowed parameters, and tenant-specific availability.
- [ ] Add a service wrapper in `src/services/surdej-api.ts` for listing Use Cases/templates and resolving template defaults.
- [ ] Add a Use Case selector to the chat UI before message submission.
- [ ] Inject selected `promptTemplate` metadata into `POST /api/ai/chat` requests without exposing template internals in the browser beyond what the API returns.
- [ ] Persist selected Use Case per session only if product requirements allow it.
- [ ] Add validation for missing, disabled, or unauthorized templates.

## Phase 4: File analysis and worker-backed flows

- [ ] Define the lifecycle for uploaded files in the Surdej API/security requirements docs: accepted MIME types, maximum size, virus/security scanning status, retention, and deletion.
- [ ] Wire file uploads to `POST /api/blobs` through `blobs.upload` and include resulting blob references in chat or analysis requests.
- [ ] Display worker/job progress using existing `workers` and `jobs` wrappers or new typed helpers when the Surdej API exposes a dedicated analysis status endpoint.
- [ ] Surface analysis results in chat messages with clear provenance and retry/error handling.
- [ ] Ensure users can remove an attachment before send and that failed uploads do not submit chat messages.

## Phase 5: MCP/tool invocation

- [ ] Confirm the API endpoints and event payloads for MCP tool discovery, approval, invocation, progress, and final results.
- [ ] Model tool calls in chat messages, including pending approval, running, succeeded, failed, and cancelled states.
- [ ] Add UI affordances for tool approvals if the Surdej API requires human-in-the-loop confirmation.
- [ ] Route all tool calls through Surdej API wrappers rather than direct browser-to-tool connections.
- [ ] Log or surface correlation IDs for troubleshooting without exposing secrets or sensitive tool inputs.

## Phase 6: Environment and infrastructure prerequisites

- [ ] Document required runtime configuration for the frontend host, API base path/proxy, and Surdej token delivery.
- [ ] Confirm CORS, SameSite/cookie strategy if tokens move away from query parameters, and HTTPS requirements for file upload and SSE.
- [ ] Confirm deployment base path compatibility with `vite.config.ts` (`/tools-template/` in GitHub Actions, `/` locally).
- [ ] Add environment variables only when needed; do not hardcode API hosts, tenant IDs, model IDs, or tokens.
- [ ] Define observability expectations for chat request IDs, streaming disconnects, upload failures, worker failures, and MCP tool errors.

## Phase 7: Validation and rollout

- [ ] Add unit tests around any new API request builders, especially SSE parsing, prompt template injection, and file-reference payloads.
- [ ] Add component tests or manual QA coverage for send, stream, stop, retry, upload, Use Case selection, and tool-call states once a test framework exists in the repository.
- [ ] Run `npm run typecheck` and `npm run build` before merging implementation work.
- [ ] Validate against a Surdej dev/staging API with a non-production token.
- [ ] Roll out behind a feature flag or route-level toggle if product owners require gradual enablement.
- [ ] Capture screenshots or recordings for full chat, QuickChat, file upload, and tool invocation paths during UI review.

## Open questions to resolve before implementation

- [ ] What is the authoritative Surdej implementation recipe URL/checklist for this repository to track?
- [ ] Is `POST /api/ai/chat` both the standard and SSE streaming endpoint, or should streaming continue to use a separate endpoint?
- [ ] Which API endpoints expose Use Cases and prompt templates?
- [ ] Which API endpoints expose MCP tool discovery and invocation?
- [ ] Are chat conversation IDs and history persisted by Surdej API or by this frontend shell?
- [ ] What file size/type limits and retention policy apply to blob uploads?
