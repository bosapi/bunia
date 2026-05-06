# Bosia — Roadmap

> Track what's done, what's next, and where we're headed.
> Current version: **0.4.0**

---

> Severity: 🔴 Critical · 🟠 Major · 🟡 Minor · ⚪ Trivial

---

## Completed (v0.0.1 – v0.1.26)

<details>
<summary>Click to expand completed items</summary>

### Core Framework

- [x] 🔴 SSR with Svelte 5 Runes (`$props`, `$state`)
- [x] 🔴 File-based routing (`+page.svelte`, `+layout.svelte`, `+server.ts`)
- [x] 🟠 Dynamic routes (`[param]`) and catch-all routes (`[...rest]`)
- [x] 🟡 Route groups (`(group)`) for layout grouping
- [x] 🟠 API routes — `+server.ts` with HTTP verb exports
- [x] 🟠 Error pages — `+error.svelte`

### Data Loading

- [x] 🔴 Plain `export async function load()` pattern (no wrapper)
- [x] 🟠 `$types` codegen — auto-generated `PageData`, `PageProps`, `LayoutData`, `LayoutProps`
- [x] 🟠 `parent()` data threading in layouts
- [x] 🟠 Streaming SSR for metadata (non-blocking `load()`)
- [x] 🟠 Form actions (SvelteKit-style)

### Server

- [x] 🔴 ElysiaJS HTTP server
- [x] 🟡 Gzip compression
- [x] 🟡 Static file caching (Cache-Control headers)
- [x] 🟡 `/_health` endpoint
- [x] 🟠 Cookie support (`cookies.get`, `cookies.set`, `cookies.delete`)
- [x] 🟠 Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- [x] 🟠 Graceful shutdown handler (SIGTERM/SIGINT)
- [x] 🟠 `.env` file support with `$env` virtual module
- [x] 🟡 CORS configuration (framework-level)
- [x] 🟠 Session-aware fetch (cookies forwarded in internal API calls)
- [x] 🟡 Request timeouts on `load()` and `metadata()` functions
- [x] 🟠 Route PUT/PATCH/DELETE through `handleRequest()` — consistent CSRF, CORS, security headers, and cookie handling
- [x] 🟠 Graceful shutdown drain — drain in-flight requests before stopping; return 503 from health check during shutdown
- [x] 🟡 Concurrent build guard in dev — prevent overlapping builds when rapid file changes trigger `buildAndRestart()` while a build is already running
- [x] 🟡 Clean dev server shutdown — release `Bun.serve`, file watchers, and timers on SIGINT so the event loop drains naturally; outer `bun run` reports exit 0 instead of 130

### Security

- [x] 🔴 XSS escaping in HTML templates — sanitize `JSON.stringify()` output in `<script>` tags
- [x] 🔴 SSRF validation on `/__bosia/data/` — validate route path segment
- [x] 🔴 CSRF protection — Origin/Referer header validation for state-changing requests
- [x] 🟠 Strip stack traces from error responses in production
- [x] 🟠 Request body size limits
- [x] 🔴 Path traversal protection — validate static/prerendered file paths stay within allowed directories
- [x] 🟡 Cookie parsing error recovery — wrap `decodeURIComponent()` in try-catch
- [x] 🟡 Cookie option validation — whitelist/validate `domain`, `path`, `sameSite` values
- [x] 🟠 `PUBLIC_` env scoping — only expose vars declared in `.env` files
- [x] 🟠 Streaming error safety — validate route match before creating stream
- [x] 🟡 `safeJsonStringify` crash guard — try-catch for circular reference protection
- [x] 🟠 Open redirect validation on `redirect()`
- [x] 🟡 Cookie RFC 6265 validation — validate names against HTTP token spec; use `encodeURIComponent` only for values

### Client

- [x] 🔴 Client-side hydration
- [x] 🔴 SPA router (client-side navigation)
- [x] 🟡 Navigation progress bar
- [x] 🟠 HMR via SSE in dev mode
- [x] 🟡 Per-page CSR opt-out (`export const csr = false`)
- [x] 🟡 Link prefetching — `data-bosia-preload` attribute for hover/viewport prefetch
- [x] 🟠 Fix client-side navigation with query strings/hashes
- [x] 🟡 Use `insertAdjacentHTML` for head injection — prevents re-parsing `<head>`, avoiding duplicate stylesheets and script re-execution

### Build & Tooling

