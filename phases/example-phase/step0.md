# Step 0: project-setup

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `/CLAUDE.md`
- `/docs/ARCHITECTURE.md`
- `/docs/ADR.md`

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

- `--src-dir`: 소스 코드를 `src/` 하위에 둔다 (`ARCHITECTURE.md` 디렉토리 구조 기준)
- `--no-import-alias`: `@/` alias 대신 상대경로 사용
- `--eslint`: Next.js 기본 ESLint 설정 포함

### 2. TypeScript strict 모드 확인

`tsconfig.json`의 `compilerOptions`에 아래 옵션이 있는지 확인하고, 없으면 추가한다:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 3. 디렉토리 구조 생성

`ARCHITECTURE.md`의 디렉토리 구조에 따라 아래 빈 폴더를 생성한다.
각 폴더에 `.gitkeep` 파일을 두어 git에 추적되도록 한다:

```
src/
├── app/
│   └── api/
├── components/
│   ├── ui/
│   └── layout/
├── hooks/
├── lib/
│   ├── api/
│   ├── mock/
│   └── utils/
└── types/
```

### 4. ESLint 커스텀 규칙 설치

`ARCHITECTURE.md`의 "ESLint 규칙" 섹션을 참고하여 아래 패키지를 설치한다:

```bash
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-import
```

그런 다음 `eslint.config.mjs`에 커스텀 규칙을 추가한다.
정확한 규칙 내용은 `/docs/ARCHITECTURE.md`의 "ESLint 규칙" 섹션을 그대로 적용한다.

### 5. Jest 설정

```bash
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest
```

`jest.config.ts`를 생성한다:

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

`jest.setup.ts`를 생성한다:

```ts
import '@testing-library/jest-dom'
```

`package.json`의 `scripts`에 추가한다:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

### 6. 불필요한 기본 파일 정리

`create-next-app`이 생성한 기본 예시 코드를 제거한다:

- `src/app/page.tsx` — 기본 내용 전부 지우고 빈 페이지로 교체
- `src/app/globals.css` — Tailwind `@tailwind` 3줄만 남기고 나머지 제거
- `public/` — 기본 이미지 파일(`next.svg`, `vercel.svg` 등) 제거

## Acceptance Criteria

```bash
npm run build   # 컴파일 에러 없음
npm run lint    # ESLint 에러 없음
npm test        # 테스트 실행 가능 (테스트 파일 없어도 exit 0)
```

## 검증 절차

1. 위 AC 커맨드를 순서대로 실행한다.
2. 아래 항목을 직접 확인한다:
   - `src/` 하위에 `components/`, `hooks/`, `lib/`, `types/` 폴더가 존재하는가?
   - `eslint.config.mjs`에 `no-restricted-imports` 규칙이 포함되어 있는가?
   - `tsconfig.json`에 `"strict": true`가 있는가?
3. 결과에 따라 `phases/example-phase/index.json`의 해당 step을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "Next.js 15 + TypeScript strict + Tailwind + Jest + ESLint 커스텀 규칙 설치 완료. src/ 디렉토리 구조 생성."`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `src/app/` 안에 페이지 컴포넌트를 만들지 마라. 이유: 이 step은 초기화만 담당하고, 화면 구현은 이후 step에서 한다.
- `lib/api/`, `lib/mock/`에 실제 코드를 작성하지 마라. 이유: 폴더 구조만 만드는 단계다.
- ESLint 규칙을 임의로 바꾸거나 `eslint-disable` 주석을 추가하지 마라. 이유: 규칙은 `ARCHITECTURE.md`가 기준이다.
- 기존 테스트를 깨뜨리지 마라.
