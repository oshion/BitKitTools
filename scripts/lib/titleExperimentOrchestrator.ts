/**
 * Title Experiment Orchestrator — Pure Logic + Deployable Functions
 *
 * This module contains:
 *   A) Pure decision functions (no side effects, fully unit-testable).
 *   B) `deployTitleVariant` — side-effecting function that wraps git/gh CLI
 *      calls, accepting an injectable spawnSyncFn for testability.
 *   C) Safe tools-config.ts mutation helpers.
 *
 * The thin orchestration entry point (scripts/run-title-experiment.ts) wires
 * these together with file I/O and the Anthropic API.
 */

import type { SpawnSyncOptions, SpawnSyncReturns } from 'child_process'
import type { ActionLog, ActionLogEntry } from './detectStagnation'
import type { CtrAnomaly } from './detectCtrAnomalies'
import type { LocalizedText, ToolConfig } from '../../src/types/tool'
import type { TitleVariant } from '../generate-title-variant'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProcessedQuery {
  query: string
  page: string
  country: string
  device: string
  impressions: number
  clicks: number
  ctr: number
  position: number
}

/** Injectable spawn function — defaults to child_process.spawnSync in production. */
export type SpawnSyncFn = (
  command: string,
  args: ReadonlyArray<string>,
  options?: SpawnSyncOptions
) => SpawnSyncReturns<string>

export interface DeployOptions {
  /** Defaults to child_process.spawnSync */
  spawnSyncFn?: SpawnSyncFn
  /** Path to tools-config.ts; defaults to src/lib/config/tools-config.ts from cwd */
  toolsConfigPath?: string
  /** Working directory for git/gh commands; defaults to process.cwd() */
  cwd?: string
  /** Injected file reader; defaults to fs.readFileSync */
  readFileFn?: (path: string, encoding: BufferEncoding) => string
  /** Injected file writer; defaults to fs.writeFileSync */
  writeFileFn?: (path: string, content: string, encoding: BufferEncoding) => void
}

// ── A. Pure Decision Functions ────────────────────────────────────────────────

/**
 * Returns true when the tool requires human review for title changes.
 * YMYL tools (medical / legal / financial) are excluded from auto-merge.
 */
export function isYmylTool(tool: ToolConfig): boolean {
  return (
    tool.disclaimerType === 'medical' ||
    tool.disclaimerType === 'legal' ||
    tool.disclaimerType === 'financial'
  )
}

/**
 * Counts experiments whose lifecycle is currently 'in-progress'.
 * Used to enforce the max-concurrent-experiments limit.
 */
export function countInProgressExperiments(log: ActionLog): number {
  return log.actions.filter(
    (e) => e.type === 'title-experiment' && e.status === 'in-progress'
  ).length
}

/**
 * Returns true when an in-progress experiment has waited long enough after
 * its reindex confirmation (`cooldownStartedAt`) to be evaluated.
 *
 * Uses `cooldownStartedAt` as the reference — NOT `deployedAt` — because
 * Google may take days to crawl new content after deployment.
 *
 * `asOf` is always explicit so tests remain deterministic.
 */
