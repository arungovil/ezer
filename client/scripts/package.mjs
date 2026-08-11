import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const clientDir = join(scriptsDir, "..");
const repoRoot = join(clientDir, "..");
const releaseDir = join(repoRoot, "release");

const manifest = JSON.parse(readFileSync(join(clientDir, "manifest.json"), "utf8"));
const version = manifest.version;
const archiveName = `ezer-${version}.zip`;
const stagingDir = join(releaseDir, ".staging", `ezer-${version}`);
const archivePath = join(releaseDir, archiveName);

function runBuild() {
  execSync(`node "${join(scriptsDir, "build.mjs")}"`, { cwd: clientDir, stdio: "inherit" });
}

function assertDistReady() {
  const required = ["background.js", "content.js", "sidepanel.js"];
  for (const file of required) {
    const path = join(clientDir, "dist", file);
    if (!existsSync(path)) {
      throw new Error(`Missing build output: dist/${file}. Run npm run build first.`);
    }
  }
}

function stageExtension() {
  rmSync(stagingDir, { recursive: true, force: true });
  mkdirSync(stagingDir, { recursive: true });

  cpSync(join(clientDir, "manifest.json"), join(stagingDir, "manifest.json"));
  cpSync(join(clientDir, "index.html"), join(stagingDir, "index.html"));
  cpSync(join(clientDir, "styles.css"), join(stagingDir, "styles.css"));

  cpSync(join(clientDir, "dist"), join(stagingDir, "dist"), {
    recursive: true,
    filter: (source) => !source.endsWith(".map"),
  });

  const publicDir = join(clientDir, "public");
  if (existsSync(publicDir)) {
    cpSync(publicDir, join(stagingDir, "public"), { recursive: true });
  } else {
    process.stderr.write(
      "Warning: client/public/ not found — icons referenced in manifest.json may be missing.\n",
    );
  }
}

function createArchive() {
  mkdirSync(releaseDir, { recursive: true });
  rmSync(archivePath, { force: true });

  // tar -a picks zip format from the .zip extension (macOS/Linux/Windows 10+).
  execSync(`tar -caf "${archivePath}" -C "${stagingDir}" .`, { stdio: "inherit" });
}

runBuild();
assertDistReady();
stageExtension();
createArchive();
rmSync(join(releaseDir, ".staging"), { recursive: true, force: true });

process.stdout.write(`Created ${archivePath}\n`);
