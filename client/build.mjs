import esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const options = {
  entryPoints: {
    content: "src/content/index.ts",
    background: "src/background/index.ts",
    sidepanel: "src/sidepanel/index.ts",
  },
  bundle: true,
  outdir: "dist",
  alias: {
    "@src": "./src",
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
