/**
 * Model-written claims for the weekly report. Each claim must cite code-computed facts and
 * pass validateClaims() before it is published (docs/report-quality-pipeline.md).
 */

import { describeAnthropicResponse, extractAnthropicText, isTruncated } from './anthropicResponse'
import type { ReportFact } from './reportFacts'

export const REPORT_SECTIONS = {
  good_news: '잘 되고 있는 것',
  zero_ctr: 'CTR 0 페이지',
  bounce: '이탈률 높은 페이지',
  segments: '국가/기기별 CTR 편차',
  intent: '검색 의도',
  rank_changes: '순위 변동',
  quality: '툴 품질 신호',
  ideas: '추가 아이디어',
  lighthouse: 'Lighthouse 성능',
} as const

export type ReportSectionKey = keyof typeof REPORT_SECTIONS
export type ClaimKind = 'observation' | 'hypothesis' | 'recommendation'

export interface ReportClaim {
  section: ReportSectionKey
  kind: ClaimKind
  text: string
  evidence: string[]
}

export type ClaimRule = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6'

export interface RejectedClaim {
  claim: ReportClaim
  rule: ClaimRule
  reason: string
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'
const MODEL = 'claude-sonnet-5'
const MAX_ATTEMPTS = 2

const CLAIM_KINDS: readonly ClaimKind[] = ['observation', 'hypothesis', 'recommendation']

const CLAIMS_SCHEMA = {
  type: 'object',
  properties: {
    claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          section: { type: 'string', enum: Object.keys(REPORT_SECTIONS) },
          kind: { type: 'string', enum: CLAIM_KINDS },
          text: { type: 'string' },
          evidence: { type: 'array', items: { type: 'string' } },
        },
        required: ['section', 'kind', 'text', 'evidence'],
        additionalProperties: false,
      },
    },
  },
  required: ['claims'],
  additionalProperties: false,
}

/** Faults no current data source can show: none of them see the page's code or elements */
const FAULT_WORDS = /버그|결함|오작동|고장|작동하지|동작하지|핸들러|미응답|깨져|깨진/
/** Specific UI parts, which URL-level signals cannot identify */
const ELEMENT_WORDS = /버튼|링크|요소|컴포넌트|아이콘|배지|목차|입력창/
/** Trend language that a small sample cannot support, whatever the claim kind */
const TREND_WORDS = /급증|급감|급등|급락|큰 폭|대폭|성장|견인|입증|추세|뚜렷/
/** Causal or settled language, allowed only when written as a hypothesis */
const CAUSAL_WORDS = /때문|덕분|원인은|로 인해|개선됐|개선되었|악화됐|악화되었|확인됐|확인되었/
const SESSION_GROWTH = /세션[^.。]*(증가|늘었|늘어|급증|성장|견인|성과|상승)/

const PATH_PATTERN = /\/(?:[a-z0-9-]+\/)+|(?<![\w/])\/(?![\w/])/gi
const QUOTED_PATTERN = /"([^"]+)"|“([^”]+)”/g
const DATE_PATTERN = /\d{4}-\d{2}-\d{2}/g
const NUMBER_TOLERANCE = 0.5

function mentionedPaths(text: string): string[] {
  return text.match(PATH_PATTERN) ?? []
}

function quotedQueries(text: string): string[] {
  return [...text.matchAll(QUOTED_PATTERN)].map((match) => match[1] ?? match[2] ?? '')
}

