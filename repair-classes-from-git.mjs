#!/usr/bin/env node
/**
 * Repair deleted Tailwind classes using the last commit as a reference,
 * WITHOUT touching any other edit you made.
 *
 * For each damaged file it walks through your current lines. When a line has
 * the same code as a committed line (ignoring what is inside quotes), it takes
 * the committed class strings for that line, but only where your string is the
 * committed one with classes missing. Everything else (new code, new props,
 * renamed things, brand-new lines) is left exactly as you have it.
 *
 *   node repair-classes-from-git.mjs            report only
 *   node repair-classes-from-git.mjs --write    apply (backups go to .restore-backup/)
 *
 * Then run:  node migrate-colors.mjs --write
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const WRITE = process.argv.includes("--write");
const PROJECT = process.cwd();
const rootArg = process.argv.slice(2).find((a) => !a.startsWith("--"));
const ROOT = path.resolve(rootArg ?? "src");
const EXT = new Set([".tsx", ".jsx", ".ts", ".js"]);

// ── lint (same checks as migrate-colors.mjs --lint) ─────────────────────────
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

// ── string scanning ─────────────────────────────────────────────────────────
// 1: "..." or '...'   2: `...` (no ${})   3: template head   4: template middle/tail
const STR = /(["'])((?:\\.|(?!\1)[^\\\n])*)\1|`([^`$\n\\]*)`|`([^`$\n\\]*)(?=\$\{)|(?<=\})([^`$\n{}\\]*)(?=`|\$\{)/gd;

function scan(line) {
  const out = [];
  STR.lastIndex = 0;
  let m;
  while ((m = STR.exec(line))) {
    const idx = m.indices[2] ?? m.indices[3] ?? m.indices[4] ?? m.indices[5];
    if (!idx) continue;
    out.push({ start: idx[0], end: idx[1], body: line.slice(idx[0], idx[1]) });
    if (m[0].length === 0) STR.lastIndex++;
  }
  return out;
}
const skeleton = (line) => {
  const parts = scan(line);
  let s = "", pos = 0;
  for (const p of parts) { s += line.slice(pos, p.start) + "§"; pos = p.end; }
  return (s + line.slice(pos)).replace(/\s+/g, " ").trim();
};

// ── class-aware comparison ──────────────────────────────────────────────────
const splitVar = (t) => { const i = t.lastIndexOf(":"); return i < 0 ? ["", t] : [t.slice(0, i + 1), t.slice(i + 1)]; };
const GOLD = /(amber|yellow|orange|gold)/;
function tokMatch(t, g) {
  if (t === g) return true;
  const [tv, tc] = splitVar(t);
  const [gv, gc] = splitVar(g);
  if (tv !== gv) return false;
  if (tc === "") return true;                           // "hover:" left alone
  if (tc.startsWith("-") || tc.startsWith("/")) return gc.endsWith(tc); // "-2", "/50"
  if (tc.includes("primary") && GOLD.test(gc)) return tc.split("-")[0] === gc.split("-")[0];
  return false;
}
const WORDS = new Set("flex grid block hidden absolute relative fixed sticky uppercase italic truncate border rounded shadow transition group container inline grow shrink underline capitalize lowercase antialiased".split(" "));
const classish = (tok) => tok.includes("-") || tok.includes(":") || WORDS.has(tok);

function canRepair(nowBody, gitBody) {
  if (nowBody === gitBody) return false;
  const gt = gitBody.split(/\s+/).filter(Boolean);
  const nt = nowBody.split(/\s+/).filter(Boolean);
  if (gt.length < 2 || nt.length > gt.length) return false;       // damage never adds tokens
  if (gt.filter(classish).length < gt.length / 2) return false;   // looks like a class list
  return nt.every((t) => gt.some((g) => tokMatch(t, g)));
}

// ── git / files ─────────────────────────────────────────────────────────────
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

function repair(nowText, gitText) {
  const eol = nowText.includes("\r\n") ? "\r\n" : "\n";
  const nowLines = nowText.split(/\r?\n/);
  const gitLines = gitText.split(/\r?\n/);
  const bySkel = new Map();
  gitLines.forEach((l, i) => {
    const s = skeleton(l);
    if (!s) return;
    (bySkel.get(s) ?? bySkel.set(s, []).get(s)).push(i);
  });

  let last = -1, fixed = 0, noCounterpart = 0;
  const out = nowLines.map((line) => {
    const s = skeleton(line);
    if (!s) return line;
    const cand = bySkel.get(s);
    if (!cand) { if (brokenCount(line)) noCounterpart++; return line; }
    const gi = cand.find((i) => i > last) ?? cand[0];
    if (gi > last) last = gi;

    const a = scan(line), b = scan(gitLines[gi]);
    if (a.length !== b.length) return line;
    let res = "", pos = 0;
    a.forEach((p, k) => {
      res += line.slice(pos, p.start);
      if (canRepair(p.body, b[k].body)) { res += b[k].body; fixed++; }
      else res += p.body;
      pos = p.end;
    });
    return res + line.slice(pos);
  });
  return { text: out.join(eol), fixed, noCounterpart };
}

// ── run ─────────────────────────────────────────────────────────────────────
let totalFixed = 0, filesChanged = 0;
const notInGit = [], leftovers = [];
for (const file of walk(ROOT)) {
  const now = fs.readFileSync(file, "utf8");
  const before = brokenCount(now);
  if (before === 0) continue;
  const rel = path.relative(PROJECT, file);
  const git = gitShow(rel);
  if (git == null) { notInGit.push([rel, before]); continue; }

  const r = repair(now, git);
  const after = brokenCount(r.text);
  if (r.fixed) { filesChanged++; totalFixed += r.fixed; }
  console.log(`${rel}\n   repaired ${r.fixed} string(s)   broken ${before} -> ${after}`);
  if (after) leftovers.push([rel, after, r.noCounterpart]);

  if (WRITE && r.fixed) {
    const bak = path.join(PROJECT, ".restore-backup", rel);
    fs.mkdirSync(path.dirname(bak), { recursive: true });
    fs.copyFileSync(file, bak);
    fs.writeFileSync(file, r.text, "utf8");
  }
}

console.log(`\n${totalFixed} class string(s) in ${filesChanged} file(s) ${WRITE ? "repaired" : "can be repaired (re-run with --write)"}.`);
if (leftovers.length) {
  console.log("\nStill broken after this step (new code that is not in git yet):");
  leftovers.forEach(([f, n, nc]) => console.log(`  ${String(n).padStart(3)}  ${f}${nc ? `   (${nc} line(s) have no committed counterpart)` : ""}`));
}
if (notInGit.length) {
  console.log("\nNot in git, use restore-from-history.mjs or send them to me:");
  notInGit.forEach(([f, n]) => console.log(`  ${String(n).padStart(3)}  ${f}`));
}
