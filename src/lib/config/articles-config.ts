import type { ArticleConfig } from '@/types/article'
import type { ToolCategory } from '@/types/tool'

export const HARNESS_POOR_REPO = 'https://github.com/oshion/harness_framework_poor'
export const HARNESS_ORIGINAL_REPO = 'https://github.com/jha0313/harness_framework'

export const articlesConfig: ArticleConfig[] = [
  {
    id: 'ai-vibe-coding-harness-framework',
    slug: 'ai-vibe-coding-harness-framework',
    category: 'developer',
    title: {
      en: 'AI Vibe Coding Harness Framework: Run Claude Code on a Budget',
      ko: 'AI 바이브코딩 하네스 프레임워크란? Claude Code 토큰 아끼는 가난한 하네스',
    },
    description: {
      en: 'What an AI coding harness is, how it keeps Claude Code on track with docs, small steps and checks, and a free harness that waits out usage limits.',
      ko: 'AI 바이브코딩에서 하네스가 무엇인지, Claude Code 에이전트를 문서·작은 step·자동 검증으로 묶는 방법과, 사용량 한도에 걸리면 리셋까지 기다렸다 이어서 실행하는 공개 하네스 harness_framework_poor를 소개합니다.',
    },
    keywords: {
      en: [
        'vibe coding',
        'AI coding harness',
        'harness framework',
        'Claude Code harness',
        'harness engineering',
        'AI coding agent workflow',
        'Claude Code usage limit',
        'Claude Code token saving',
        'harness_framework_poor',
      ],
      ko: [
        'AI 바이브코딩',
        '바이브코딩 하네스',
        '하네스 프레임워크',
        'Claude Code 하네스',
        '하네스 엔지니어링',
        'AI 코딩 에이전트',
        'Claude Code 토큰 절약',
        'Claude 사용량 한도',
        'harness_framework_poor',
      ],
    },
    publishedAt: '2026-11-05',
    updatedAt: '2026-11-05',
    readingMinutes: 8,
    faq: [
      {
        question: {
          en: 'What is vibe coding?',
          ko: '바이브코딩(vibe coding)이란 무엇인가요?',
        },
        answer: {
          en: 'Vibe coding is building software by describing what you want to an AI coding agent in natural language and steering it by looking at the result, instead of writing most of the code yourself. It is fast for small projects, but as a project grows the agent tends to forget rules and drift into inconsistent structures — which is the problem a harness addresses.',
          ko: '바이브코딩은 코드를 직접 대부분 작성하는 대신, AI 코딩 에이전트에게 원하는 것을 자연어로 설명하고 결과를 보면서 방향을 잡아 가는 개발 방식입니다. 작은 프로젝트에서는 빠르지만, 규모가 커질수록 에이전트가 규칙을 잊고 구조가 흐트러지기 쉽습니다. 하네스는 바로 이 문제를 다룹니다.',
        },
      },
      {
        question: {
          en: 'How is a harness different from just writing a CLAUDE.md file?',
          ko: '하네스는 CLAUDE.md에 규칙을 적어 두는 것과 무엇이 다른가요?',
        },
        answer: {
          en: 'A CLAUDE.md file only tells the agent the rules. A harness enforces them: it splits the work into small approved steps, runs each step in a fresh session with the rule documents injected, requires an executable completion check to pass, and uses hooks to block dangerous commands or code without tests.',
          ko: 'CLAUDE.md는 규칙을 알려 줄 뿐입니다. 하네스는 그 규칙을 강제합니다. 작업을 사람이 승인한 작은 step으로 나누고, step마다 규칙 문서를 넣은 새 세션에서 실행하며, 실행 가능한 완료 조건을 통과해야 끝나게 하고, 훅으로 위험한 명령이나 테스트 없는 구현을 막습니다.',
        },
      },
      {
        question: {
          en: 'What does harness_framework_poor add to the original harness_framework?',
          ko: 'harness_framework_poor는 원본 harness_framework와 무엇이 다른가요?',
        },
        answer: {
          en: 'It keeps the whole skeleton of jha0313/harness_framework (the /harness command, execute.py, /review, hooks and doc templates) and adds automatic waiting and resuming on Claude usage limits, a documentation system (progress checklist, milestone checklist, specs, tech-debt tracker), and stronger /harness and /review commands.',
          ko: 'jha0313/harness_framework의 뼈대(/harness 커맨드, execute.py, /review, 훅, 문서 템플릿)를 그대로 쓰고, 그 위에 Claude 사용량 한도 자동 대기·이어 하기, 문서 체계(진행 체크리스트, 마일스톤 체크리스트, 스펙, 기술 부채 기록), 강화된 /harness·/review 커맨드를 더했습니다.',
        },
      },
      {
        question: {
          en: 'What happens when the harness hits the Claude usage limit?',
          ko: '실행 중에 Claude 사용량 한도에 걸리면 어떻게 되나요?',
        },
        answer: {
          en: 'At 95% or more of the 5-hour or weekly usage window it does not start a new step; it waits until the reset time and then continues on its own. If a step is cut off mid-run by the limit, it is not counted as a failure — after the reset the same session is resumed with --resume, so the context is kept. The threshold can be changed with --limit-threshold.',
          ko: '5시간 또는 주간 사용량이 95% 이상이면 새 step을 시작하지 않고 리셋 시각까지 기다렸다가 스스로 이어서 진행합니다. step 도중에 한도에 걸려 끊겨도 실패로 처리하지 않고, 리셋 후 --resume으로 같은 세션을 이어서 맥락을 그대로 유지합니다. 기준값은 --limit-threshold로 바꿀 수 있습니다.',
        },
      },
      {
        question: {
          en: 'Does the auto-wait feature work with a pay-as-you-go API key?',
          ko: 'API 키(종량제)로 써도 자동 대기 기능이 동작하나요?',
        },
        answer: {
          en: 'The harness itself works, but the auto-wait feature is based on Claude subscription usage windows (5-hour and weekly). With a pay-as-you-go API key there is no usage window to wait for — you are billed instead — so the feature does not apply.',
          ko: '하네스 자체는 동작하지만, 자동 대기 기능은 Claude 구독의 5시간·주간 사용량 창을 기준으로 합니다. 종량제 API 키에는 기다릴 사용량 창이 없고 대신 비용이 청구되므로 이 기능은 해당되지 않습니다.',
        },
      },
      {
        question: {
          en: 'What do I need to run it?',
          ko: '실행하려면 무엇이 필요한가요?',
        },
        answer: {
          en: 'The Claude Code CLI, Python 3.10+, Node 20+, git and bash (Git for Windows on Windows). Step sessions run with --dangerously-skip-permissions, so use it only in a repository you trust and keep the hooks enabled.',
          ko: 'Claude Code CLI, Python 3.10 이상, Node 20 이상, git, bash(Windows는 Git for Windows)가 필요합니다. step 세션은 --dangerously-skip-permissions로 실행되므로 신뢰할 수 있는 저장소에서만 쓰고 훅을 끄지 마세요.',
        },
      },
    ],
    relatedToolIds: ['json-formatter', 'jwt-decoder', 'json-to-sql'],
    externalLinks: [
      {
        label: { en: 'harness_framework_poor', ko: 'harness_framework_poor' },
        url: HARNESS_POOR_REPO,
        kind: 'repository',
      },
      {
        label: { en: 'harness_framework (original)', ko: 'harness_framework (원본)' },
        url: HARNESS_ORIGINAL_REPO,
        kind: 'repository',
      },
    ],
  },
]

export function getArticleBySlug(category: ToolCategory, slug: string): ArticleConfig | undefined {
  return articlesConfig.find((a) => a.category === category && a.slug === slug)
}

export function getArticlesByCategory(category: ToolCategory): ArticleConfig[] {
  return articlesConfig
    .filter((a) => a.category === category)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

/** Locale-agnostic paths (no trailing slash) for the sitemap. */
export function getArticlePaths(): Array<{ path: string; lastModified: string }> {
  return articlesConfig.map((a) => ({
    path: `/${a.category}/articles/${a.slug}`,
    lastModified: a.updatedAt,
  }))
}
