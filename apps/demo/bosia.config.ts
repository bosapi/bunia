import { defineConfig } from "bosia";
import { serverTiming } from "bosia/plugins/server-timing";

export default defineConfig({
	plugins: [serverTiming()],
});
