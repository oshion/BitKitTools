import en from './en.json'
import ko from './ko.json'
import { TOOL_CATEGORIES } from '@/lib/config/tools-config'

const locales = { en, ko }

describe('category messages', () => {
  it.each(Object.entries(locales))('%s has non-empty nav.fun and categoryPage.description.fun', (_, messages) => {
    expect(messages.nav.fun).toBeTruthy()
    expect(messages.categoryPage.description.fun).toBeTruthy()
  })

  it.each(Object.entries(locales))('%s has nav label and description for every category', (_, messages) => {
    const nav: Record<string, string> = messages.nav
    const descriptions: Record<string, string> = messages.categoryPage.description
    for (const category of TOOL_CATEGORIES) {
      expect(nav[category]).toBeTruthy()
      expect(descriptions[category]).toBeTruthy()
    }
  })

  it('EN and KO define the same category description keys', () => {
    expect(Object.keys(en.categoryPage.description).sort()).toEqual(
      Object.keys(ko.categoryPage.description).sort(),
    )
  })
})