export function isExperimentReadyForEvaluation(
  entry: ActionLogEntry,
  asOf: Date,
  cooldownDays = 21
): boolean {
  if (entry.type !== 'title-experiment') return false
  if (entry.status !== 'in-progress') return false
  if (!entry.cooldownStartedAt) return false

  const cooldownStart = new Date(entry.cooldownStartedAt)
  const diffDays = (asOf.getTime() - cooldownStart.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= cooldownDays
}

/**
 * Decides what to do with an experiment once the cooldown is complete.
 *
 * - 'kept': currentCtr is strictly higher than the baseline → keep new title.
 * - 'new-attempt': CTR did not improve AND attempt count < 3 → try next variant.
 * - 'rollback': CTR did not improve AND attempt count >= 3 → restore original.
 */
export function evaluateExperimentOutcome(
  entry: ActionLogEntry,
  currentCtr: number
): 'kept' | 'new-attempt' | 'rollback' {
  const baseline = entry.baselineCtr ?? 0
  if (currentCtr > baseline) return 'kept'

  const attemptNumber = entry.attemptNumber ?? 1
  return attemptNumber < 3 ? 'new-attempt' : 'rollback'
}

/**
 * Selects pages to start new title experiments on.
 *
 * Filtering rules:
 * 1. YMYL tools are excluded from candidate selection entirely
 *    (they would still be processed by deployTitleVariant with isYmyl=true,
 *    but we don't automatically select them here — human should add manually).
 * 2. Pages already running an in-progress experiment are excluded.
 * 3. Unknown pages (not in toolsConfigs) are excluded.
 * 4. At most `maxNew` candidates are returned, preserving anomaly priority order.
 *
 * Note: anomalies contain per-query entries; pages are deduplicated so that
 * the highest-priority anomaly for a page drives its selection.
 */
export function selectCandidatePages(
  anomalies: CtrAnomaly[],
  log: ActionLog,
  toolsConfigs: ToolConfig[],
  maxNew: number
): string[] {
  // Build path → tool lookup (with and without trailing slash)
  const toolByPath = new Map<string, ToolConfig>()
  for (const tool of toolsConfigs) {
    const base = `/${tool.category}/${tool.slug}`
    toolByPath.set(base, tool)
    toolByPath.set(`${base}/`, tool)
  }

  // Collect pages that already have an in-progress experiment
  const inProgressPages = new Set(
    log.actions
      .filter((e) => e.type === 'title-experiment' && e.status === 'in-progress')
      .map((e) => e.page)
  )

  // Deduplicate pages from anomalies (anomalies are per-query; keep first occurrence)
  const seen = new Set<string>()
  const uniquePages: string[] = []
  for (const anomaly of anomalies) {
    if (!seen.has(anomaly.page)) {
      seen.add(anomaly.page)
      uniquePages.push(anomaly.page)
    }
  }

  const candidates: string[] = []
  for (const page of uniquePages) {
    if (candidates.length >= maxNew) break

    // Normalise for map lookups
    const withSlash = page.endsWith('/') ? page : `${page}/`
    const withoutSlash = page.endsWith('/') ? page.slice(0, -1) : page

    // Skip if already in-progress
    if (inProgressPages.has(page) || inProgressPages.has(withSlash) || inProgressPages.has(withoutSlash)) {
      continue
    }

    // Skip unknown pages
    const tool = toolByPath.get(page) ?? toolByPath.get(withSlash) ?? toolByPath.get(withoutSlash)
    if (!tool) continue

    // Skip YMYL tools (they require human review — not auto-selected)
    if (isYmylTool(tool)) continue

    candidates.push(page)
  }

  return candidates
}

/**
 * Aggregates clicks and impressions for a page across all its queries in the
 * processed GSC data, then returns the overall CTR.
 *
 * Returns `null` when the page has no entries or zero total impressions.
 */
export function getPageCtr(queries: ProcessedQuery[], pagePath: string): number | null {
  const withSlash = pagePath.endsWith('/') ? pagePath : `${pagePath}/`
  const withoutSlash = pagePath.endsWith('/') ? pagePath.slice(0, -1) : pagePath

  const matching = queries.filter(
    (q) => q.page === withSlash || q.page === withoutSlash
  )
  if (matching.length === 0) return null

  const totalImpressions = matching.reduce((s, q) => s + q.impressions, 0)
  const totalClicks = matching.reduce((s, q) => s + q.clicks, 0)
  if (totalImpressions === 0) return null

  return totalClicks / totalImpressions
}

/**
 * Derives sensible required-keyword hints for title validation from a tool's
 * config. EN keyword = humanized slug; KO keyword = first token of KO title.
 */
export function getRequiredKeywordsForTool(tool: ToolConfig): { en: string; ko: string } {
  const en = tool.slug.replace(/-/g, ' ')
  // Take the first whitespace-delimited token of the KO title as the KO keyword
  const ko = tool.title.ko.split(/[\s&,、]+/)[0] ?? tool.title.ko
  return { en, ko }
}

/**
 * Returns the ToolConfig whose route path (`/{category}/{slug}`) matches the
 * given page path (with or without trailing slash). Returns `undefined` when
 * no match is found.
 */
export function findToolByPage(
  toolsConfigs: ToolConfig[],
  pagePath: string
): ToolConfig | undefined {
  const normalised = pagePath.endsWith('/') ? pagePath.slice(0, -1) : pagePath
  const parts = normalised.split('/').filter(Boolean) // ['beer', 'bac-calculator']
  if (parts.length < 2) return undefined
  const [category, slug] = parts
  return toolsConfigs.find((t) => t.category === category && t.slug === slug)
}

// ── C. Safe tools-config.ts Mutation ─────────────────────────────────────────

/**
 * Returns `fileContent` with the `title` and `description` fields of the
 * specified tool replaced by the new values.
 *
 * Algorithm:
 *   1. Locate the tool's object in the file by its `id` field.
 *   2. Extract the object boundaries (brace-tracking, with string skipping).
 *   3. Within the extracted section, locate the `title: {` and `description: {`
 *      blocks and swap the `en:` / `ko:` string literals inside each.
 *
 * Throws if `toolId` cannot be found in `fileContent`.
 */
export function updateToolTitleDescription(
  fileContent: string,
  toolId: string,
  newTitle: LocalizedText,
  newDescription: LocalizedText
): string {
  // 1. Find the id field for this tool
  const idPattern = /id:\s*['"]([^'"]+)['"]/g
  let idMatch: RegExpExecArray | null
  let idIndex = -1
  while ((idMatch = idPattern.exec(fileContent)) !== null) {
    if (idMatch[1] === toolId) {
      idIndex = idMatch.index
      break
    }
  }
  if (idIndex === -1) {
    throw new Error(`Tool '${toolId}' not found in tools-config.ts`)
  }

  // 2. Find the opening brace of this tool object (last '{' before the id field)
  const sectionStart = fileContent.lastIndexOf('{', idIndex)
  if (sectionStart === -1) {
    throw new Error(`No opening brace found before tool id '${toolId}'`)
  }

  // 3. Find the matching closing brace
  const sectionEnd = findMatchingBrace(fileContent, sectionStart)
  if (sectionEnd === -1) {
    throw new Error(`No matching closing brace found for tool '${toolId}'`)
  }

  const toolSection = fileContent.slice(sectionStart, sectionEnd + 1)

  // 4. Replace title and description blocks within the section
  let updatedSection = toolSection
  updatedSection = replaceLocalisedBlock(updatedSection, 'title', newTitle)
  updatedSection = replaceLocalisedBlock(updatedSection, 'description', newDescription)

  return fileContent.slice(0, sectionStart) + updatedSection + fileContent.slice(sectionEnd + 1)
}

// ── Helpers for tools-config mutation ────────────────────────────────────────

/**
 * Finds the index of the closing brace that matches the opening brace at
 * `openIdx`. String literals (single/double/template quotes) are skipped so
 * that `{` / `}` inside strings are not counted.
 *
 * Returns -1 if no matching brace is found (malformed input).
 */
function findMatchingBrace(content: string, openIdx: number): number {
  let depth = 0
  let i = openIdx
  while (i < content.length) {
    const ch = content[i]
    if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) return i
    } else if (ch === "'" || ch === '"' || ch === '`') {
      // Skip string content
      const quote = ch
      i++
      while (i < content.length) {
        if (content[i] === '\\') {
          i += 2
          continue
        }
        if (content[i] === quote) break
        i++
      }
    }
    i++
  }
  return -1
}

