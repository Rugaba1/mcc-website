#!/usr/bin/env node
/**
 * Whole-app color migration: hardcoded Tailwind colors -> theme tokens.
 *
 *   node migrate-colors.mjs            dry run on ./src (prints what would change)
 *   node migrate-colors.mjs --write    apply the changes
 *   node migrate-colors.mjs --lint     list broken class strings (orphan "hover:", "/50", "-2" ...)
 *   node migrate-colors.mjs path/to/dir [--write|--lint]
 *
 * Run it on a clean git state so you can review with `git diff`.
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const LINT = args.includes("--lint");
const ROOT = args.find((a) => !a.startsWith("--")) ?? "src";
const EXT = new Set([".tsx", ".jsx", ".ts", ".js"]);

// Hardcoded dark hexes used as backgrounds -> token
const DARK_HEX = ["0a0c12", "0f1117", "0b0d13", "0d0f14", "0e0e10", "111318", "12141a"];
const SURFACE_HEX = ["1a1d27", "1e2330", "1a1a1d", "161922"];

const UTIL = "text|bg|border|ring|from|via|to|fill|stroke|divide|outline|placeholder|decoration|caret|shadow|accent";
// variants* util-color-shade /opacity
const TOKEN_RE = new RegExp(
  `^((?:[\\w\\[\\]&>*-]+:)*)(!?)(${UTIL})-(amber|yellow|orange|gold|white|gray|grey|slate|zinc|neutral|stone)(?:-(\\d{2,3}))?(\\/\\d+)?$`
);
const HEX_RE = new RegExp(`^((?:[\\w\\[\\]&>*-]+:)*)(!?)(bg|from|via|to|border)-\\[#([0-9a-fA-F]{6})\\](\\/\\d+)?$`);

const NEUTRALS = new Set(["gray", "grey", "slate", "zinc", "neutral", "stone"]);
const GOLDS = new Set(["amber", "yellow", "orange", "gold"]);

function mapToken(token) {
  let m = token.match(HEX_RE);
  if (m) {
    const [, variants, bang, util, hex, op = ""] = m;
    const h = hex.toLowerCase();
    if (DARK_HEX.includes(h)) return `${variants}${bang}${util}-dark${op}`;
    if (SURFACE_HEX.includes(h)) return `${variants}${bang}${util}-surface${op}`;
    return token;
  }

  m = token.match(TOKEN_RE);
  if (!m) return token;
  const [, variants, bang, util, color, shadeStr, op = ""] = m;
  const shade = shadeStr ? parseInt(shadeStr, 10) : null;
  const pre = `${variants}${bang}`;
  const isHover = /(^|:)(hover|focus|group-hover|active):/.test(variants) || /(^|:)(hover|focus|active)$/.test(variants.slice(0, -1));

  // ── white ────────────────────────────────────────────────
  if (color === "white" && shade === null) {
    if (util === "text") return `${pre}text-ivory${op}`;
    if (util === "bg") return op ? `${pre}bg-ivory${op}` : `${pre}bg-card`;
    if (util === "border" || util === "divide") return op ? `${pre}${util}-ivory${op}` : `${pre}${util}-border`;
    if (util === "ring") return `${pre}ring-ring${op}`;
    return token;
  }

  // ── gold family (amber / yellow / orange) ────────────────
  if (GOLDS.has(color)) {
    const light = shade !== null && shade <= 200;
    const deep = shade !== null && shade >= 600;
    if (util === "text") {
      if (light) return `${pre}text-primary${op}`;
      return deep ? `${pre}text-gold-dark${op}` : `${pre}text-primary${op}`;
    }
    if (util === "bg") {
      if (light) return `${pre}bg-primary${op || "/10"}`;
      if (isHover && !op) return `${pre}bg-primary/90`;
      return `${pre}bg-primary${op}`;
    }
    if (util === "border" || util === "ring" || util === "outline" || util === "divide")
      return `${pre}${util}-primary${op}`;
    return `${pre}${util}-primary${op}`; // from / via / to / fill / stroke / shadow ...
  }

  // ── neutral grays ────────────────────────────────────────
  if (NEUTRALS.has(color) && shade !== null) {
    if (util === "text" || util === "placeholder" || util === "decoration" || util === "caret") {
      if (shade >= 700) return `${pre}${util}-foreground${op}`;
      if (shade >= 400) return `${pre}${util}-muted-foreground${op}`;
      return `${pre}${util}-ivory/70`;
    }
    if (util === "bg") {
      if (shade <= 200) return `${pre}bg-muted${op}`;
      if (shade <= 500) return `${pre}bg-muted${op}`;
      if (shade >= 800) return `${pre}bg-${shade >= 900 ? "dark" : "surface"}${op}`;
      return `${pre}bg-surface${op}`;
    }
    if (util === "border" || util === "divide") return `${pre}${util}-border${op}`;
    if (util === "ring" || util === "outline") return `${pre}${util}-ring${op}`;
    if (util === "from" || util === "via" || util === "to") return `${pre}${util}-muted${op}`;
    return token;
  }

  return token;
}

/** Transform one class string. Skips tokens with template expressions. */
function mapClassString(str) {
  const parts = str.split(/(\s+)/);
  const out = parts.map((p) => (/^\s*$/.test(p) || /[${}()]/.test(p) ? p : mapToken(p)));

  // gold buttons: no light text on a plain bg-primary
  const tokens = out.filter((p) => !/^\s*$/.test(p));
  if (tokens.includes("bg-primary")) {
    return out.map((p) => (p === "text-ivory" ? "text-primary-foreground" : p)).join("");
  }
  return out.join("");
}