function mentionedNumbers(text: string): number[] {
  const withoutIdentifiers = text
    .replace(DATE_PATTERN, ' ')
    .replace(QUOTED_PATTERN, ' ')
    .replace(PATH_PATTERN, ' ')
  return (withoutIdentifiers.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((n) => Number(n.replace(/,/g, '')))
}

function checkClaim(claim: ReportClaim, factsById: Map<string, ReportFact>, concentrated: boolean) {
  const cited = claim.evidence.map((id) => factsById.get(id))
  if (cited.length === 0 || cited.some((fact) => fact === undefined)) {
    return { rule: 'R1' as const, reason: '근거가 없거나 존재하지 않는 근거를 인용함' }
  }
  const facts = cited.filter((fact): fact is ReportFact => fact !== undefined)

  const allowedValues = facts.flatMap((fact) => fact.values)
  const wrongNumber = mentionedNumbers(claim.text).find(
    (number) => !allowedValues.some((value) => Math.abs(value - number) <= NUMBER_TOLERANCE),
  )
  if (wrongNumber !== undefined) {
    return { rule: 'R2' as const, reason: `인용한 근거에 없는 숫자: ${wrongNumber}` }
  }

  const allowedSubjects = new Set(facts.flatMap((fact) => fact.subjects))
  const wrongSubject = [...mentionedPaths(claim.text), ...quotedQueries(claim.text)].find(
    (subject) => !allowedSubjects.has(subject),
  )
  if (wrongSubject !== undefined) {
    return { rule: 'R3' as const, reason: `인용한 근거에 없는 대상: ${wrongSubject}` }
  }

  if (FAULT_WORDS.test(claim.text)) {
    return { rule: 'R4' as const, reason: '수집 데이터로 확인할 수 없는 기능 결함을 지목함' }
  }
  if (facts.some((fact) => fact.tags?.includes('url-level')) && ELEMENT_WORDS.test(claim.text)) {
    return { rule: 'R4' as const, reason: '페이지 단위 데이터로 특정 화면 요소를 지목함' }
  }

  if (facts.some((fact) => fact.sample === 'small')) {
    if (TREND_WORDS.test(claim.text)) {
      return { rule: 'R5' as const, reason: '소표본으로 추세나 큰 변화를 단정함' }
    }
    if (claim.kind === 'observation' && CAUSAL_WORDS.test(claim.text)) {
      return { rule: 'R5' as const, reason: '소표본으로 원인이나 결과를 단정함' }
    }
  }

  if (concentrated && SESSION_GROWTH.test(claim.text)) {
    return { rule: 'R6' as const, reason: '세션이 하루에 몰린 주에 세션 증가를 성과로 서술함' }
  }
  return null
}

export function validateClaims(
  claims: ReportClaim[],
  facts: ReportFact[],
): { accepted: ReportClaim[]; rejected: RejectedClaim[] } {
  const factsById = new Map(facts.map((fact) => [fact.id, fact]))
  const concentrated = facts.some((fact) => fact.tags?.includes('concentrated'))
  const accepted: ReportClaim[] = []
  const rejected: RejectedClaim[] = []
  for (const claim of claims) {
    const failure = checkClaim(claim, factsById, concentrated)
    if (failure) rejected.push({ claim, ...failure })
    else accepted.push(claim)
  }
  return { accepted, rejected }
}

function isClaim(value: unknown): value is ReportClaim {
  if (typeof value !== 'object' || value === null) return false
  const claim = value as Record<string, unknown>
  return (
    typeof claim.section === 'string' &&
    claim.section in REPORT_SECTIONS &&
    CLAIM_KINDS.includes(claim.kind as ClaimKind) &&
    typeof claim.text === 'string' &&
    Array.isArray(claim.evidence) &&
    claim.evidence.every((id) => typeof id === 'string')
  )
}

export function parseClaimsResponse(text: string): ReportClaim[] | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const claims = (parsed as { claims?: unknown }).claims
  return Array.isArray(claims) && claims.every(isClaim) ? claims : null
}

export function buildClaimsPrompt(facts: ReportFact[], history: string): string {
  const factLines = facts
    .map((fact) => `- [${fact.id}]${fact.sample === 'small' ? ' (소표본)' : ''} ${fact.text}`)
    .join('\n')
  const sections = Object.entries(REPORT_SECTIONS)
    .map(([key, title]) => `- ${key}: ${title}`)
    .join('\n')

  return `당신은 BitKitTools.com의 SEO/콘텐츠 분석가입니다. 아래 사실 목록만 근거로 이번 주 분석 주장을 작성하세요.
사실 목록은 코드가 계산해 리포트 맨 앞에 그대로 실립니다. 같은 내용을 반복하지 말고, 의사결정에 도움이 되는 해석만 쓰세요.

## 사실 목록

${factLines}

## 과거 기록

아래 기록은 이미 시도한 일과 내린 결정을 확인하는 용도입니다. 근거로 인용할 수 없고, 현황 판단에도 쓰지 마세요.

${history || '(기록 없음)'}

## 작성 규칙

- 각 주장은 한국어 1~2문장이고, evidence에 근거 사실의 ID를 정확히 적습니다.
- 숫자는 인용한 사실에 있는 값만 씁니다. 페이지 경로와 큰따옴표로 감싼 쿼리도 인용한 사실에 있는 것만 씁니다.
- kind: observation은 데이터에서 바로 보이는 내용, hypothesis는 확인되지 않은 추정, recommendation은 다음 행동 제안입니다.
- 소표본 사실로 급증, 성장, 추세를 말하지 말고, 원인은 hypothesis로만 씁니다.
- Clarity 수치는 페이지 단위라 어떤 요소를 클릭했는지 알 수 없습니다. 특정 버튼이나 링크, 기능 결함을 추정하지 마세요.
- 세션이 하루에 몰린 주에는 세션 증가를 성과로 쓰지 마세요.
- 근거가 부족한 섹션은 비워 둡니다. 억지로 채우지 마세요.
- 과거 기록에서 이미 거절되거나 효과가 없던 접근은 다시 제안하지 마세요.

## 섹션

${sections}`
}

/**
 * Requests schema-constrained claims, retrying once. Returns null when no usable answer
 * arrives, so the caller publishes the code-computed facts instead of unchecked text.
 */
export async function requestReportClaims(prompt: string, apiKey: string): Promise<ReportClaim[] | null> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_API_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 16000,
          output_config: { format: { type: 'json_schema', schema: CLAIMS_SCHEMA } },
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!response.ok) {
        const errorText = await response.text().catch(() => '(unreadable)')
        console.warn(`[report-claims] Attempt ${attempt}: API error ${response.status}: ${errorText}`)
        continue
      }
      const json = (await response.json()) as { content?: Array<{ type: string; text?: string }>; stop_reason?: string }
      if (isTruncated(json) || json.stop_reason === 'refusal') {
        console.warn(`[report-claims] Attempt ${attempt}: unusable response (${describeAnthropicResponse(json)})`)
        continue
      }
      const claims = parseClaimsResponse(extractAnthropicText(json))
      if (claims) return claims
      console.warn(`[report-claims] Attempt ${attempt}: invalid claims JSON (${describeAnthropicResponse(json)})`)
    } catch (error) {
      console.warn(`[report-claims] Attempt ${attempt}: request failed:`, error)
    }
  }
  return null
}
