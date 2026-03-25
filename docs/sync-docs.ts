/**
 * Syncs root markdown files (CHANGELOG.md, ROADMAP.md) into the docs content
 * directory with Starlight-compatible frontmatter prepended.
 *
 * Run before `astro dev` or `astro build`.
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const docsDir = import.meta.dir;
const repoRoot = join(docsDir, "..");
const outDir = join(docsDir, "src", "content", "docs", "reference");

const files = [
  {
    source: "CHANGELOG.md",
    dest: "changelog.md",
    title: "Changelog",
    description: "All notable changes to Bosbun.",
    stripHeading: /^# Changelog\n+/,
  },
  {
    source: "ROADMAP.md",
    dest: "roadmap.md",
    title: "Roadmap",
    description: "What's done, what's next, and where Bosbun is headed.",
    stripHeading: /^# Bosbun — Roadmap\n+/,
  },
];

for (const file of files) {
  const content = readFileSync(join(repoRoot, file.source), "utf-8");
  const stripped = content.replace(file.stripHeading, "");
  const output = `---\ntitle: ${file.title}\ndescription: ${file.description}\n---\n\n${stripped}`;
  writeFileSync(join(outDir, file.dest), output);
  console.log(`✓ Synced ${file.source} → docs/src/content/docs/reference/${file.dest}`);
}
