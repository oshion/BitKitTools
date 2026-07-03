import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      // 1. tools/{slug} 간 상호 import 금지 (컴포넌트 격리)
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["**/components/tools/*/*"],
            message: "다른 tool 폴더를 직접 import 금지. 공통 로직은 components/ui/ 또는 lib/utils/로 추출하라.",
          },
          // 2. lib/utils/에서 lib/api/ import 금지 (순수 함수 유지)
          {
            group: ["**/lib/api/*"],
            message: "lib/utils/는 순수 함수여야 한다. 외부 fetch가 필요하면 컴포넌트에서 lib/api/를 직접 호출하라.",
          },
        ],
      }],

      // 3. any 타입 사용 금지
      "@typescript-eslint/no-explicit-any": "error",

      // 4. 미사용 변수 금지
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
]);

export default eslintConfig;
