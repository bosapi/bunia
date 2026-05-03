---
title: Testing
description: Write and run tests in your Bosia app with bun test.
---

Bosia apps use [`bun test`](https://bun.sh/docs/cli/test) — Bun's built-in test runner. No extra config, no extra dependencies.

## Running Tests

From your project root:

```bash
bun test
```

Common flags:

```bash
bun test --watch         # re-run on file change
bun test --coverage      # print coverage report
bun test --bail          # stop on first failure
bun test --timeout 10000 # per-test timeout in ms
bun test src/lib/foo.test.ts  # run a single file
bun test src/lib              # run a directory
```

## Test File Naming

Bun automatically discovers files matching:

- `*.test.ts` / `*.test.tsx`
- `*.test.js` / `*.test.jsx`
- `*.spec.ts` / `*.spec.tsx`
- any file inside a `__tests__/` folder

Place tests next to the code they cover, or under `__tests__/`. Both work.

```
src/
├── lib/
│   ├── utils.ts
│   ├── utils.test.ts        # next to source
│   └── __tests__/
│       └── helpers.test.ts  # in __tests__ folder
```

## Writing a Test

Use `test`, `expect`, and the lifecycle hooks from `bun:test`:

```ts
import { test, expect, describe, beforeEach } from "bun:test";
import { slugify } from "./utils.ts";

describe("slugify", () => {
	test("lowercases and replaces spaces", () => {
		expect(slugify("Hello World")).toBe("hello-world");
	});

	test("strips punctuation", () => {
		expect(slugify("Hello, World!")).toBe("hello-world");
	});
});
```

## Add Test Scripts

Add scripts to your `package.json` so `bun run test` works:

```json
{
	"scripts": {
		"test": "bun test",
		"test:watch": "bun test --watch",
		"test:coverage": "bun test --coverage"
	}
}
```

## Environment Variables in Tests

`bun test` does **not** auto-load Bosia's `.env.test`. Load it yourself with a setup file.

Create `tests/setup.ts`:

```ts
import { loadEnvFile } from "node:process";

try {
	loadEnvFile(".env.test");
} catch {
	// .env.test is optional
}
```

Tell Bun to run it before each test file by adding to `bunfig.toml`:

```toml
[test]
preload = ["./tests/setup.ts"]
```

Now any `*.test.ts` file sees variables from `.env.test`.

## What to Test

Focus on pure logic that doesn't depend on the request lifecycle:

- Utility functions (formatters, validators, parsers)
- Server-side business logic extracted from `load()` / actions
- Component logic (state machines, derived values)

Bosia-specific helpers for testing `load()`, form actions, API routes, and full SSR rendering are on the [roadmap](../reference/roadmap) but not yet shipped. For now, extract logic into plain functions and test those.

## Watch Mode

`bun test --watch` re-runs affected tests on file save — useful while developing. It does not currently integrate with `bosia dev`; run them in separate terminals.
