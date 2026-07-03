import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const customConfig: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  passWithNoTests: true,
}

// next-intl and use-intl ship ESM only; we must transform them through Jest.
// createJestConfig merges with Next.js defaults, so we override transformIgnorePatterns
// via the async wrapper to ensure our pattern takes precedence.
export default async function jestConfig(): Promise<Config> {
  const nextJestConfig = await createJestConfig(customConfig)()
  return {
    ...nextJestConfig,
    // next-intl, use-intl, and @formatjs/* ship ESM only — must be transformed.
    transformIgnorePatterns: [
      '/node_modules/(?!(next-intl|use-intl|@formatjs/))',
    ],
  }
}
