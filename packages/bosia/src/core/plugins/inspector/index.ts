import { spawn } from "node:child_process";
import { createInspectorBunPlugin } from "./bun-plugin.ts";
import { getOverlayScript } from "./overlay.ts";
import type { BosiaPlugin } from "../../types/plugin.ts";

export interface InspectorOptions {
	/** Editor CLI command. Defaults to `code`. */
	editor?: "code" | "cursor" | "zed" | (string & {});
	/** When set, alt+click opens a comment form whose contents POST here. */
	aiEndpoint?: string;
	/** Endpoint path the overlay POSTs to. Defaults to `/__bosia/locate`. */
	endpoint?: string;
}

function buildEditorArgs(editor: string, file: string, line: number, col: number): string[] {
	if (editor === "zed") return [`${file}:${line}:${col}`];
	return ["-g", `${file}:${line}:${col}`];
}

/**
 * Inspector plugin — alt+click an element in the running dev page to jump
 * to its source in your editor, or open a comment form that hands off to an
 * AI agent. Dev-only: production builds inject nothing and mount no endpoint.
 */
export function inspector(options: InspectorOptions = {}): BosiaPlugin | false {
	if (process.env.NODE_ENV === "production") return false;
	const editor = options.editor ?? "code";
	const endpoint = options.endpoint ?? "/__bosia/locate";
	const aiEndpoint = options.aiEndpoint;

	return {
		name: "inspector",

		build: {
			bunPlugins: (target) => [
				createInspectorBunPlugin({ cwd: process.cwd(), target, dev: true }),
			],
		},

		backend: {
			before(app) {
				return app.post(endpoint, async ({ body }: { body: unknown }) => {
					const data = (body ?? {}) as {
						file?: string;
						line?: number;
						col?: number;
						comment?: string;
					};
					const file = typeof data.file === "string" ? data.file : null;
					const line = Number.isFinite(data.line) ? Number(data.line) : null;
					const col = Number.isFinite(data.col) ? Number(data.col) : 1;
					if (!file || line === null) {
						return new Response(
							JSON.stringify({ ok: false, error: "missing file/line" }),
							{
								status: 400,
								headers: { "content-type": "application/json" },
							},
						);
					}

					const comment = typeof data.comment === "string" ? data.comment.trim() : "";
					if (comment && aiEndpoint) {
						try {
							let origin: string;
							try {
								origin = new URL(aiEndpoint).origin;
							} catch {
								origin = "http://localhost";
							}
							await fetch(aiEndpoint, {
								method: "POST",
								headers: {
									"content-type": "application/json",
									origin,
								},
								body: JSON.stringify({ file, line, col, comment }),
							});
							return { ok: true, mode: "ai" as const };
						} catch (err) {
							console.error("[inspector] aiEndpoint POST failed:", err);
							return new Response(
								JSON.stringify({ ok: false, error: "ai endpoint failed" }),
								{
									status: 502,
									headers: { "content-type": "application/json" },
								},
							);
						}
					}

					try {
						const proc = spawn(editor, buildEditorArgs(editor, file, line, col), {
							detached: true,
							stdio: "ignore",
						});
						proc.unref();
						proc.on("error", (err) => {
							console.error(`[inspector] failed to launch "${editor}":`, err);
						});
					} catch (err) {
						console.error(`[inspector] failed to launch "${editor}":`, err);
						return new Response(
							JSON.stringify({ ok: false, error: "editor launch failed" }),
							{
								status: 500,
								headers: { "content-type": "application/json" },
							},
						);
					}
					return { ok: true, mode: "editor" as const };
				});
			},
		},

		render: {
			bodyEnd: () => getOverlayScript({ aiEndpoint, endpoint }),
		},
	};
}

export default inspector;
