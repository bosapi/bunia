import { describe, expect, test } from "bun:test";
import { getCorsHeaders, handlePreflight } from "../src/core/cors.ts";

function req(headers: Record<string, string> = {}, method = "GET") {
	return new Request("https://api.example.com/x", { method, headers });
}

describe("getCorsHeaders", () => {
	test("returns null when Origin missing", () => {
		expect(getCorsHeaders(req(), { allowedOrigins: ["https://app.example.com"] })).toBe(null);
	});

	test("returns null when Origin not allowed", () => {
		const r = req({ origin: "https://evil.com" });
		expect(getCorsHeaders(r, { allowedOrigins: ["https://app.example.com"] })).toBe(null);
	});

	test("echoes allowed Origin and adds Vary", () => {
		const r = req({ origin: "https://app.example.com" });
		const h = getCorsHeaders(r, { allowedOrigins: ["https://app.example.com"] });
		expect(h?.["Access-Control-Allow-Origin"]).toBe("https://app.example.com");
		expect(h?.Vary).toBe("Origin");
	});

	test("credentials adds Allow-Credentials", () => {
		const r = req({ origin: "https://app.example.com" });
		const h = getCorsHeaders(r, {
			allowedOrigins: ["https://app.example.com"],
			credentials: true,
		});
		expect(h?.["Access-Control-Allow-Credentials"]).toBe("true");
	});

	test("exposedHeaders joined with comma", () => {
		const r = req({ origin: "https://app.example.com" });
		const h = getCorsHeaders(r, {
			allowedOrigins: ["https://app.example.com"],
			exposedHeaders: ["X-Total", "X-Page"],
		});
		expect(h?.["Access-Control-Expose-Headers"]).toBe("X-Total, X-Page");
	});
});

describe("handlePreflight", () => {
	test("returns null for disallowed origin", () => {
		const r = req({ origin: "https://evil.com" }, "OPTIONS");
		expect(handlePreflight(r, { allowedOrigins: ["https://app.example.com"] })).toBe(null);
	});

	test("204 with Methods/Headers/MaxAge", async () => {
		const r = req({ origin: "https://app.example.com" }, "OPTIONS");
		const res = handlePreflight(r, {
			allowedOrigins: ["https://app.example.com"],
			allowedMethods: ["GET", "POST"],
			allowedHeaders: ["Content-Type"],
			maxAge: 600,
		})!;
		expect(res.status).toBe(204);
		expect(res.headers.get("access-control-allow-methods")).toBe("GET, POST");
		expect(res.headers.get("access-control-allow-headers")).toBe("Content-Type");
		expect(res.headers.get("access-control-max-age")).toBe("600");
	});

	test("defaults methods/headers when omitted", () => {
		const r = req({ origin: "https://app.example.com" }, "OPTIONS");
		const res = handlePreflight(r, { allowedOrigins: ["https://app.example.com"] })!;
		expect(res.headers.get("access-control-allow-methods")).toContain("GET");
		expect(res.headers.get("access-control-allow-headers")).toContain("Content-Type");
		expect(res.headers.get("access-control-max-age")).toBe("86400");
	});
});
