import { resolve, join, basename } from "path";
import { existsSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { spawn } from "bun";
import * as readline from "readline";

// ─── bosbun create <name> [--template <name>] ──────────────

const TEMPLATES_DIR = resolve(import.meta.dir, "../../templates");

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
    default: "Minimal starter with routing and Tailwind",
    demo: "Full-featured demo with hooks, API routes, form actions, and more",
};

export async function runCreate(name: string | undefined, args: string[] = []) {
    if (!name) {
        console.error("❌ Please provide a project name.\n   Usage: bosbun create my-app");
        process.exit(1);
    }

    const targetDir = resolve(process.cwd(), name);

    if (existsSync(targetDir)) {
        console.error(`❌ Directory already exists: ${targetDir}`);
        process.exit(1);
    }

    // Parse --template flag
    let template: string | undefined;
    const templateIdx = args.indexOf("--template");
    if (templateIdx !== -1 && args[templateIdx + 1]) {
        template = args[templateIdx + 1];
    }

    // If no --template flag, prompt interactively
    if (!template) {
        template = await promptTemplate();
    }

    // Validate template exists
    const templateDir = resolve(TEMPLATES_DIR, template);
    if (!existsSync(templateDir)) {
        const available = getAvailableTemplates().join(", ");
        console.error(`❌ Unknown template: "${template}"\n   Available: ${available}`);
        process.exit(1);
    }

    console.log(`\n⬡ Creating Bosbun project: ${basename(targetDir)} (template: ${template})\n`);

    copyDir(templateDir, targetDir, name);

    console.log(`✅ Project created at ${targetDir}\n`);

    console.log("Installing dependencies...");
    const proc = spawn(["bun", "install"], {
        stdout: "inherit",
        stderr: "inherit",
        cwd: targetDir,
    });
    const exitCode = await proc.exited;
    if (exitCode !== 0) {
        console.warn("⚠️  bun install failed — run it manually.");
    } else {
        console.log(`\n🎉 Ready!\n\n  cd ${name}\n  bun x bosbun dev\n`);
    }
}

function getAvailableTemplates(): string[] {
    return readdirSync(TEMPLATES_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort((a, b) => (a === "default" ? -1 : b === "default" ? 1 : a.localeCompare(b)));
}

async function promptTemplate(): Promise<string> {
    const templates = getAvailableTemplates();

    if (templates.length === 1) return templates[0];

    console.log("\n? Which template?\n");
    templates.forEach((t, i) => {
        const desc = TEMPLATE_DESCRIPTIONS[t] ?? "";
        const marker = i === 0 ? "❯" : " ";
        console.log(`  ${marker} ${t}${desc ? `  — ${desc}` : ""}`);
    });
    console.log();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise<string>((resolvePromise) => {
        rl.question(`  Template name (default): `, (answer) => {
            rl.close();
            const trimmed = answer.trim();
            resolvePromise(trimmed || "default");
        });
    });
}

function copyDir(src: string, dest: string, projectName: string) {
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src, { withFileTypes: true })) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath, projectName);
        } else {
            const content = readFileSync(srcPath, "utf-8").replaceAll("{{PROJECT_NAME}}", projectName);
            writeFileSync(destPath, content, "utf-8");
        }
    }
}
