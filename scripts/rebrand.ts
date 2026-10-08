#!/usr/bin/env node
// Applies the Lumin Hub rebrand to upstream T3 Code sources. The upstream sync
// workflow (.github/workflows/upstream-sync.yml) runs it after every merge so
// new upstream strings ship rebranded. Rules must stay idempotent.
//
//   node scripts/rebrand.ts                      rewrite tracked files in place
//   node scripts/rebrand.ts --check              list files that still need it
//   node scripts/rebrand.ts --resolve-conflicts  settle rebrand-only conflicts
//                                                during `git merge upstream/main`

import * as NodeChildProcess from "node:child_process";
import * as NodeFS from "node:fs";

export const FORK_REPOSITORY = "spencerrego-lumin/lumin-hub";
const UPSTREAM_REPOSITORY = "pingdotgg/t3code";

const TEXT_EXTENSIONS =
  /\.(ts|tsx|js|mjs|cjs|json|jsonc|ndjson|md|mdx|mdc|yml|yaml|sh|ps1|svg|html|css|astro|xml|plist|toml|txt)$/;

// Hand-maintained or legally attributed files. Upstream edits to these surface
// as merge conflicts instead of being rewritten.
const EXCLUDED_PATHS = [
  /^README\.md$/,
  /^CONTRIBUTING\.md$/,
  /(^|\/)LICENSE[^/]*$/,
  /(^|\/)THIRD_PARTY[^/]*$/,
  /^apps\/marketing\//,
  /^patches\//,
  /^\.repos\//,
  /^scripts\/rebrand\.ts$/,
  /^\.github\/workflows\/upstream-sync\.yml$/,
  // Fixtures for tool names external agents report, which still say "T3 Code".
  /^packages\/shared\/src\/t3McpToolPresentation\.test\.ts$/,
];

// Files whose upstream repository references decide where users get updates
// from, along with their tests. Everywhere else `pingdotgg/t3code` links to
// real upstream history.
const RELEASE_SOURCE_PATHS = new Set([
  "packages/shared/src/cliRelease.ts",
  "packages/shared/src/cliRelease.test.ts",
  "apps/web/src/components/desktopUpdate.logic.ts",
  "apps/web/src/components/desktopUpdate.logic.test.ts",
  "scripts/install.sh",
  "scripts/install.ps1",
  ".github/workflows/release.yml",
]);

// "T3 Code (Alpha)" and "T3 Code (Dev)" are also the legacy userData folder
// names desktop migration still looks for on disk. They stay as-is in these
// files and on lines about legacy paths, and are rebranded everywhere else.
const LEGACY_PROFILE_PATHS = new Set([
  "apps/desktop/src/app/DesktopUserData.ts",
  "apps/desktop/src/app/DesktopUserData.test.ts",
  "apps/desktop/src/app/DesktopLegacyLocalStorage.ts",
  "apps/desktop/src/app/DesktopPreReadyFileSystem.test.ts",
]);
const LEGACY_PROFILE_LINE = /legacy|Application Support/i;
// Optional escapes also match the name written as regex source in tests.
const LEGACY_PROFILE_NAME = /T3 Code(?= \\?\(\(?(?:Alpha|Dev)\b)/;

const DISPLAY_NAME_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bT3 environment\b/g, "Lumin Hub environment"],
  [/\bT3 thread/g, "Lumin Hub thread"],
  [/\b(Open|in) T3\b(?![ -]?[A-Za-z0-9])/g, "$1 Lumin Hub"],
];

function rebrandProductName(path: string, content: string): string {
  const keepLegacy = LEGACY_PROFILE_PATHS.has(path);
  return content.replace(/^.*T3 Code.*$/gm, (line) =>
    (keepLegacy || LEGACY_PROFILE_LINE.test(line)) && LEGACY_PROFILE_NAME.test(line)
      ? line.replace(/T3 Code(?! \\?\(\(?(?:Alpha|Dev)\b)/g, "Lumin Hub")
      : line.replaceAll("T3 Code", "Lumin Hub"),
  );
}

export function rebrandContent(path: string, content: string): string {
  let next = rebrandProductName(path, content);
  for (const [pattern, replacement] of DISPLAY_NAME_RULES) {
    next = next.replace(pattern, replacement);
  }
  if (RELEASE_SOURCE_PATHS.has(path)) {
    next = next.replaceAll(UPSTREAM_REPOSITORY, FORK_REPOSITORY);
  }
  return next;
}

export function isRebrandable(path: string): boolean {
  return TEXT_EXTENSIONS.test(path) && !EXCLUDED_PATHS.some((pattern) => pattern.test(path));
}

const git = (args: ReadonlyArray<string>) =>
  NodeChildProcess.execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  });

function readMergeStage(stage: 1 | 2 | 3, path: string): string | undefined {
  try {
    return git(["show", `:${stage}:${path}`]);
  } catch {
    return undefined; // the file does not exist on that side
  }
}

// The formatter rewraps rebranded lines, adding or removing trailing commas.
const withoutFormatting = (content: string) =>
  content.replace(/\s+/g, "").replace(/,(?=[)\]}])/g, "");

// Resolves an in-progress upstream merge where our side of a conflicted file
// is only the rebrand of the common ancestor: the merge result is then
// upstream's version, rebranded. Prints the conflicts that still need a person.
function resolveConflicts() {
  const conflicted = new Set(git(["diff", "--name-only", "--diff-filter=U", "-z"]).split("\0"));
  const remaining: string[] = [];
  for (const path of conflicted) {
    if (!path) continue;
    const base = isRebrandable(path) ? readMergeStage(1, path) : undefined;
    const ours = base === undefined ? undefined : readMergeStage(2, path);
    if (
      base === undefined ||
      ours === undefined ||
      withoutFormatting(rebrandContent(path, base)) !== withoutFormatting(ours)
    ) {
      remaining.push(path);
      continue;
    }
    const theirs = readMergeStage(3, path);
    if (theirs === undefined) {
      git(["rm", "-q", "--", path]);
    } else {
      NodeFS.writeFileSync(path, rebrandContent(path, theirs));
      git(["add", "--", path]);
    }
  }
  for (const path of remaining) console.log(path);
  if (remaining.length > 0) process.exitCode = 1;
}

function main(args: ReadonlyArray<string>) {
  if (args.includes("--resolve-conflicts")) {
    resolveConflicts();
    return;
  }

  const check = args.includes("--check");
  const files = git(["ls-files", "-z", "--", ".", ":!.repos"])
    .split("\0")
    .filter((path) => path && isRebrandable(path));

  const changed: string[] = [];
  for (const path of files) {
    let content: string;
    try {
      content = NodeFS.readFileSync(path, "utf8");
    } catch {
      continue; // deleted in the working tree
    }
    const next = rebrandContent(path, content);
    if (next === content) continue;
    changed.push(path);
    if (!check) NodeFS.writeFileSync(path, next);
  }

  for (const path of changed) console.log(path);
  if (check && changed.length > 0) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2));
}
