import { describe, expect, test } from "bun:test";
import {
	safeJsonStringify,
	escapeHtml,
	escapeAttr,
	isStaticPath,
	safeLang,
} from "../src/core/html.ts";

describe("safeJsonStringify", () => {
	test("escapes <, >, & for script-context safety", () => {
		const out = safeJsonStringify({ x: "</script><script>alert(1)" });
		expect(out).not.toContain("</script>");
		expect(out).toContain("\\u003c");
		expect(out).toContain("\\u003e");
	});

	test("escapes ampersand", () => {
		expect(safeJsonStringify("a&b")).toContain("\\u0026");
	});

	test("escapes U+2028 and U+2029", () => {
		const out = safeJsonStringify("a\u2028b\u2029c");
		expect(out).toContain("\\u2028");
		expect(out).toContain("\\u2029");
	});

	test("survives circular reference", () => {
		const a: any = {};
		a.self = a;
		const original = console.error;
		console.error = () => {};
		try {
			expect(safeJsonStringify(a)).toBe("null");
		} finally {
			console.error = original;
		}
	});
});

describe("escapeHtml", () => {
	test("escapes & < >", () => {
		expect(escapeHtml("a & <b> c")).toBe("a &amp; &lt;b&gt; c");
	});
});

describe("escapeAttr", () => {
	test("escapes & < > and double-quote", () => {
		expect(escapeAttr(`"a"<b>&c`)).toBe("&quot;a&quot;&lt;b&gt;&amp;c");
	});
});

describe("isStaticPath", () => {
	test("dist + __bosia paths", () => {
		expect(isStaticPath("/dist/client/x.js")).toBe(true);
		expect(isStaticPath("/__bosia/sse")).toBe(true);
	});

	test("static extensions", () => {
		expect(isStaticPath("/foo.css")).toBe(true);
		expect(isStaticPath("/foo.js")).toBe(true);
		expect(isStaticPath("/img/logo.png")).toBe(true);
		expect(isStaticPath("/favicon.ico")).toBe(true);
	});

	test("non-static paths", () => {
		expect(isStaticPath("/about")).toBe(false);
		expect(isStaticPath("/")).toBe(false);
		expect(isStaticPath("/api/users")).toBe(false);
	});
});

describe("safeLang", () => {
	test("accepts BCP 47-ish tags", () => {
		expect(safeLang("en")).toBe("en");
		expect(safeLang("en-US")).toBe("en-US");
		expect(safeLang("zh-Hant")).toBe("zh-Hant");
	});

	test("rejects attribute-injection attempts", () => {
		expect(safeLang(`"><script>`)).toBe("en");
		expect(safeLang("en US")).toBe("en");
		expect(safeLang("")).toBe("en");
		expect(safeLang(undefined)).toBe("en");
	});

	test("rejects too-long tags", () => {
		expect(safeLang("a".repeat(36))).toBe("en");
	});
});
