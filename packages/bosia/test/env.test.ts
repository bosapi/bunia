import { describe, expect, test } from "bun:test";
import { parseEnvFile, classifyEnvVars } from "../src/core/env.ts";

describe("parseEnvFile", () => {
	test("unquoted basic", () => {
		expect(parseEnvFile("FOO=bar\nBAZ=qux")).toEqual({ FOO: "bar", BAZ: "qux" });
	});

	test("skips blanks and # comments", () => {
		expect(parseEnvFile("# c\n\nFOO=bar\n# trailing")).toEqual({ FOO: "bar" });
	});

	test("double-quoted with escape sequences", () => {
		expect(parseEnvFile(`MSG="line1\\nline2\\t!"`).MSG).toBe("line1\nline2\t!");
	});

	test("single-quoted is literal", () => {
		expect(parseEnvFile(`MSG='line1\\nline2'`).MSG).toBe("line1\\nline2");
	});

	test("strips inline comment after closing double-quote", () => {
		expect(parseEnvFile(`KEY="value" # note`).KEY).toBe("value");
	});

	test("strips inline comment after closing single-quote", () => {
		expect(parseEnvFile(`KEY='value' # note`).KEY).toBe("value");
	});

	test("# inside quotes is literal", () => {
		expect(parseEnvFile(`KEY="a#b"`).KEY).toBe("a#b");
	});

	test("foo#bar without preceding space preserved (unquoted)", () => {
		expect(parseEnvFile("KEY=foo#bar").KEY).toBe("foo#bar");
	});

	test("rejects invalid identifier names", () => {
		expect(() => parseEnvFile("123BAD=x")).toThrow(/Invalid env variable name/);
		expect(() => parseEnvFile("FOO-BAR=x")).toThrow(/Invalid env variable name/);
	});

	test("accepts underscores and digits in name", () => {
		expect(parseEnvFile("_X=1\nFOO_BAR_2=y")).toEqual({ _X: "1", FOO_BAR_2: "y" });
	});

	test("ignores lines without =", () => {
		expect(parseEnvFile("NOEQUALS\nFOO=bar")).toEqual({ FOO: "bar" });
	});
});

describe("classifyEnvVars", () => {
	test("buckets by prefix", () => {
		const c = classifyEnvVars({
			PUBLIC_STATIC_API: "1",
			PUBLIC_FLAG: "2",
			STATIC_KEY: "3",
			SECRET: "4",
		});
		expect(c.publicStatic).toEqual({ PUBLIC_STATIC_API: "1" });
		expect(c.publicDynamic).toEqual({ PUBLIC_FLAG: "2" });
		expect(c.privateStatic).toEqual({ STATIC_KEY: "3" });
		expect(c.privateDynamic).toEqual({ SECRET: "4" });
	});
});
