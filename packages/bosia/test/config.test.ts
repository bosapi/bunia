import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { loadBosiaConfig, resetConfigCache } from "../src/core/config.ts";

let workdir: string;

beforeEach(() => {
	workdir = mkdtempSync(join(tmpdir(), "bosia-config-"));
	resetConfigCache();
});

afterEach(() => {
	rmSync(workdir, { recursive: true, force: true });
	resetConfigCache();
});

describe("loadBosiaConfig", () => {
	test("returns empty plugin list when no config file present", async () => {
		const cfg = await loadBosiaConfig(workdir);
		expect(cfg.plugins).toEqual([]);
	});

	test("loads bosia.config.ts and returns its default export", async () => {
		writeFileSync(
			join(workdir, "bosia.config.ts"),
			`export default { plugins: [{ name: "alpha" }, { name: "beta" }] };\n`,
		);
		const cfg = await loadBosiaConfig(workdir);
		expect(cfg.plugins?.map((p) => p.name)).toEqual(["alpha", "beta"]);
	});

	test("normalizes missing plugins array to []", async () => {
		writeFileSync(join(workdir, "bosia.config.ts"), `export default {};\n`);
		const cfg = await loadBosiaConfig(workdir);
		expect(cfg.plugins).toEqual([]);
	});

	test("throws when default export is not an object", async () => {
		writeFileSync(join(workdir, "bosia.config.ts"), `export default 42;\n`);
		await expect(loadBosiaConfig(workdir)).rejects.toThrow(/must export a default object/);
	});
});