- [x] 🔴 Bun build pipeline (client + server bundles)
- [x] 🟠 Manifest generation (`dist/manifest.json`)
- [x] 🟠 Static route prerendering (`export const prerender = true`)
- [x] 🟠 Tailwind CSS v4 integration
- [x] 🟠 `$lib` alias → `src/lib/*`
- [x] 🟡 `bosia:routes` virtual module
- [x] 🟡 Validate Tailwind CSS binary exists before build
- [x] 🟡 Prerender fetch timeout
- [x] 🟡 Fix `withTimeout` timer leak
- [x] ⚪ Remove duplicate static file serving
- [x] 🟠 Static site output — merge prerendered HTML + client assets + public into `dist/static/` for static hosting
- [x] 🟡 Validate `.env` variable names — reject invalid identifiers that break codegen
- [x] 🟡 `.env` parser escape sequence support — handle `\n`, `\"`, etc. in quoted values

### Routing

- [x] 🟠 Dynamic route prerendering with `entries()` export — enumerate dynamic route params for static prerendering

### CLI

- [x] 🔴 `bosia dev` — dev server with file watching
- [x] 🔴 `bosia build` — production build
- [x] 🔴 `bosia start` — production server
- [x] 🟠 `bosia create` — scaffold new project (with `--template` flag and interactive picker)
- [x] 🟠 `bosia add` — registry-based UI component installation
- [x] 🟠 `bosia feat` — registry-based feature scaffolding
- [x] 🟡 `bosia add` index-based path resolution — resolves component names from `index.json` instead of blindly prefixing `ui/`
- [x] 🟡 `bosia feat` nested feature dependencies — `features` field in meta.json for recursive installation
- [x] 🟡 `bosia feat` overwrite prompt — asks before replacing existing files

### Templates & Features

- [x] 🟠 `todo` template (formerly `drizzle`) — PostgreSQL + Drizzle ORM with full CRUD todo demo
- [x] 🟠 `drizzle` feature — `bosia feat drizzle` scaffolds DB connection, schema aggregator, migrations dir, seed runner
- [x] 🟠 `todo` feature — `bosia feat todo` scaffolds todo schema, repository, service, routes, components, and seed data
- [x] 🟡 `todo` component — `bun x bosia@latest add todo` installs todo-form, todo-item, todo-list components
- [x] 🟡 Registry as single source of truth — `bosia create --template todo` installs features from registry via `template.json` instead of duplicating files

### Hooks & Middleware

- [x] 🟠 `hooks.server.ts` with `Handle` interface
- [x] 🟡 `sequence()` helper for composing middleware
- [x] 🟠 `RequestEvent` — `request`, `params`, `url`, `cookies`, `locals`

### Docs & Ecosystem

- [x] 🟠 Documentation site (Astro Starlight) — 14 pages
- [x] 🟡 Indonesian (Bahasa Indonesia) translation with Starlight i18n
- [x] 🟡 Deployment guides (Docker, Railway, Fly.io)
- [x] 🟠 GitHub Actions for auto-publishing to npm and deploying docs
- [x] 🟡 Dev server auto-restart on crash
- [x] 🟡 Components documentation page with usage examples and prop tables
- [x] 🟡 Interactive component previews in docs — live Svelte demos (button, badge, input, separator, avatar, card, dropdown-menu)
- [x] 🟡 Nested registry structure for `todo` components — subfolder pattern matching `ui/`, with group install (`bun x bosia@latest add todo`) and individual install (`bun x bosia@latest add todo/todo-form`)
- [x] 🟡 Nested docs sidebar — UI and Todo as sub-groups under Components
- [x] 🟠 SEO infrastructure — `Metadata` type supports `lang` and `link` fields; dynamic `<html lang>`; `<link>` tag rendering in streaming SSR
- [x] 🟡 Docs SEO — OG tags, Twitter cards, canonical URLs, hreflang alternates on all pages
- [x] 🟡 `robots.txt` and `sitemap.xml` generation for docs site

### v0.1.0

- [x] 🟡 Rename framework from `bosbun` to `bosia`
- [x] ⚪ Dead code cleanup (`renderSSR`, `buildHtmlShell`, unexported internals)
- [x] 🟡 `splitCsvEnv` helper for CSRF/CORS origin parsing

</details>

---

## v0.2.0 — Production Hardening

> Stability, security, and performance improvements for production workloads.

### Security

