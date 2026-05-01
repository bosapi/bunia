---
title: Request Deduplication
description: Coalesce concurrent identical requests into one in-flight loader to cut redundant DB and API calls.
---

When N concurrent users hit the same URL, Bosia runs the loader **once** and shares the result with every waiter. Settled responses are not cached — once the promise resolves, the next request runs `load()` fresh.

```
3 concurrent requests to /blog/post-1
┌─────────────┐
│ request 1 ──┐
│ request 2 ──┼──► load() runs once ──► result fans out to all 3
│ request 3 ──┘
└─────────────┘
```

This is **on by default** for every route. The dedup key is the URL: pathname + sorted query string. There is no identity hashing, no cookie reading.

## Opt out: per-user routes must use `(private)`

Sharing a loader result across users is only safe when the response does not depend on who is asking. For per-user content (dashboards, carts, settings, anything that reads `cookies` or `locals.user`), you must place the route under a `(private)` group folder:

```
src/routes/
├── (public)/                 ← optional, scope is "public" by default
│   └── blog/
│       └── [slug]/
│           └── +page.server.ts   ← deduped
│
└── (private)/                ← descendants run per-request
    ├── dashboard/
    │   └── +page.server.ts       ← NOT deduped
    └── account/
        └── settings/
            └── +page.server.ts   ← NOT deduped
```

`(private)` is recognized anywhere in the folder chain. The group itself is invisible in the URL (same as any `(group)`), so `routes/(private)/dashboard` serves `/dashboard`.

:::danger[Forgetting `(private)` leaks data across users.]
A route that reads cookies, sessions, or user-specific data **must** live under `(private)`. If it does not, two concurrent users hitting the same URL share one loader result — the second user receives the first user's data.

If you cannot prove a route is the same for everyone, mark it private.
:::

### Routes that MUST be private

- `/dashboard`, `/account`, `/settings` — anything reading the session
- `/cart`, `/checkout` — per-user state
- Anything calling `cookies.get()`, `cookies.getAll()`, or reading `locals.user` inside `load()` / `metadata()`

### Routes that benefit most from dedup (public)

- Blog posts, marketing pages, product catalogs
- Public listings, documentation, search results without user context
- Anything cacheable by a CDN with a `public` `Cache-Control`

## Examples

```
✅ Good

routes/(public)/blog/[slug]/+page.server.ts
   load() reads from a CMS — same result for everyone, deduped
```

```
❌ Bad

routes/dashboard/+page.server.ts
   load() reads cookies.get("session") — User B receives User A's data
```

```
✅ Good

routes/(private)/dashboard/+page.server.ts
   load() reads cookies.get("session") — runs per-request, no leak
```

## Limitations

- **Dedup is concurrent-only.** Once the promise settles, the entry is removed from the in-flight map. The next request runs the loader again. This is not a TTL cache.
- **Public-route loaders should be deterministic given the URL.** If the loader's output depends on `Date.now()`, randomness, or external state that changes mid-window, every waiter sees the same snapshot from whoever triggered the call.
- **Cookies set inside a deduped loader** flow only to the request that triggered it. Other waiters receive the response body but not the `Set-Cookie` headers. If your public loader sets cookies, mark the route `(private)`.
- The auto `Cache-Control` heuristic (`private, no-cache` when cookies were accessed) still applies inside the deduped block — if the underlying loader read cookies, every waiter's response is marked private.
