#!/usr/bin/env node
// Static scan for reversed time windows.
//
// `at(t, a, b)` / `phase(t, a, b)` with b < a is a silent bug: the clamp turns
// it into "already finished" or "not started yet", so the picture still animates
// and a frame dump looks plausible. Two defects in this project were exactly
// this (see docs/dsh-fix-round1-notes.md), and neither was visible in the film.
//
// This tool resolves the two window arguments statically where it can -- plain
// numbers, and `<Segment>.cues.<name>` / `<Segment>.start` / `<Segment>.end`
// references into the same file's frozen config -- and reports any pair with
// b < a. Calls whose arguments depend on runtime values are skipped and counted
// so the report never overstates its coverage.
//
//   node tools/check-time-windows.mjs [--json out.json] [--verbose]
//
// Exits 1 if any unexplained reversed window is found.

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = resolve(fileURLToPath(new URL(".", import.meta.url)));
const ROOT = resolve(HERE, "..");
const SRC = join(ROOT, "src");

// Sites that are reversed on purpose. Each needs a reason; the check prints
// them but does not fail on them.
const INTENTIONAL = [
  // { file: "src/example.js", line: 12, reason: "..." },
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith(".js")) out.push(full);
  }
  return out;
}

/** Numeric facts from a file's `export const P<n> = Object.freeze({...})` block. */
function configSymbols(text) {
  const symbols = new Map();
  const cfgRe = /export const (\w+) = Object\.freeze\(\{/g;
  let m;
  while ((m = cfgRe.exec(text))) {
    const name = m[1];
    const braceAt = text.indexOf("{", m.index + m[0].length - 1);
    let depth = 0;
    let end = text.length;
    for (let i = braceAt; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    const block = text.slice(braceAt, end);

    // `cues: { ... }` holds no nested braces.
    const cuesM = /cues:\s*\{([^}]*)\}/s.exec(block);
    if (cuesM) {
      for (const c of cuesM[1].matchAll(/(\w+)\s*:\s*(-?\d+(?:\.\d+)?)/g)) {
        const value = Number(c[2]);
        symbols.set(`${name}.cues.${c[1]}`, value);
        // Also expose the bare form, as the segment files read them both ways.
        if (!symbols.has(`${name}.${c[1]}`)) symbols.set(`${name}.${c[1]}`, value);
      }
    }
    // Top-level scalars (`start`, `end`, `eyeWidth`, ...).
    for (const c of block.matchAll(/^\s{2}(\w+)\s*:\s*(-?\d+(?:\.\d+)?)\s*,?\s*$/gm)) {
      if (!symbols.has(`${name}.${c[1]}`)) symbols.set(`${name}.${c[1]}`, Number(c[2]));
    }
  }
  return symbols;
}

/** Split a call's argument list on top-level commas. `s` starts just after `(`. */
function splitArgs(text, openParen) {
  const args = [];
  let depth = 0;
  let start = openParen + 1;
  let i = start;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") {
      if (depth === 0) {
        args.push(text.slice(start, i));
        return { args, end: i };
      }
      depth--;
    } else if (ch === "," && depth === 0) {
      args.push(text.slice(start, i));
      start = i + 1;
    }
  }
  return { args, end: -1 };
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (text[i] === "\n") line++;
  return line;
}

/** Evaluate an argument expression if it is fully determined by known numbers. */
function staticValue(expr, symbols) {
  let e = expr;
  // Substitute the longest names first so `<P>.cues.x` wins over `<P>.x`.
  const names = [...symbols.keys()].sort((a, b) => b.length - a.length);
  for (const name of names) {
    if (!e.includes(name)) continue;
    e = e.split(name).join(`(${symbols.get(name)})`);
  }
  // Anything left that is not arithmetic means it depends on runtime values.
  if (!/^[\d\s+\-*/().]+$/.test(e)) return null;
  try {
    const v = Function(`"use strict";return (${e});`)();
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

const CALLEE = /(?<![\w.$])(at|phase)\s*\(/g;

function scan(file) {
  const text = readFileSync(file, "utf8");
  const symbols = configSymbols(text);
  const rel = relative(ROOT, file).split(sep).join("/");
  const findings = [];
  let checked = 0;
  let skipped = 0;

  CALLEE.lastIndex = 0;
  let m;
  while ((m = CALLEE.exec(text))) {
    const openParen = m.index + m[0].length - 1;
    const { args, end } = splitArgs(text, openParen);
    if (end < 0) continue;
    const line = lineOf(text, m.index);
    if (args.length < 3) {
      skipped++;
      continue;
    }
    const a = staticValue(args[1], symbols);
    const b = staticValue(args[2], symbols);
    if (a === null || b === null) {
      skipped++;
      continue;
    }
    checked++;
    if (b < a) {
      findings.push({
        file: rel,
        line,
        callee: m[1],
        a,
        b,
        width: b - a,
        source: text.slice(m.index, Math.min(end + 1, m.index + 160)).replace(/\s+/g, " "),
      });
    }
  }
  return { findings, checked, skipped };
}

function main() {
  const argv = process.argv.slice(2);
  const jsonAt = argv.indexOf("--json");
  const verbose = argv.includes("--verbose");
  const files = walk(SRC).sort();
  const all = [];
  let checked = 0;
  let skipped = 0;
  for (const f of files) {
    const r = scan(f);
    all.push(...r.findings);
    checked += r.checked;
    skipped += r.skipped;
  }

  const explained = [];
  const unexplained = [];
  for (const f of all) {
    const hit = INTENTIONAL.find((i) => i.file === f.file && i.line === f.line);
    (hit ? explained : unexplained).push(hit ? { ...f, reason: hit.reason } : f);
  }

  const report = {
    scannedFiles: files.length,
    literalsChecked: checked,
    runtimeWindowsSkipped: skipped,
    reversedWindows: unexplained.length,
    intentionalReversedWindows: explained.length,
    findings: unexplained,
    intentional: explained,
  };

  if (verbose || unexplained.length) {
    for (const f of unexplained) {
      console.log(`${f.file}:${f.line}  ${f.callee}(t, ${f.a}, ${f.b})  width ${f.width}`);
      console.log(`    ${f.source}`);
    }
    for (const f of explained) {
      console.log(`(intentional) ${f.file}:${f.line}  ${f.a} -> ${f.b}  ${f.reason}`);
    }
  }
  console.log(
    `time windows: ${files.length} files, ${checked} statically resolved, ` +
      `${skipped} runtime-dependent, ${unexplained.length} reversed`,
  );
  if (jsonAt >= 0) {
    writeFileSync(argv[jsonAt + 1], JSON.stringify(report, null, 2));
    console.log(`wrote ${argv[jsonAt + 1]}`);
  }
  return unexplained.length ? 1 : 0;
}

process.exit(main());