/**
 * Within `section`, finds the `fieldName: { en: '...', ko: '...' }` block and
 * replaces the `en` and `ko` string values with `newValues.en` / `newValues.ko`.
 *
 * Returns the section unchanged if the block cannot be found.
 */
function replaceLocalisedBlock(
  section: string,
  fieldName: 'title' | 'description',
  newValues: LocalizedText
): string {
  // Match "fieldName: {" (the { is the last character of the match)
  const blockStartRegex = new RegExp(`\\b${fieldName}:\\s*\\{`)
  const match = blockStartRegex.exec(section)
  if (!match) return section

  // The { is the last character captured by the regex
  const bracePos = match.index + match[0].length - 1
  const blockEnd = findMatchingBrace(section, bracePos)
  if (blockEnd === -1) return section

  const blockContent = section.slice(bracePos + 1, blockEnd)

  let newBlock = blockContent
  newBlock = replaceStringValue(newBlock, 'en', newValues.en)
  newBlock = replaceStringValue(newBlock, 'ko', newValues.ko)

  return section.slice(0, bracePos + 1) + newBlock + section.slice(blockEnd)
}

/**
 * Within `content`, finds the first occurrence of `key: '<value>'` (or double
 * quote variant) and replaces the string value with `newValue`.
 *
 * The quote character used in the original is preserved; the replacement value
 * is escaped accordingly.
 *
 * Returns `content` unchanged if `key` is not found.
 */
