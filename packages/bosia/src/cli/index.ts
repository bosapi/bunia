#!/usr/bin/env bun
// ─── Bosia CLI ────────────────────────────────────────────
//   bun x bosia@latest create <name>   scaffold a new project
//   bun x bosia dev                       start the development server
//   bun x bosia build                     build for production
//   bun x bosia start                     run the production server
//   bun x bosia@latest add <name>         add a UI component from the registry
//   bun x bosia@latest feat <name>        add a feature scaffold from the registry

const [, , command, ...args] = process.argv;

async function main() {
	switch (command) {
		case "create": {
			const { runCreate } = await import("./create.ts");
			await runCreate(args[0], args.slice(1));
			break;
		}
		case "dev": {
			const { runDev } = await import("./dev.ts");
			await runDev();
			break;
		}
		case "build": {
			const { runBuild } = await import("./build.ts");
			await runBuild();
			break;
		}
		case "start": {
			const { runStart } = await import("./start.ts");
			await runStart();
			break;
		}
		case "test": {
			const { runTest } = await import("./test.ts");
			await runTest(args);
			break;
		}
		case "add": {
			const { runAdd } = await import("./add.ts");
			const addName = args.find((a) => !a.startsWith("--"));
			const addFlags = args.filter((a) => a.startsWith("--"));
			await runAdd(addName, addFlags);
			break;
		}
		case "feat": {
			const { runFeat } = await import("./feat.ts");
			const featName = args.find((a) => !a.startsWith("--"));
			const featFlags = args.filter((a) => a.startsWith("--"));
			await runFeat(featName, featFlags);
			break;
		}
		default: {
			console.log(`
⬡ Bosia

Usage:
  bosia <command> [options]

Commands:
  create <name> [--template <t>]  Scaffold a new Bosia project
  dev                 Start the development server
  build               Build for production
  start               Run the production server
  test [args]         Run tests with bun test (auto-loads .env.test, sets BOSIA_ENV=test)
  add <component>     Add a UI component from the registry
  feat <feature>      Add a feature scaffold from the registry [--local]

Examples:
  bun x bosia@latest create my-app
  bun x bosia@latest create my-app --template todo
  bun x bosia dev
  bun x bosia build
  bun x bosia start
  bun x bosia test
  bun x bosia test --watch
  bun x bosia test --coverage
  bun x bosia@latest add button              → src/lib/components/ui/button/
  bun x bosia@latest add shop/cart           → src/lib/components/shop/cart/
  bun x bosia@latest feat login
`);
			break;
		}
	}
}

main().catch((err) => {
	console.error("❌", err.message);
	process.exit(1);
});
