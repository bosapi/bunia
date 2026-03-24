import { join } from "path";
import { existsSync } from "fs";

// This file lives at src/core/paths.ts → package root is ../..
const BOSBUN_PKG_DIR = join(import.meta.dir, "..", "..");

// Bun hoists dependencies flat, so bosbun's deps may live in the parent
// node_modules rather than a nested node_modules/bosbun/node_modules.
const NESTED_NM = join(BOSBUN_PKG_DIR, "node_modules");
const HOISTED_NM = join(BOSBUN_PKG_DIR, ".."); // node_modules/bosbun/.. = node_modules/

/** NODE_PATH value covering both nested and hoisted dependency locations */
export const BOSBUN_NODE_PATH = [NESTED_NM, HOISTED_NM].join(":");

/** Find a binary from bosbun's dependencies (handles hoisting) */
export function resolveBosbunBin(name: string): string {
    const nested = join(NESTED_NM, ".bin", name);
    if (existsSync(nested)) return nested;
    const hoisted = join(HOISTED_NM, ".bin", name);
    if (existsSync(hoisted)) return hoisted;
    return nested; // fallback — will produce a clear ENOENT
}