function replaceStringValue(content: string, key: string, newValue: string): string {
  // Match "key: '" or 'key: "' — the key is a word at the start of a boundary
  const keyRegex = new RegExp(`\\b${key}:\\s*(['"])`)
  const match = keyRegex.exec(content)
  if (!match) return content

  const quoteChar = match[1]!
  const valueStart = match.index + match[0].length

  // Find the end of the string value (next unescaped quoteChar)
  let valueEnd = valueStart
  while (valueEnd < content.length) {
    if (content[valueEnd] === '\\') {
      valueEnd += 2
      continue
    }
    if (content[valueEnd] === quoteChar) break
    valueEnd++
  }

  // Escape the new value for the detected quote style
  const escaped = newValue
    .replace(/\\/g, '\\\\')
    .replace(new RegExp(`\\${quoteChar}`, 'g'), `\\${quoteChar}`)

  return content.slice(0, valueStart) + escaped + content.slice(valueEnd)
}

// ── B. deployTitleVariant ─────────────────────────────────────────────────────

/**
 * Deploys a title/description variant for a page by:
 *   1. Writing the updated values to tools-config.ts.
 *   2. Creating a new git branch from master and committing the change.
 *   3. Pushing the branch and creating a GitHub PR.
 *   4. If `isYmyl` is false, enabling auto-merge on the PR.
 *   5. Returning to the original branch.
 *
 * All external commands are called via the injectable `spawnSyncFn` so that
 * tests can verify invocations without touching the filesystem or network.
 *
 * @throws When git push or gh pr create fail (non-zero exit code).
 */
