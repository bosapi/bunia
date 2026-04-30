import { describe, expect, test } from "bun:test";
import { compileRoutes, findMatch } from "../src/core/matcher.ts";

interface R {
	pattern: string;
}

function compile(patterns: string[]): R[] {
	return compileRoutes(patterns.map((pattern) => ({ pattern })));
}

describe("compileRoutes / findMatch — exact", () => {
	test("matches static route", () => {
		const routes = compile(["/about"]);
		const m = findMatch(routes, "/about");
		expect(m?.route.pattern).toBe("/about");
		expect(m?.params).toEqual({});
	});

	test("non-match returns null", () => {
		const routes = compile(["/about"]);
		expect(findMatch(routes, "/blog")).toBe(null);
	});

	test("root path matches", () => {
		const routes = compile(["/"]);
		const m = findMatch(routes, "/");
		expect(m?.route.pattern).toBe("/");
	});

	test("trailing slash stripped before match (non-root)", () => {
		const routes = compile(["/about"]);
		const m = findMatch(routes, "/about/");
		expect(m?.route.pattern).toBe("/about");
	});
});

describe("compileRoutes / findMatch — dynamic", () => {
	test("single dynamic segment", () => {
		const routes = compile(["/blog/[slug]"]);
		const m = findMatch(routes, "/blog/hello");
		expect(m?.params).toEqual({ slug: "hello" });
	});

	test("multiple dynamic segments", () => {
		const routes = compile(["/[org]/[repo]"]);
		const m = findMatch(routes, "/anthropic/claude");
		expect(m?.params).toEqual({ org: "anthropic", repo: "claude" });
	});

	test("dynamic with literal suffix", () => {
		const routes = compile(["/blog/[slug]/comments"]);
		const m = findMatch(routes, "/blog/hello/comments");
		expect(m?.params).toEqual({ slug: "hello" });
		expect(findMatch(routes, "/blog/hello")).toBe(null);
	});

	test("segment count must match", () => {
		const routes = compile(["/blog/[slug]"]);
		expect(findMatch(routes, "/blog/hello/extra")).toBe(null);
	});
});

describe("compileRoutes / findMatch — catch-all", () => {
	test("root catch-all", () => {
		const routes = compile(["/[...rest]"]);
		expect(findMatch(routes, "/a/b/c")?.params).toEqual({ rest: "a/b/c" });
		expect(findMatch(routes, "/")).toBe(null);
	});

	test("prefixed catch-all", () => {
		const routes = compile(["/docs/[...rest]"]);
		expect(findMatch(routes, "/docs/a/b")?.params).toEqual({ rest: "a/b" });
		expect(findMatch(routes, "/other/x")).toBe(null);
	});
});

describe("compileRoutes / findMatch — escaping & priority", () => {
	test("regex special chars in literal segment treated literally", () => {
		const routes = compile(["/foo.bar"]);
		const m = findMatch(routes, "/foo.bar");
		expect(m?.route.pattern).toBe("/foo.bar");
		expect(findMatch(routes, "/fooXbar")).toBe(null);
	});

	test("first match wins (caller pre-sorts exact → dynamic → catch-all)", () => {
		const routes = compile(["/about", "/[slug]", "/[...rest]"]);
		expect(findMatch(routes, "/about")?.route.pattern).toBe("/about");
		expect(findMatch(routes, "/contact")?.route.pattern).toBe("/[slug]");
		expect(findMatch(routes, "/a/b")?.route.pattern).toBe("/[...rest]");
	});
});
