/**
 * `npm run validate`: syntax-check every JavaScript file, confirm no secret or environment file is
 * tracked, then run the automated test suite. Lightweight by design (no build tooling).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";

const failures = [];
const tracked = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

for (const file of tracked.filter((f) => /\.(m?js)$/.test(f))) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) failures.push(`syntax: ${file}\n${result.stderr}`);
}

for (const file of tracked) {
  if (/(^|\/)\.env(\.|$)/.test(file) && !file.endsWith(".env.example")) failures.push(`environment file must not be committed: ${file}`);
}

const SECRET_PATTERNS = [/postgres(ql)?:\/\/[^\s"'`<>]+:[^\s"'`<>]+@/i, /npg_[A-Za-z0-9]{8,}/, /braivanta2026/];
for (const file of tracked.filter((f) => !f.startsWith("node_modules/") && !f.endsWith("package-lock.json"))) {
  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  // Tests hold synthetic secrets to prove non-disclosure; this script holds the patterns themselves.
  if (file.startsWith("tests/") || file === "scripts/validate.mjs") continue;
  for (const pattern of SECRET_PATTERNS) if (pattern.test(text)) failures.push(`possible secret in ${file}: ${pattern}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Static checks passed (${tracked.filter((f) => /\.(m?js)$/.test(f)).length} JavaScript files, no tracked secrets).`);

const tests = spawnSync("npm", ["test"], { stdio: "inherit", shell: true });
process.exit(tests.status ?? 1);