- [x] Cookie secure defaults — default `HttpOnly; Secure; SameSite=Lax` on `cookies.set()` with opt-out
- [x] Auto-detect `Cache-Control` on `/__bosia/data/` — `private, no-cache` when cookies accessed; `public, max-age=0, must-revalidate` otherwise
- [x] 🔴 `load()` `fetch` cookie scoping — `makeFetch` now forwards the `Cookie` header only to same-origin requests or origins in the `INTERNAL_HOSTS` allowlist; third-party hosts get no cookie. User-supplied `init.headers.cookie` is preserved
- [ ] 🟠 Trusted proxy configuration — `TRUST_PROXY` env to control when `X-Forwarded-*` headers are trusted in CSRF checks
- [ ] 🟠 `allowExternal` redirect validation — still validate against `javascript:`, `data:`, `vbscript:` schemes even when `allowExternal: true`
- [ ] 🟠 CSP nonce infrastructure — per-request nonce generation, inject into all framework `<script>` tags, expose nonce in hooks for user scripts
- [ ] 🟡 CORS preflight validation — validate requested method/headers against allowed config
- [ ] 🟡 CORS `Vary: Origin` on all responses when CORS is configured — prevent CDN caching bugs on non-matching origins
- [ ] 🟡 Validate prerender `entries()` return values — sanitize path segments before URL substitution
- [x] 🟡 Escape `lang` attribute in HTML shell — `<html lang="${lang}">` injects `lang` raw; if a `metadata()` derives `lang` from URL/user input it can break out of the attribute
- [x] ⚪ Validate `CORS_MAX_AGE` env — reject non-numeric values instead of producing `NaN` header

### Performance

- [x] 🟠 Parallelize client + server builds — run both `Bun.build()` calls with `Promise.all()` instead of sequentially (~500-1000ms savings)
- [x] 🟠 Parallelize Tailwind CSS with builds — run Tailwind CLI concurrently with client+server builds (~500-800ms savings); ensure output exists before manifest step
- [x] 🟡 Convert `sequence()` middleware recursion to loop — `apply(i+1, e)` pattern risks stack overflow with many handlers; use iterative approach

### Server Reliability

- [x] 🟠 Stream backpressure handling — check `controller.desiredSize` to prevent memory buildup on slow/disconnected clients
- [x] 🟠 Streaming SSR error recovery — render proper error page instead of bare `<p>Internal Server Error</p>` when `render()` throws mid-stream
- [x] 🟠 `renderPageWithFormData` loader error handling — currently does not catch `HttpError`/`Redirect` thrown from `loadRouteData()` after a successful form action; let them surface as proper redirect/error responses instead of crashing the request
- [x] 🟡 Prerender process cleanup — proper signal handling, verified termination (`await child.exited` after `kill()`), use random port instead of hardcoded 13572
- [x] 🟡 Fix `buildAndRestart` recursive tail call — replace recursion with `while` loop to prevent stack growth under rapid file changes

### Client

- [x] 🟡 Bound prefetch cache size — `prefetchCache` grows unbounded between navigations; add LRU eviction (max ~50 entries)
- [x] 🟡 Prefetch cache TTL — stale prefetch data served after long idle; discard entries older than 30s on `consumePrefetch()`
- [x] 🟠 Router click handler must respect modifier/middle clicks — `router.svelte.ts` currently SPA-navigates on Cmd/Ctrl/Shift/Alt+click and middle-click, breaking "open in new tab/window". Bail when `e.button !== 0`, any modifier key is held, `e.defaultPrevented`, or anchor has `rel="external"`

### Build

- [x] 🟡 Fail build on tsconfig.json corruption — don't silently continue with degraded config
- [x] 🟡 `compress()` threshold uses character count not byte count — `body.length` on a UTF-8 string under-counts multi-byte content; switch to `Buffer.byteLength` or `TextEncoder().encode(...).length` before threshold check
- [x] 🟡 `.env` parser inline-comment stripping — `KEY="value" # note` currently keeps ` # note` as part of the value; strip trailing comment after the closing quote
- [x] ⚪ Tune gzip compression threshold — raised to 2KB (`GZIP_MIN_BYTES = 2048`); small responses fit in single TCP packet, gzip overhead outweighs savings below this size

### DX

- [ ] 🟠 Dev proxy must forward `X-Forwarded-Host` / `X-Forwarded-Proto` to the inner app server — without them the inner CSRF check derives `expectedOrigin = http://localhost:APP_PORT` while the browser's `Origin` is `http://localhost:DEV_PORT`, causing same-origin POST/form actions to 403 in dev
- [x] 🟡 Stale env cleanup in dev — reset removed `.env` vars on hot-reload

