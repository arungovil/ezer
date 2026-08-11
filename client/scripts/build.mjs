import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const clientDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const watch = process.argv.includes("--watch");

const options = {
  entryPoints: {
    content: join(clientDir, "src/content/index.ts"),
    background: join(clientDir, "src/background/index.ts"),
    sidepanel: join(clientDir, "src/sidepanel/index.ts"),
  },
  bundle: true,
  outdir: join(clientDir, "dist"),
  alias: {
    "@src": join(clientDir, "src"),
  },
  format: "iife",
  target: "chrome120",
  sourcemap: true,
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
