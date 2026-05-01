---
title: Deduplikasi Request
description: Gabungkan request identik yang bersamaan menjadi satu loader in-flight untuk memangkas pemanggilan DB dan API berlebih.
---

Ketika N pengguna bersamaan mengakses URL yang sama, Bosia menjalankan loader **sekali** dan membagikan hasilnya ke semua waiter. Response yang sudah selesai tidak di-cache — begitu promise resolve, request berikutnya menjalankan `load()` segar.

```
3 request bersamaan ke /blog/post-1
┌─────────────┐
│ request 1 ──┐
│ request 2 ──┼──► load() jalan sekali ──► hasil dibagi ke semua 3
│ request 3 ──┘
└─────────────┘
```

Ini **aktif secara default** untuk setiap route. Kunci dedup adalah URL: pathname + query string yang diurutkan. Tidak ada hashing identitas, tidak ada pembacaan cookie.

## Opt out: route per-user wajib pakai `(private)`

Berbagi hasil loader antar pengguna hanya aman ketika response tidak bergantung pada siapa yang meminta. Untuk konten per-user (dashboard, cart, settings, apa pun yang membaca `cookies` atau `locals.user`), route harus diletakkan di bawah folder grup `(private)`:

```
src/routes/
├── (public)/                 ← opsional, scope default-nya "public"
│   └── blog/
│       └── [slug]/
│           └── +page.server.ts   ← di-dedup
│
└── (private)/                ← turunan jalan per-request
    ├── dashboard/
    │   └── +page.server.ts       ← TIDAK di-dedup
    └── account/
        └── settings/
            └── +page.server.ts   ← TIDAK di-dedup
```

`(private)` dikenali di mana pun dalam rantai folder. Grup itu sendiri tidak muncul di URL (sama seperti `(group)` lainnya), jadi `routes/(private)/dashboard` melayani `/dashboard`.

:::danger[Lupa `(private)` membocorkan data antar pengguna.]
Route yang membaca cookies, sesi, atau data spesifik pengguna **wajib** berada di bawah `(private)`. Jika tidak, dua pengguna bersamaan yang mengakses URL yang sama berbagi satu hasil loader — pengguna kedua menerima data pengguna pertama.

Jika tidak yakin sebuah route sama untuk semua orang, tandai sebagai private.
:::

### Route yang WAJIB private

- `/dashboard`, `/account`, `/settings` — apa pun yang membaca sesi
- `/cart`, `/checkout` — state per-user
- Apa pun yang memanggil `cookies.get()`, `cookies.getAll()`, atau membaca `locals.user` di dalam `load()` / `metadata()`

### Route yang paling diuntungkan dari dedup (public)

- Halaman blog, halaman marketing, katalog produk
- Listing publik, dokumentasi, hasil pencarian tanpa konteks pengguna
- Apa pun yang dapat di-cache CDN dengan `Cache-Control: public`

## Contoh

```
✅ Bagus

routes/(public)/blog/[slug]/+page.server.ts
   load() baca dari CMS — hasil sama untuk semua orang, di-dedup
```

```
❌ Buruk

routes/dashboard/+page.server.ts
   load() baca cookies.get("session") — Pengguna B menerima data Pengguna A
```

```
✅ Bagus

routes/(private)/dashboard/+page.server.ts
   load() baca cookies.get("session") — jalan per-request, tidak bocor
```

## Batasan

- **Dedup hanya untuk concurrent.** Setelah promise selesai, entri dihapus dari in-flight map. Request berikutnya menjalankan loader lagi. Ini bukan TTL cache.
- **Loader route public sebaiknya deterministik berdasarkan URL.** Jika output loader bergantung pada `Date.now()`, randomness, atau state eksternal yang berubah di tengah jendela, setiap waiter melihat snapshot yang sama dari siapa pun yang memicu pemanggilan.
- **Cookie yang di-set di dalam loader yang di-dedup** hanya mengalir ke request yang memicunya. Waiter lain menerima body response tapi tidak header `Set-Cookie`. Jika loader public Anda mengeset cookie, tandai route sebagai `(private)`.
- Heuristik auto `Cache-Control` (`private, no-cache` saat cookie diakses) tetap berlaku di dalam blok dedup — jika loader yang mendasari membaca cookies, response setiap waiter ditandai private.
