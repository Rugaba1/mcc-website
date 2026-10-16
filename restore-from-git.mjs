#!/usr/bin/env node
/**
 * Safely restore damaged files from git (last commit) without losing real edits.
 *
 * For every file under ./src with broken class strings it compares the file with
 * the committed version while IGNORING the contents of all quoted strings (class
 * lists). If nothing else differs, the only change is the color damage, so the
 * committed version is safe to restore. Files with real code edits are listed
 * for you to handle separately and are never touched.
 *
 *   node restore-from-git.mjs            report only (changes nothing)
 *   node restore-from-git.mjs --write    restore the safe files (current ones backed up first)
 *
 * Backups go to .restore-backup/ in the project.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const WRITE = process.argv.includes("--write");
const PROJECT = process.cwd();
const ROOT = path.resolve(process.argv.find((a) => !a.startsWith("--") && a !== process.argv[0] && a !== process.argv[1]) ?? "src");
const EXT = new Set([".tsx", ".jsx", ".ts", ".js"]);

const VARIANTS = "(?:hover|focus|active|disabled|group-hover|focus-within|focus-visible|sm|md|lg|xl|2xl|dark|first|last|odd|even)";
const RULES = [
  new RegExp(`(?:^|[\\s"'\`])(?:[\\w-]+:)*${VARIANTS}:(?=[\\s"'\`])`),
  /(?<=[\s"'`])\/\d{1,3}(?=[\s"'`])/,
  /(?<=[\s"'`])-(?:\d|primary|border|foreground)/,
  /className=(?:"|{`)\s/,
];
function brokenCount(text) {
  let n = 0;
  for (const line of text.split("\n")) {
    if (!/className|class=/.test(line) && !/^\s*["'`]/.test(line)) continue;
    for (const re of RULES) if (re.test(line)) n++;
  }
  return n;
}

// Blank out the inside of every quoted string, then compare line by line.
const STR = /(["'`])(?:\\.|(?!\1)[^\\\n])*\1/g;
function lines(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(STR, (m, q) => q + q)
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
function diffLines(a, b) {
  const count = new Map();
  for (const l of a) count.set(l, (count.get(l) ?? 0) + 1);
  for (const l of b) count.set(l, (count.get(l) ?? 0) - 1);
  const out = [];
  for (const [l, n] of count) if (n !== 0) out.push((n > 0 ? "now:  " : "git:  ") + l);
  return out;
}

function gitShow(rel) {
  try {
    return execFileSync("git", ["show", `HEAD:${rel.replace(/\\/g, "/")}`], {
      cwd: PROJECT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"],
    });
  } catch { return null; }
}

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", "generated"].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (EXT.has(path.extname(e.name))) yield full;
  }
}

const safe = [], risky = [], notInGit = [];
for (const file of walk(ROOT)) {
  const now = fs.readFileSync(file, "utf8");
  if (brokenCount(now) === 0) continue;
  const rel = path.relative(PROJECT, file);
  const old = gitShow(rel);
  if (old == null) { notInGit.push(rel); continue; }
  if (brokenCount(old) > 0) { risky.push({ rel, why: ["the committed version is already damaged"] }); continue; }
  const d = diffLines(lines(now), lines(old));
  if (d.length === 0) safe.push({ rel, file, old });
  else risky.push({ rel, why: d.slice(0, 6), more: Math.max(0, d.length - 6) });
}

console.log(`SAFE to restore (only class strings differ): ${safe.length}`);
safe.forEach((s) => console.log("  " + s.rel));

console.log(`\nHAVE REAL EDITS, left untouched: ${risky.length}`);
for (const r of risky) {
  console.log("  " + r.rel);
  r.why.forEach((l) => console.log("      " + l.slice(0, 110)));
  if (r.more) console.log(`      ... and ${r.more} more differing line(s)`);
}
if (notInGit.length) console.log(`\nNot in git (no committed copy):\n  ${notInGit.join("\n  ")}`);

if (WRITE) {
  for (const s of safe) {
    const bak = path.join(PROJECT, ".restore-backup", s.rel);
    fs.mkdirSync(path.dirname(bak), { recursive: true });
    fs.copyFileSync(s.file, bak);
    fs.writeFileSync(s.file, s.old, "utf8");
  }
  console.log(`\nRestored ${safe.length} file(s). Originals of what was overwritten are in .restore-backup/.`);
} else {
  console.log("\nNothing was changed. Re-run with --write to restore the SAFE files.");
}