---

## v0.2.1 — Features & DX

> New capabilities and developer experience improvements.

### Data Loading

- [ ] 🟠 `depends()` and `invalidate()` — selective data reloading
- [ ] 🟡 `setHeaders()` in load functions — set response headers from loaders

### Navigation

- [ ] 🟠 `beforeNavigate` / `afterNavigate` lifecycle hooks
- [ ] 🟠 Scroll restoration and snapshot support (`export const snapshot`)

### Routing

- [ ] 🟠 Layout reset (`+layout@.svelte` or `+page@.svelte`)
- [x] 🟠 Route-level `+error.svelte` — per-layout error boundaries instead of global-only
- [x] 🟡 Page option: `ssr` toggle (`export const ssr = false`)
- [x] 🟡 Page option: `trailingSlash` configuration

### Forms

- [x] 🟠 `use:enhance` progressive enhancement — client-side fetch submission with automatic form state management (like SvelteKit)

### Types

- [x] 🟠 Typed route params — generate `{ slug: string }` from `[slug]` instead of `Record<string, string>`
- [x] 🟡 Error page types in generated `$types.d.ts`

### Server

- [ ] 🟡 Structured logging with request correlation IDs

### DX

- [ ] 🟡 Cache route scanning in dev mode — skip `fs.readdirSync()` re-scan when changed file is not a route file (`+page`/`+layout`/`+server`/`+error`)
- [ ] 🟡 Remove hardcoded 200ms SSE delay — poll `/_health` instead of `Bun.sleep(200)` before broadcasting reload
- [ ] 🟡 Smarter dev rebuild triggers — filter watcher by extension; skip rebuilds for `.md`, test files, and non-source changes

---

## v0.2.2 — Ecosystem, Observability & Scale

> Nice-to-haves for a growing framework and performance at scale.

- [ ] 🟡 Production sourcemaps — external source maps for debuggable production errors

### Performance (at scale)

- [x] 🟠 Request deduplication — deduplicate concurrent identical GET requests to same route; share in-flight loader promise instead of running twice. Scope dedup key by route+params (exclude user-specific loaders). Reworked in 0.3.1 around a folder convention: dedup ON by default keyed on URL only; per-user routes opt out by living under `(private)`
- [x] 🔴 Dedup key cross-user data leak — replaced cookie-fingerprint identity with a folder convention. Routes under any `(private)` group folder skip dedup entirely and run per-request; all other routes are deduped on URL alone. Apps with per-user content must place routes under `(private)` (dashboards, carts, settings) or User B will receive User A's loader result. See `docs/guides/request-deduplication.md` for safety rules
- [ ] 🟡 Trie-based route matcher — replace linear O(n) route scan with radix trie for O(k) matching (k = URL segments). Matters when route count exceeds ~100
- [x] 🟡 Compiled route regex — pre-compile route patterns to `RegExp` at startup instead of parsing on every match

---

## v0.2.3 — CLI & Feature Installer

> Per-file install strategies so features can safely contribute to shared files.

### CLI / Feat

- [x] 🟠 `bosia feat` per-file strategies — `meta.json` `files: FileEntry[]` with `strategy` field: `write` (default), `skip-if-exists`, `append-line`, `append-block`, `merge-json`. Replaces all-or-nothing replace prompt for shared files like `src/features/drizzle/schemas.ts`
- [ ] 🟡 Document `meta.json` schema and strategies in `docs/` (CLI / `bosia feat` page)
- [ ] 🟡 `bosia feat <name> --dry-run` — preview file actions (write/skip/append/merge) without touching disk
- [ ] 🟡 Validation: error early when two installed features write to the same target with `write` strategy (force one to declare append-line/append-block)
- [ ] 🟠 `auth` feature scaffold — uses `append-block` to register hooks in `src/hooks.server.ts` and routes barrel
- [ ] 🟡 `s3` / `storage` feature — bucket client + upload route using new strategies
- [ ] 🟡 Track installed features per project (`.bosia/installed.json`) — enable `bosia feat list` and uninstall

---

## v0.3.0 — Test Integration (Phase 1 + 2)

> Built-in testing powered by `bun test`. See [TEST_PLAN.md](backup/TEST_PLAN.md) for full details.

### DX

