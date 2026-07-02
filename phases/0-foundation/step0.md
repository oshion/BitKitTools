# Step 0: project-setup

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md` (특히 ADR-001: Static Export)

이 프로젝트는 백엔드/DB/인증이 없는 **완전 정적(Static Export) 사이트**다. `app/api/` 라우트 핸들러, middleware, SSR/ISR은 절대 사용하지 않는다.

## 작업

### 1. Next.js 프로젝트 초기화

프로젝트 루트에서 아래 명령어를 실행한다:

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --no-import-alias \
  --eslint
```

### 2. `next.config.mjs` 설정

`docs/ARCHITECTURE.md`의 "next.config 핵심 설정" 섹션 그대로 적용한다:

```js
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
}
export default nextConfig
```

### 3. TypeScript strict 모드 확인

`tsconfig.json`의 `compilerOptions`에 아래 옵션이 있는지 확인하고, 없으면 추가한다:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 4. 디렉토리 구조 생성

`docs/ARCHITECTURE.md`의 디렉토리 구조에 따라 아래 빈 폴더를 생성한다. 각 폴더에 `.gitkeep` 파일을 두어 git에 추적되도록 한다:

```
src/
├── app/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── seo/
│   └── tools/
├── hooks/
├── lib/
│   ├── config/
│   ├── api/
│   ├── i18n/
│   └── utils/
├── store/
└── types/
```

### 5. ESLint 커스텀 규칙 설치

```bash
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-import
```

`docs/ARCHITECTURE.md`의 "ESLint 규칙" 섹션에 정의된 `eslint.config.mjs` 규칙(툴 간 import 금지, lib/utils→lib/api import 금지, no-explicit-any, no-unused-vars)을 그대로 적용한다.

### 6. Jest 설정

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest
```

`jest.config.ts`:

```ts
import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)
```

`jest.setup.ts`:

```ts
import '@testing-library/jest-dom'
```

`package.json`의 `scripts`에 `"test": "jest"`, `"test:watch": "jest --watch"` 추가.

### 7. 불필요한 기본 파일 정리

`create-next-app`이 생성한 기본 예시 코드를 제거한다:

- `src/app/page.tsx` — 기본 내용 전부 지우고 빈 페이지로 교체 (실제 홈은 step 5에서 `app/[locale]/page.tsx`로 만든다)
- `src/app/globals.css` — Tailwind 지시문 3줄만 남기고 나머지 제거
- `public/` — 기본 이미지 파일(`next.svg`, `vercel.svg` 등) 제거

## Acceptance Criteria

```bash
npm run build   # 컴파일 에러 없음 (output: 'export'로 out/ 디렉토리 생성 확인)
npm run lint    # ESLint 에러 없음
npm test        # 테스트 실행 가능 (테스트 파일 없어도 exit 0)
```

## 검증 절차

1. 위 AC 커맨드를 순서대로 실행한다.
2. 아래 항목을 직접 확인한다:
   - `next.config.mjs`에 `output: 'export'`가 있는가?
   - `src/` 하위에 `components/{ui,layout,seo,tools}/`, `hooks/`, `lib/{config,api,i18n,utils}/`, `store/`, `types/` 폴더가 존재하는가?
   - `eslint.config.mjs`에 `no-restricted-imports` 규칙(tools 간 import 금지, lib/api 격리)이 포함되어 있는가?
   - `tsconfig.json`에 `"strict": true`가 있는가?
   - `npm run build` 결과 `out/` 디렉토리가 생성되는가?
3. 결과에 따라 `phases/0-foundation/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "Next.js 15 Static Export + TypeScript strict + Tailwind + Jest + ESLint 커스텀 규칙 설치 완료. src/ 디렉토리 구조 생성."`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `app/api/` 라우트 핸들러 폴더나 파일을 만들지 마라. 이유: `output: 'export'`와 호환되지 않으며, 만들어도 배포 환경에서 동작하지 않는다.
- `middleware.ts`를 만들지 마라. 이유: Static Export는 middleware를 지원하지 않는다. 언어 라우팅은 다음 step(`i18n-foundation`)에서 middleware 없이 처리한다.
- `src/app/` 안에 실제 페이지 컴포넌트(홈, 툴 등)를 만들지 마라. 이유: 이 step은 초기화만 담당하고, 화면 구현은 이후 step에서 한다.
- `lib/config/`, `lib/api/`, `lib/utils/`, `lib/i18n/`에 실제 코드를 작성하지 마라. 이유: 폴더 구조만 만드는 단계다.
- ESLint 규칙을 임의로 바꾸거나 `eslint-disable` 주석을 추가하지 마라. 이유: 규칙은 `docs/ARCHITECTURE.md`가 기준이다.
- 기존 테스트를 깨뜨리지 마라.
