import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const clientDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const watch = process.argv.includes("--watch");
const defaultServerUrl = "http://localhost:3000";

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  const env = {};

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    env[key] = value;
  }

  return env;
}

const env = loadEnvFile(join(clientDir, ".env"));
const serverUrl = env.EZER_SERVER_URL ?? defaultServerUrl;

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
  define: {
    __EZER_SERVER_URL__: JSON.stringify(serverUrl),
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