- [x] 🟡 Prettier formatting — root config + scripts (`format`, `format:check`); all 3 templates ship matching `.prettierrc.json` so scaffolded projects format-on-create. Pre-commit hook auto-formats staged files. No lint.

### CLI

- [x] 🟠 `bosia test` command — wraps `bun test` with framework-aware defaults
- [x] 🟡 Auto-load `.env.test` (fallback `.env`) before running tests
- [x] 🟡 Set `BOSIA_ENV=test` automatically
- [x] 🟡 Pass through flags (`--watch`, `--coverage`, `--bail`, `--timeout`, etc.)
- [x] 🟡 Unit tests for core pure utilities (`matcher`, `cookies`, `csrf`, `cors`, `errors`, `html`, `dedup`, `env`)
- [x] 🟡 Unit tests for build/codegen helpers (`scanner`, `routeTypes`, `envCodegen`, `hooks.sequence`, `paths.resolveBosiaBin`, `lib/utils.cn`, `cli/registry.mergePkgJson`, `prerender` path/URL helpers)

### Test Utilities (`bosia/testing`)

- [ ] 🟠 `createRequestEvent()` — mock factory for testing `+server.ts` handlers and hooks
- [ ] 🟠 `createLoadEvent()` — mock factory for testing `load()` functions
- [ ] 🟡 `createMetadataEvent()` — mock factory for testing `metadata()` functions
- [ ] 🟠 `mockCookies()` — in-memory cookie jar implementing `Cookies` interface
- [ ] 🟡 `mockFetch()` — fetch interceptor for isolating loaders
- [ ] 🟡 `createFormData()` — helper for building form action payloads

---

## v0.3.1 — Route & API Integration Testing (Phase 3)

> Test routes end-to-end without starting a real server.

- [ ] 🟠 `createTestApp()` — build an in-process Elysia instance from the route manifest
- [ ] 🟠 `testRequest()` — send HTTP requests to the test app, get standard `Response` back
- [ ] 🟠 Support API routes, page routes (SSR HTML), and form actions
- [ ] 🟡 Response assertion helpers: `expectJson()`, `expectRedirect()`, `expectHtml()`

---

## v0.3.2 — Component Testing (Phase 4)

> Render and assert on Svelte 5 components in tests.

- [ ] 🟠 `renderComponent(Component, { props })` — SSR render a component, return HTML
- [ ] 🟠 `renderPage(route, options?)` — full SSR pipeline (loader → layout → page)
- [ ] 🟡 Snapshot testing support (built into `bun test`)
- [ ] 🟡 Investigate `@testing-library/svelte` compatibility with Bun

---

## v0.4.0 — Plugin Core

> First-party plugin system. Standardize OpenAPI / OpenTelemetry / server-timing as plugins; let third parties drop in any Elysia plugin. Full design in `plans/plugin-feature.md`.

### Config & Types

- [x] 🔴 `bosia.config.ts` loader — `packages/bosia/src/core/config.ts`; resolve from `process.cwd()`, compile via `Bun.build({ target: "bun" })`, cache, default to `{ plugins: [] }`
- [x] 🔴 Public types in `packages/bosia/src/lib/index.ts` — `BosiaPlugin`, `BosiaConfig`, `BuildContext`, `DevContext`, `RenderContext`, `defineConfig` helper

### Elysia Hooks

- [x] 🔴 `backend.before` / `backend.after` mount points in `server.ts` — `before` runs raw routes (e.g. `/openapi.json`) bypassing framework middleware; `after` receives `RouteManifest` for introspection

### Build Hooks

- [x] 🟠 `build.preBuild` / `build.postScan` / `build.postBuild` in `build.ts` — call `preBuild` before `loadEnv`, `postScan` after `scanRoutes()`, `postBuild` after `generateStaticSite()`
- [x] 🟠 `build.bunPlugins(target)` merged into client + server `Bun.build()` plugin arrays

### Render Hooks

- [x] 🟠 `render.head` fragments injected before `</head>` in `buildMetadataChunk`
- [x] 🟠 `render.bodyEnd` fragments injected before `</body>` in `buildHtmlTail`
- [x] 🟠 `RenderContext` (request, route, metadata) threaded from `renderer.ts` into `html.ts` builders

### First-Party Plugin

- [x] 🟠 `bosia/plugins/server-timing` — exercises `backend.before`; adds `Server-Timing: handler;dur=...` header

### Docs & Demo

