---
title: Testing
description: Tulis dan jalankan tes di aplikasi Bosia Anda dengan bun test.
---

Aplikasi Bosia menggunakan [`bun test`](https://bun.sh/docs/cli/test) — test runner bawaan Bun. Tanpa konfigurasi tambahan, tanpa dependensi tambahan.

## Menjalankan Tes

Dari root proyek Anda:

```bash
bun test
```

Flag umum:

```bash
bun test --watch         # jalankan ulang saat file berubah
bun test --coverage      # cetak laporan coverage
bun test --bail          # berhenti pada kegagalan pertama
bun test --timeout 10000 # timeout per-tes dalam ms
bun test src/lib/foo.test.ts  # jalankan satu file
bun test src/lib              # jalankan satu direktori
```

## Penamaan File Tes

Bun otomatis menemukan file yang cocok dengan pola:

- `*.test.ts` / `*.test.tsx`
- `*.test.js` / `*.test.jsx`
- `*.spec.ts` / `*.spec.tsx`
- file apa pun di dalam folder `__tests__/`

Letakkan tes di samping kode yang diuji, atau di dalam `__tests__/`. Keduanya bekerja.

```
src/
├── lib/
│   ├── utils.ts
│   ├── utils.test.ts        # di samping source
│   └── __tests__/
│       └── helpers.test.ts  # di folder __tests__
```

## Menulis Tes

Gunakan `test`, `expect`, dan lifecycle hooks dari `bun:test`:

```ts
import { test, expect, describe, beforeEach } from "bun:test";
import { slugify } from "./utils.ts";

describe("slugify", () => {
	test("ubah ke huruf kecil dan ganti spasi", () => {
		expect(slugify("Hello World")).toBe("hello-world");
	});

	test("hapus tanda baca", () => {
		expect(slugify("Hello, World!")).toBe("hello-world");
	});
});
```

## Tambahkan Script Tes

Tambahkan script ke `package.json` agar `bun run test` bekerja:

```json
{
	"scripts": {
		"test": "bun test",
		"test:watch": "bun test --watch",
		"test:coverage": "bun test --coverage"
	}
}
```

## Variabel Lingkungan di Tes

`bun test` **tidak** otomatis memuat `.env.test` Bosia. Muat sendiri dengan file setup.

Buat `tests/setup.ts`:

```ts
import { loadEnvFile } from "node:process";

try {
	loadEnvFile(".env.test");
} catch {
	// .env.test bersifat opsional
}
```

Beri tahu Bun untuk menjalankannya sebelum setiap file tes dengan menambahkan ke `bunfig.toml`:

```toml
[test]
preload = ["./tests/setup.ts"]
```

Sekarang setiap file `*.test.ts` melihat variabel dari `.env.test`.

## Apa yang Diuji

Fokus pada logika murni yang tidak bergantung pada siklus request:

- Fungsi utilitas (formatter, validator, parser)
- Logika bisnis sisi server yang diekstrak dari `load()` / actions
- Logika komponen (state machine, derived values)

Helper khusus Bosia untuk menguji `load()`, form actions, API routes, dan rendering SSR penuh ada di [roadmap](../reference/roadmap) tetapi belum dirilis. Untuk saat ini, ekstrak logika ke fungsi biasa dan uji fungsi tersebut.

## Mode Watch

`bun test --watch` menjalankan ulang tes yang terdampak saat file disimpan — berguna saat pengembangan. Saat ini belum terintegrasi dengan `bosia dev`; jalankan di terminal terpisah.