const STRING_RE = /(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g;

function transform(source) {
  return source.replace(STRING_RE, (whole, q, body) => {
    let next = body;
    if (/(?:^|\s)[\w:\[\]!#&>*-]*(?:text|bg|border|ring|from|via|to|fill|stroke|divide|outline|placeholder|decoration|caret|shadow|accent)-/.test(body)) {
      next = mapClassString(body);
    }
    // template literals: also fix strings nested inside ${ ... }
    if (q === "`" && next.includes("${")) next = transform(next);
    return next === body ? whole : `${q}${next}${q}`;
  });
}

// ── lint: broken class strings left by earlier bulk replaces ──
const VARIANTS = "(?:hover|focus|active|disabled|group-hover|focus-within|focus-visible|sm|md|lg|xl|2xl|dark|first|last|odd|even)";
const LINT_RULES = [
  [new RegExp(`(?:^|[\\s"'\`])(?:[\\w-]+:)*${VARIANTS}:(?=[\\s"'\`])`), 'dangling variant (e.g. "hover:" with nothing after it)'],
  [/(?<=[\s"'`])\/\d{1,3}(?=[\s"'`])/, 'orphan opacity (e.g. "/50")'],
  [/(?<=[\s"'`])-(?:\d|primary|border|foreground)/, 'stripped prefix (e.g. "-2", "-primary")'],
  [/className=(?:"|{`)\s/, "class list starts with a blank (first class missing)"],
];

function lintFile(file, source) {
  const hits = [];
  source.split("\n").forEach((line, i) => {
    if (!/className|class=/.test(line) && !/^\s*["'`]/.test(line)) return;
    for (const [re, msg] of LINT_RULES) if (re.test(line)) hits.push(`${file}:${i + 1}  ${msg}`);
  });
  return hits;
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", "dist", "build", "generated"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (EXT.has(path.extname(entry.name))) yield full;
  }
}

if (!fs.existsSync(ROOT)) {
  console.error(`Folder not found: ${ROOT}. Run from the project root or pass a path.`);
  process.exit(1);
}

let changedFiles = 0;
let lintHits = 0;
const perFile = [];
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, "utf8");
  if (LINT) {
    const hits = lintFile(file, src);
    lintHits += hits.length;
    if (hits.length) perFile.push([file, hits.length]);
    if (!args.includes("--summary")) hits.forEach((h) => console.log(h));
    continue;
  }
  const out = transform(src);
  if (out !== src) {
    changedFiles++;
    console.log(`${WRITE ? "updated" : "would update"}  ${file}`);
    if (WRITE) fs.writeFileSync(file, out, "utf8");
  }
}

if (LINT) {
  perFile.sort((a, b) => b[1] - a[1]).forEach(([f, n]) => console.log(`${String(n).padStart(4)}  ${f}`));
  console.log(`\n${lintHits} suspicious class string(s) in ${perFile.length} file(s).`);
}
else console.log(`\n${changedFiles} file(s) ${WRITE ? "updated" : "would change. Re-run with --write to apply"}.`);