- [x] 🟡 `docs/content/docs/guides/plugins.md` — usage guide
- [x] 🟡 `apps/demo/bosia.config.ts` — server-timing wired

---

## v0.4.1 — OpenAPI Plugin

> Auto-bridge file routes to OpenAPI spec.

- [ ] 🟠 `bosia/plugins/openapi` first-party plugin
- [ ] 🟠 `build.postScan` reads `RouteManifest`, emits `dist/openapi.json`
- [ ] 🟠 Runtime mount via `backend.before` — `GET /openapi.json`, `GET /docs` (Scalar/Swagger UI)
- [ ] 🟡 Optional `schema` export on `+server.ts` (TypeBox or Zod, decide later)
- [ ] 🟡 Docs: OpenAPI usage page

---

## v0.4.2 — OpenTelemetry Plugin

> Tracing + metrics for production apps.

- [ ] 🟠 `bosia/plugins/opentelemetry` first-party plugin
- [ ] 🟠 OTLP exporter config via env vars (`OTEL_EXPORTER_OTLP_ENDPOINT`, etc.)
- [ ] 🟠 Trace `backend.before` request → response, `load()` calls, render time
- [ ] 🟡 Verify `dev` parity — telemetry must work in `bosia dev`

---

## v0.4.1 — Inspector Plugin ✅ (shipped 2026-05-06)

> Click element in browser → open exact source file:line in editor / hand off to AI agent. No Vite, no React-style fiber tree — does it via compile-time attribute injection.

### Compile-Time

- [x] 🟠 `bosia/plugins/inspector` first-party plugin (dev-only)
- [x] 🟠 Contributes Bun plugin via `build.bunPlugins()` — runs before `SveltePlugin()` and replaces its `.svelte` `onLoad` with an injecting variant
- [x] 🟠 Parses `.svelte` source with `svelte/compiler` `parse()`, walks `RegularElement` nodes, injects `data-bosia-loc="<relpath>:<line>:<col>"` via `magic-string` (preserves source maps)
- [x] 🟡 Skips `<svelte:*>` and component (capitalized) tags
- [x] 🟡 Strips attribute from production builds (no-op when not dev)

### Runtime Overlay

- [x] 🟠 Dev-only client overlay injected via `render.bodyEnd` — alt+hover highlights element, alt+click captures `data-bosia-loc`
- [x] 🟠 `POST /__bosia/locate` endpoint (mounted via `backend.before`) — receives `{ file, line, col }`, opens editor (or POSTs to `aiEndpoint` with comment)
- [x] 🟡 Editor integration — `code -g file:line` (configurable via `inspector({ editor: "code" | "cursor" | "zed" })`)
- [x] 🟡 Toast feedback — overlay shows "opened <file>:<line>" on click

### Docs

- [x] 🟡 `docs/content/docs/guides/inspector.md` — usage + AI-agent workflow

---

## v0.5.0 — Full Plugin Lifecycle

> Complete the plugin surface; uninstall + virtual modules.

- [ ] 🟠 `dev.onStart` + `dev.onFileChange` wired in `dev.ts`
- [ ] 🟠 `client.onHydrate` + `client.onNavigate` in `core/client/hydrate.ts` + `router.svelte.ts`
- [ ] 🟠 Virtual modules from plugins — extend `core/plugin.ts` resolver pattern
- [ ] 🟡 Plugin uninstall via `bosia feat`
- [ ] 🟡 Docs: full plugin authoring guide

---

## v0.6.0 — E2E Testing & Docs (Phase 5 + 6)

> Full browser testing with Playwright + comprehensive test docs.

- [ ] 🟠 `startTestServer()` — spin up a real Bosia server on a random port for E2E
- [ ] 🟠 `bosia test --e2e` — auto-launch Playwright with the server
- [ ] 🟡 Playwright config template in `bosia create` scaffolding
- [ ] 🟡 Test file examples in project templates
- [ ] 🟡 `bosia feat test` scaffolder for generating test files
- [x] 🟠 Docs: testing guide for end-user apps using `bun test` (unit-level; integration/component/E2E pending utilities)

---

## Not Planned

Intentional omissions — out of scope for the framework:

- `+page.ts` / `+layout.ts` universal load (decided against)
- Image optimization (infrastructure concern)
- i18n (user's responsibility)
- Rate limiting (reverse proxy concern)
- Adapter system (intentionally tied to Bun + Elysia)
- Service worker tooling (out of scope)
