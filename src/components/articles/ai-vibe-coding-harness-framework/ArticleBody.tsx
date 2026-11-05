import type { ReactNode } from 'react'
import { HARNESS_ORIGINAL_REPO, HARNESS_POOR_REPO } from '@/lib/config/articles-config'

type Props = { locale: 'en' | 'ko' }

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-semibold text-white pt-4 scroll-mt-20">
      {children}
    </h2>
  )
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-xl font-medium text-white pt-2">{children}</h3>
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-base text-neutral-300 leading-relaxed">{children}</p>
}

function UL({ children }: { children: ReactNode }) {
  return <ul className="list-disc pl-6 space-y-2 text-base text-neutral-300 leading-relaxed">{children}</ul>
}

function OL({ children }: { children: ReactNode }) {
  return <ol className="list-decimal pl-6 space-y-2 text-base text-neutral-300 leading-relaxed">{children}</ol>
}

function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-sm text-amber-200">{children}</code>
}

function Pre({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 font-mono text-sm text-neutral-300 leading-relaxed">
      {children}
    </pre>
  )
}

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener" className="text-[#f59e0b] underline underline-offset-4 hover:text-amber-300">
      {children}
    </a>
  )
}

function RepoCta({ label, note }: { label: string; note: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-[#141414] p-6 space-y-3">
      <a
        href={HARNESS_POOR_REPO}
        target="_blank"
        rel="noopener"
        className="inline-block rounded-lg bg-white text-black px-5 py-2.5 text-base font-medium hover:bg-neutral-200 transition-colors"
      >
        {label}
      </a>
      <p className="text-sm text-neutral-500">{note}</p>
    </div>
  )
}

const FLOW = `문서 작성 (PRD · ARCHITECTURE · ADR · specs)
   ↓
/harness ── step 계획 생성 → 사람이 승인
   ↓
execute.py ── step마다 새 세션: 구현 → 검증 → 커밋
   ↓
/review ── 규칙 위반 탐지·수정
   ↓
마일스톤 체크리스트로 사람이 직접 테스트 → PR`

const FLOW_EN = `Write docs (PRD · ARCHITECTURE · ADR · specs)
   ↓
/harness ── generate step plan → human approves
   ↓
execute.py ── new session per step: implement → verify → commit
   ↓
/review ── detect & fix rule violations
   ↓
Human tests manually via milestone checklist → PR`

const RUN = `py -3 scripts/execute.py m0-foundation                         # Windows
python3 scripts/execute.py m0-foundation                       # macOS / Linux
py -3 scripts/execute.py m0-foundation --limit-threshold 0.9   # 더 일찍 멈추기`

const RUN_EN = `py -3 scripts/execute.py m0-foundation                         # Windows
python3 scripts/execute.py m0-foundation                       # macOS / Linux
py -3 scripts/execute.py m0-foundation --limit-threshold 0.9   # stop earlier`

// Answer-first definition box — the sentence search/AI overviews can quote directly.
function Summary({ label, children }: { label: string; children: ReactNode }) {
  return (
    <aside className="rounded-lg border border-[#f59e0b]/40 bg-amber-950/10 p-6 space-y-2">
      <p className="text-sm font-medium text-[#f59e0b]">{label}</p>
      <p className="text-lg text-neutral-200 leading-relaxed">{children}</p>
    </aside>
  )
}

function KoBody() {
  return (
    <>
      <Summary label="한 줄 요약">
        하네스(harness)는 AI 코딩 에이전트가 정해진 문서·작은 작업 단위(step)·자동 검증 안에서만 일하도록 묶어 두는
        실행 틀입니다. harness_framework_poor는 여기에 &ldquo;Claude 사용량 한도에 걸리면 리셋까지 기다렸다가 같은 세션을
        이어서 실행하는&rdquo; 기능을 더한 공개 하네스입니다.
      </Summary>

      <H2 id="problem">바이브코딩이 커지면 생기는 문제</H2>
      <P>
        AI 에이전트에게 &ldquo;앱 만들어 줘&rdquo;라고 한 번에 맡기면 처음에는 빠르게 진행됩니다. 그런데 대화가 길어질수록
        에이전트는 앞에서 정한 규칙을 잊고, 폴더 구조를 제멋대로 바꾸고, 테스트 없이 코드를 쌓기 시작합니다. 한 세션의
        맥락(context)에 이전 시행착오가 계속 쌓이면서 판단이 흐려지는 것도 원인입니다.
      </P>

      <H2 id="what-is-harness">하네스 프레임워크란?</H2>
      <P>
        하네스(harness, 말의 마구)는 에이전트가 <strong className="text-white">정해진 길로만 가게</strong> 묶어 두는
        장치입니다. 프롬프트를 잘 쓰는 기술이 아니라, 에이전트가 일하는 <em>환경과 절차</em>를 설계하는 방식이라
        &ldquo;하네스 엔지니어링&rdquo;이라고도 부릅니다. 핵심은 다섯 가지입니다.
      </P>
      <OL>
        <li>
          <strong className="text-white">문서가 기준</strong> — 기획(PRD)·아키텍처·기술 결정(ADR)·규칙(<Code>AGENTS.md</Code>)을
          먼저 씁니다.
        </li>
        <li>
          <strong className="text-white">작게 쪼갠 계획</strong> — <Code>/harness</Code>가 문서를 읽고 작업을 step 지시서(
          <Code>phases/&#123;phase&#125;/step&#123;N&#125;.md</Code>)로 나눕니다. 사람이 검토하고 승인합니다.
        </li>
        <li>
          <strong className="text-white">step마다 새 세션</strong> — <Code>scripts/execute.py</Code>가 step 하나마다 새 Claude
          세션을 열고, 규칙 문서를 매번 넣어 주고 앞 step의 요약만 넘겨서 맥락이 오염되지 않습니다.
        </li>
        <li>
          <strong className="text-white">스스로 검증</strong> — 각 step은 실행 가능한 완료 조건(<Code>npm run check</Code> 등)을
          통과해야 끝납니다. 실패하면 에러를 다시 넣어 최대 3회 고칩니다.
        </li>
        <li>
          <strong className="text-white">안전장치</strong> — 훅이 위험한 명령과 테스트 없는 구현을 막고, 끝나면{' '}
          <Code>/review</Code>로 한 번 더 걸러냅니다.
        </li>
      </OL>

      <H2 id="workflow">하네스 작업 흐름</H2>
      <Pre>{FLOW}</Pre>
      <P>
        사람은 문서를 쓰고, step 계획을 승인하고, 마일스톤이 끝날 때 직접 테스트합니다. 그 사이의 구현·검증·커밋은
        하네스가 step 단위로 반복합니다.
      </P>

      <H2 id="token-cost">하네스의 숨은 비용: 토큰</H2>
      <P>
        하네스는 step마다 새 세션을 열고 그때마다 규칙 문서를 통째로 읽습니다. 맥락이 깨끗해지는 대신{' '}
        <strong className="text-white">토큰이 녹습니다.</strong> Claude 구독에는 5시간·주간 사용량 한도가 있어서, 밤에
        phase를 걸어 두고 자면 이런 일이 생깁니다.
      </P>
      <OL>
        <li>밤에 phase를 걸어 두고 잔다.</li>
        <li>새벽 3시에 사용량 한도에 걸려 step이 실패로 끝난다.</li>
        <li>아침에 일어나 그걸 발견하고, 리셋까지 다시 기다린다.</li>
        <li>&ldquo;이어서 하기&rdquo;를 직접 누른다.</li>
      </OL>

      <H2 id="harness-framework-poor">가난한 사람을 위한 하네스, harness_framework_poor</H2>
      <P>
        그래서 저(BitKitTools 운영자)는 추가 사용량을 결제하는 대신, <strong className="text-white">기다리는 것까지
        하네스에게 맡긴</strong> 하네스를 만들었습니다. 이름도 솔직하게{' '}
        <Ext href={HARNESS_POOR_REPO}>harness_framework_poor</Ext>입니다. 돈 대신 시간으로 냅니다.
      </P>

      <H3>⏳ 사용량 한도 자동 대기·이어 하기</H3>
      <UL>
        <li>
          <Code>claude -p</Code>를 <Code>stream-json</Code>으로 실행해 매번 <strong className="text-white">5시간·주간 사용량과
          리셋 시각</strong>을 확인합니다.
        </li>
        <li>사용량이 95% 이상이면 새 step을 시작하지 않고, 리셋 시각까지 기다렸다가 스스로 시작합니다.</li>
        <li>
          step 도중에 한도에 걸려 끊겨도 실패로 치지 않습니다. 리셋 후 <Code>--resume</Code>으로{' '}
          <strong className="text-white">같은 세션을 이어서</strong> 하던 맥락 그대로 마저 끝냅니다.
        </li>
        <li>
          기준은 <Code>--limit-threshold 0.9</Code>처럼 바꿀 수 있습니다. Windows에서는 기다리는 동안 PC가 절전으로 들어가지
          않게 막습니다.
        </li>
      </UL>
      <Pre>{RUN}</Pre>

      <H3>📚 다시 하는 일을 줄이는 문서 체계</H3>
      <P>토큰을 아끼다 보면 &ldquo;한 번에 제대로&rdquo; 끝내는 게 가장 싸다는 걸 알게 됩니다. 그래서 문서를 보강했습니다.</P>
      <UL>
        <li>
          <Code>docs/progress.md</Code> — 마일스톤 체크리스트와 결정 대기(블로커) 표. 체크리스트 1개 = step 1개 = 커밋 1개
        </li>
        <li>
          <Code>docs/milestone-checklist.md</Code> — 마일스톤이 끝나면 사람이 직접 확인하는 테스트 목록
        </li>
        <li>
          <Code>docs/specs/</Code> — 시스템별 상세 스펙. 스펙 없이 코드부터 쓰지 않습니다. 필요한 스펙만 step에 넣어 토큰을
          아낍니다.
        </li>
        <li>
          <Code>docs/tech-debt-tracker.md</Code> — 에이전트는 git log를 읽지 않으므로 알려진 부채를 여기 남겨 매 step에 전달
        </li>
      </UL>

      <H3>🧭 /harness · /review 강화</H3>
      <UL>
        <li>
          <Code>/harness</Code> — 체크리스트 단위로 step을 나누고, 순수 로직·테스트 → 서버 → 클라이언트 → E2E 순서를 지키며,
          스펙이 없거나 결정이 안 된 게 있으면 계획 전에 먼저 묻습니다.
        </li>
        <li>
          <Code>/review</Code> — 눈으로 보던 체크리스트를 grep 자동 탐지로 바꿔 <Code>any</Code> 타입, 레이어 위반, 시크릿
          노출, 테스트 누락을 찾고, 위반이 0이 될 때까지 반복합니다.
        </li>
      </UL>

      <H2 id="compare">원본 하네스와 비교</H2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-base text-neutral-300">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400">
              <th className="py-2 pr-4 font-medium">항목</th>
              <th className="py-2 pr-4 font-medium">harness_framework (원본)</th>
              <th className="py-2 font-medium">harness_framework_poor</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-neutral-900">
              <td className="py-2 pr-4">/harness · execute.py · /review · 훅</td>
              <td className="py-2 pr-4">제공</td>
              <td className="py-2">그대로 사용 + 강화</td>
            </tr>
            <tr className="border-b border-neutral-900">
              <td className="py-2 pr-4">사용량 한도 도달 시</td>
              <td className="py-2 pr-4">step 실패</td>
              <td className="py-2">리셋까지 대기 후 같은 세션 이어 하기</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">진행·마일스톤·스펙·부채 문서</td>
              <td className="py-2 pr-4">기본 템플릿</td>
              <td className="py-2">progress · milestone-checklist · specs · tech-debt 추가</td>
            </tr>
          </tbody>
        </table>
      </div>
      <P>
        뼈대는 전부 원본 <Ext href={HARNESS_ORIGINAL_REPO}>jha0313/harness_framework</Ext>에서 왔습니다. poor 버전은 그 위에
        가난 대응 기능과 문서·커맨드 보강을 얹은 것입니다.
      </P>

      <H2 id="built-with-harness">이 사이트도 하네스로 만들었습니다</H2>
      <P>
        BitKitTools는 2026년 7월 3일부터 8월 7일까지 하네스로 <strong className="text-white">18개 phase, 72개 step</strong>을
        실행해 만들었습니다. 기반 설정부터 JSON Formatter·JWT Decoder 같은 툴 16개, 배포 자동화, GA4·Search Console·Clarity
        데이터 수집과 주간 리포트 자동화까지 모두 phase 단위로 쌓았습니다. 하네스를 쓰면서 겪은 토큰 문제가
        harness_framework_poor를 만든 이유입니다.
      </P>

      <H2 id="quick-start">빠르게 시작하기</H2>
      <P>
        필요한 것: <Ext href="https://claude.com/claude-code">Claude Code</Ext> CLI, Python 3.10+, Node 20+, git, bash(Windows는
        Git for Windows).
      </P>
      <OL>
        <li>저장소 파일을 새 프로젝트 폴더에 복사하고 <Code>git init</Code> 후 첫 커밋을 합니다.</li>
        <li>
          <Code>AGENTS.md</Code>, <Code>docs/PRD.md</Code>, <Code>docs/ARCHITECTURE.md</Code>, <Code>docs/ADR.md</Code>의{' '}
          <Code>&#123; &#125;</Code> 부분을 채웁니다.
        </li>
        <li>
          <Code>docs/progress.md</Code>에 마일스톤 체크리스트를, <Code>docs/specs/</Code>에 첫 마일스톤 스펙을 씁니다.
        </li>
        <li>
          Claude Code에서 <Code>/harness</Code>를 실행하고 step 계획을 검토해 승인합니다.
        </li>
        <li>
          <Code>execute.py</Code>로 실행하고 잡니다. 일어나면 <Code>/review</Code> → 마일스톤 체크리스트로 직접 테스트 → PR.
        </li>
      </OL>

      <H2 id="cautions">쓰기 전에 알아둘 것</H2>
      <UL>
        <li>
          step 세션은 <Code>--dangerously-skip-permissions</Code>로 실행됩니다(권한 확인 없이 파일 수정·명령 실행). 신뢰할 수
          있는 저장소에서만 쓰고 훅을 끄지 마세요.
        </li>
        <li>자동 대기는 Claude 구독 사용량 기준입니다. 종량제 API 키에는 한도 대신 비용이 청구되므로 해당되지 않습니다.</li>
        <li>주간 한도까지 다 쓰면 며칠을 기다릴 수도 있습니다. 노트북 덮개를 닫으면 절전 방지도 소용없으니 전원을 꽂아 두세요.</li>
      </UL>

      <RepoCta label="GitHub에서 harness_framework_poor 보기 →" note={HARNESS_POOR_REPO} />
    </>
  )
}

function EnBody() {
  return (
    <>
      <Summary label="TL;DR">
        A harness is an execution framework that keeps an AI coding agent working only within fixed documents, small
        steps and automatic checks. harness_framework_poor is a public harness that adds one thing: when the Claude usage
        limit is reached, it waits for the reset and resumes the same session on its own.
      </Summary>

      <H2 id="problem">The problem with vibe coding at scale</H2>
      <P>
        Hand an AI agent &ldquo;build me an app&rdquo; in one go and it moves fast at first. But as the conversation grows, the
        agent forgets the rules you set, reshapes the folder structure on its own and piles up code without tests. Part of
        the cause is that every earlier trial and error keeps accumulating in a single session&rsquo;s context.
      </P>

      <H2 id="what-is-harness">What is a harness framework?</H2>
      <P>
        A harness is a device that keeps the agent <strong className="text-white">on a fixed path</strong>. It is not a
        prompt-writing trick but a way of designing the <em>environment and procedure</em> the agent works in — which is
        why it is also called &ldquo;harness engineering.&rdquo; It comes down to five things.
      </P>
      <OL>
        <li>
          <strong className="text-white">Docs are the source of truth</strong> — write the PRD, architecture, technical
          decisions (ADR) and rules (<Code>AGENTS.md</Code>) first.
        </li>
        <li>
          <strong className="text-white">Plans broken into small pieces</strong> — <Code>/harness</Code> reads the docs and
          splits the work into step instructions (<Code>phases/&#123;phase&#125;/step&#123;N&#125;.md</Code>). A human reviews and
          approves them.
        </li>
        <li>
          <strong className="text-white">A fresh session per step</strong> — <Code>scripts/execute.py</Code> opens a new Claude
          session for each step, injects the rule docs every time and passes along only summaries of previous steps, so the
          context never gets polluted.
        </li>
        <li>
          <strong className="text-white">Self-verification</strong> — each step must pass an executable completion check (e.g.{' '}
          <Code>npm run check</Code>). On failure the error is fed back for up to 3 fix attempts.
        </li>
        <li>
          <strong className="text-white">Safety nets</strong> — hooks block dangerous commands and implementations without
          tests, and <Code>/review</Code> does one more pass at the end.
        </li>
      </OL>

      <H2 id="workflow">The harness workflow</H2>
      <Pre>{FLOW_EN}</Pre>
      <P>
        The human writes the docs, approves the step plan and tests at the end of each milestone. In between, the harness
        repeats implement → verify → commit one step at a time.
      </P>

      <H2 id="token-cost">The hidden cost of a harness: tokens</H2>
      <P>
        A harness opens a new session for every step, and each one reads the full rule docs. You get a clean context, but{' '}
        <strong className="text-white">tokens melt.</strong> Claude subscriptions have 5-hour and weekly usage limits, so
        kicking off a phase before bed tends to go like this:
      </P>
      <OL>
        <li>Kick off a phase at night and go to sleep.</li>
        <li>At 3 a.m. the usage limit hits and the step ends as a failure.</li>
        <li>Wake up, discover it, and wait for the reset all over again.</li>
        <li>Manually hit &ldquo;continue.&rdquo;</li>
      </OL>

      <H2 id="harness-framework-poor">A harness for the poor: harness_framework_poor</H2>
      <P>
        So instead of paying for extra usage, I (the person behind BitKitTools) built a harness that{' '}
        <strong className="text-white">does the waiting, too</strong>. The name is honest:{' '}
        <Ext href={HARNESS_POOR_REPO}>harness_framework_poor</Ext>. You pay in time instead of money.
      </P>

      <H3>⏳ Auto-wait &amp; resume on usage limits</H3>
      <UL>
        <li>
          Runs <Code>claude -p</Code> with <Code>stream-json</Code> to check the{' '}
          <strong className="text-white">5-hour and weekly usage plus reset times</strong> on every call.
        </li>
        <li>At 95% usage or higher it won&rsquo;t start a new step — it waits until the reset time, then starts on its own.</li>
        <li>
          If a step is cut off mid-run by the limit, it doesn&rsquo;t count as a failure. After the reset it uses{' '}
          <Code>--resume</Code> to <strong className="text-white">continue the same session</strong> with its context intact.
        </li>
        <li>
          Change the threshold with e.g. <Code>--limit-threshold 0.9</Code>. On Windows it keeps the PC from sleeping while it
          waits.
        </li>
      </UL>
      <Pre>{RUN_EN}</Pre>

      <H3>📚 A documentation system that cuts rework</H3>
      <P>Saving tokens teaches you that getting it right the first time is the cheapest option, so the docs were strengthened.</P>
      <UL>
        <li>
          <Code>docs/progress.md</Code> — milestone checklist and a pending-decisions (blockers) table. One checklist item = one
          step = one commit
        </li>
        <li>
          <Code>docs/milestone-checklist.md</Code> — tests a human runs by hand when a milestone is done
        </li>
        <li>
          <Code>docs/specs/</Code> — per-system specs; no code before a spec. Only the specs a step needs are injected, to save
          tokens.
        </li>
        <li>
          <Code>docs/tech-debt-tracker.md</Code> — agents don&rsquo;t read git log, so known debt is recorded here and passed to
          every step
        </li>
      </UL>

      <H3>🧭 Stronger /harness and /review</H3>
      <UL>
        <li>
          <Code>/harness</Code> — splits steps by checklist item, keeps the layer order (pure logic &amp; tests → server → client →
          E2E) and asks first when a spec is missing or a decision is open.
        </li>
        <li>
          <Code>/review</Code> — replaces the eyeball checklist with grep-based detection of <Code>any</Code> types, layer
          violations, exposed secrets and missing tests, looping until violations reach zero.
        </li>
      </UL>

      <H2 id="compare">Compared with the original harness</H2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-base text-neutral-300">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400">
              <th className="py-2 pr-4 font-medium">Item</th>
              <th className="py-2 pr-4 font-medium">harness_framework (original)</th>
              <th className="py-2 font-medium">harness_framework_poor</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-neutral-900">
              <td className="py-2 pr-4">/harness · execute.py · /review · hooks</td>
              <td className="py-2 pr-4">Provided</td>
              <td className="py-2">Kept as-is, strengthened</td>
            </tr>
            <tr className="border-b border-neutral-900">
              <td className="py-2 pr-4">Hitting the usage limit</td>
              <td className="py-2 pr-4">Step fails</td>
              <td className="py-2">Waits for the reset, resumes the same session</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Progress, milestone, spec and debt docs</td>
              <td className="py-2 pr-4">Base templates</td>
              <td className="py-2">Adds progress · milestone-checklist · specs · tech-debt</td>
            </tr>
          </tbody>
        </table>
      </div>
      <P>
        The whole skeleton comes from the original <Ext href={HARNESS_ORIGINAL_REPO}>jha0313/harness_framework</Ext>; the poor
        version adds budget-friendly features and stronger docs and commands on top.
      </P>

      <H2 id="built-with-harness">This site was built with a harness</H2>
      <P>
        BitKitTools was built by running <strong className="text-white">18 phases and 72 steps</strong> through a harness
        between July 3 and August 7, 2026 — from the foundation to 16 tools such as the JSON Formatter and JWT Decoder,
        deployment automation, and GA4 / Search Console / Clarity data collection with automated weekly reports. The token
        problems hit along the way are why harness_framework_poor exists.
      </P>

      <H2 id="quick-start">Quick start</H2>
      <P>
        You need the <Ext href="https://claude.com/claude-code">Claude Code</Ext> CLI, Python 3.10+, Node 20+, git and bash (Git
        for Windows on Windows).
      </P>
      <OL>
        <li>
          Copy the repository files into a new project folder, run <Code>git init</Code> and make the first commit.
        </li>
        <li>
          Fill in the <Code>&#123; &#125;</Code> parts of <Code>AGENTS.md</Code>, <Code>docs/PRD.md</Code>,{' '}
          <Code>docs/ARCHITECTURE.md</Code> and <Code>docs/ADR.md</Code>.
        </li>
        <li>
          Write a milestone checklist in <Code>docs/progress.md</Code> and the first milestone spec in <Code>docs/specs/</Code>.
        </li>
        <li>
          Run <Code>/harness</Code> in Claude Code, then review and approve the step plan.
        </li>
        <li>
          Run <Code>execute.py</Code> and go to sleep. When you wake up: <Code>/review</Code> → test by hand with the milestone
          checklist → PR.
        </li>
      </OL>

      <H2 id="cautions">Before you use it</H2>
      <UL>
        <li>
          Step sessions run with <Code>--dangerously-skip-permissions</Code> (file edits and commands without permission
          prompts). Use it only in a repository you trust and keep the hooks on.
        </li>
        <li>
          Auto-wait works off Claude subscription usage. With a pay-as-you-go API key you get a bill instead of a limit, so it
          doesn&rsquo;t apply.
        </li>
        <li>
          If you burn through the weekly limit you may wait for days. Closing the laptop lid defeats the sleep prevention, so
          keep it plugged in.
        </li>
      </UL>

      <RepoCta label="View harness_framework_poor on GitHub →" note={HARNESS_POOR_REPO} />
    </>
  )
}

export default function ArticleBody({ locale }: Props) {
  return locale === 'ko' ? <KoBody /> : <EnBody />
}