export async function deployTitleVariant(
  page: string,
  variant: TitleVariant,
  isYmyl: boolean,
  ghToken: string,
  options: DeployOptions = {}
): Promise<{ prUrl: string; autoMerged: boolean }> {
  const {
    toolsConfigPath: configPath,
    cwd: workDir = process.cwd(),
    readFileFn,
    writeFileFn,
  } = options

  // Resolve injectable dependencies
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { spawnSync: defaultSpawnSync } = require('child_process') as typeof import('child_process')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const defaultFs = require('fs') as typeof import('fs')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const defaultPath = require('path') as typeof import('path')

  const spawnSyncFn = options.spawnSyncFn ?? defaultSpawnSync
  const readFile = readFileFn ?? ((p: string, enc: BufferEncoding) => defaultFs.readFileSync(p, enc))
  const writeFile = writeFileFn ?? ((p: string, content: string, enc: BufferEncoding) => defaultFs.writeFileSync(p, content, enc))

  const resolvedConfigPath =
    configPath ?? defaultPath.resolve(workDir, 'src', 'lib', 'config', 'tools-config.ts')

  // 1. Find the tool and update tools-config.ts
  // Derive toolId from page path: '/beer/bac-calculator/' -> 'bac-calculator'
  const normPage = page.endsWith('/') ? page.slice(0, -1) : page
  const toolId = normPage.split('/').pop() ?? ''
  if (!toolId) throw new Error(`Cannot derive toolId from page path '${page}'`)

  const currentContent = readFile(resolvedConfigPath, 'utf-8')
  const updatedContent = updateToolTitleDescription(
    currentContent,
    toolId,
    variant.title,
    variant.description
  )
  writeFile(resolvedConfigPath, updatedContent, 'utf-8')

  // Helper: run a git/gh command via spawnSyncFn
  const run = (
    cmd: string,
    args: string[],
    extraEnv?: Record<string, string>
  ): SpawnSyncReturns<string> =>
    spawnSyncFn(cmd, args, {
      cwd: workDir,
      encoding: 'utf-8',
      env: { ...process.env, ...extraEnv },
    })

  // 2. Save the current branch so we can return to it afterwards
  const currentBranchResult = run('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
  const currentBranch = currentBranchResult.stdout?.trim() ?? 'master'

  // 3. Create a new branch from master
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const safePage = normPage.replace(/\//g, '-').replace(/^-|-$/g, '')
  const branch = `title-experiment/${safePage}-${timestamp}`

  const checkoutResult = run('git', ['checkout', '-b', branch, 'master'])
  if ((checkoutResult.status ?? 1) !== 0) {
    throw new Error(`git checkout failed: ${String(checkoutResult.stderr)}`)
  }

  // 4. Stage and commit
  run('git', ['add', resolvedConfigPath])
  const relConfigPath = defaultPath.relative(workDir, resolvedConfigPath)
  run('git', [
    'commit', '-m',
    `chore(title-experiment): update title/desc for ${page}`,
  ])

  // 5. Push the branch
  const pushResult = run('git', ['push', 'origin', branch], { GH_TOKEN: ghToken })
  if ((pushResult.status ?? 1) !== 0) {
    // Return to original branch before throwing
    run('git', ['checkout', currentBranch])
    throw new Error(`git push failed: ${String(pushResult.stderr)}`)
  }

  // 6. Create PR
  const prBody = [
    `Automated title/description A/B test for \`${page}\`.`,
    '',
    'This PR was generated by the title experiment automation pipeline.',
    '',
    isYmyl
      ? '⚠️ **YMYL page — requires human review before merging.**'
      : 'Auto-merge enabled — will merge once `test-gate.yml` passes.',
  ].join('\n')

  const prResult = run(
    'gh',
    [
      'pr', 'create',
      '--base', 'master',
      '--head', branch,
      '--title', `chore: title experiment for ${page}`,
      '--body', prBody,
    ],
    { GH_TOKEN: ghToken }
  )
  if ((prResult.status ?? 1) !== 0) {
    run('git', ['checkout', currentBranch])
    throw new Error(`gh pr create failed: ${String(prResult.stderr)}`)
  }

  const prUrl = prResult.stdout?.trim().split('\n').pop() ?? branch

  // 7. Enable auto-merge for non-YMYL pages
  let autoMerged = false
  if (!isYmyl) {
    const mergeResult = run('gh', ['pr', 'merge', prUrl, '--auto', '--merge'], {
      GH_TOKEN: ghToken,
    })
    if ((mergeResult.status ?? 1) !== 0) {
      console.warn(
        `[deployTitleVariant] gh pr merge --auto failed: ${String(mergeResult.stderr)}`
      )
    } else {
      autoMerged = true
    }
  }

  // 8. Return to original branch
  run('git', ['checkout', currentBranch])

  // Suppress unused variable warning (relConfigPath is used conceptually)
  void relConfigPath

  return { prUrl, autoMerged }
}
