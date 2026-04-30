import { describe, expect, test } from "bun:test";
import { dedupKey } from "../src/core/dedup.ts";

function k(urlStr: string, headers: Record<string, string> = {}) {
	const url = new URL(urlStr);
	const req = new Request(urlStr, { headers });
	return dedupKey(url, req);
}

describe("dedupKey", () => {
	test("path-only for anonymous request", () => {
		expect(k("https://x.test/foo")).toBe("/foo");
	});

	test("strips trailing slash (non-root)", () => {
		expect(k("https://x.test/foo/")).toBe("/foo");
	});

	test("keeps root /", () => {
		expect(k("https://x.test/")).toBe("/");
	});

	test("sorts query params for stable key", () => {
		expect(k("https://x.test/p?b=2&a=1")).toBe(k("https://x.test/p?a=1&b=2"));
		expect(k("https://x.test/p?a=1&b=2")).toBe("/p?a=1&b=2");
	});

	test("authorization header changes identity", () => {
		const anon = k("https://x.test/p");
		const authed = k("https://x.test/p", { authorization: "Bearer abc" });
		expect(authed).not.toBe(anon);
		expect(authed.startsWith("/p|")).toBe(true);
	});

	test("authorization cookie changes identity", () => {
		const a = k("https://x.test/p", { cookie: "authorization=tokenA" });
		const b = k("https://x.test/p", { cookie: "authorization=tokenB" });
		expect(a).not.toBe(b);
	});

	test("same identity → same key", () => {
		const a = k("https://x.test/p", { authorization: "Bearer abc" });
		const b = k("https://x.test/p", { authorization: "Bearer abc" });
		expect(a).toBe(b);
	});

	test("non-auth cookies don't affect key", () => {
		const a = k("https://x.test/p", { cookie: "theme=dark" });
		const b = k("https://x.test/p");
		expect(a).toBe(b);
	});
});
