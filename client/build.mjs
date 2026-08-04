import esbuild from "esbuild";

const watch = process.argv.includes("--watch");

const options = {
  entryPoints: {
    content: "src/content.ts",
    background: "src/background.ts",
    sidepanel: "src/sidepanel.ts",
  },
  bundle: true,
  outdir: "dist",
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
