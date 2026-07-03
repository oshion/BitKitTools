import { localeHref, stripLocalePrefix } from './locale-href'

describe('localeHref', () => {
  // NODE_ENV is 'test' under Jest, so these assertions exercise the production
  // (prefix-less EN) branch — the branch actually served by the static export.
  it('returns prefix-less root for EN home', () => {
    expect(localeHref('en')).toBe('/')
  })

  it('returns prefix-less path for EN category', () => {
    expect(localeHref('en', '/developer')).toBe('/developer')
  })

  it('returns /ko for KO home', () => {
    expect(localeHref('ko')).toBe('/ko')
  })

  it('returns /ko/{path} for KO category', () => {
    expect(localeHref('ko', '/developer')).toBe('/ko/developer')
  })

  it('adds a leading slash to a path missing one', () => {
    expect(localeHref('en', 'developer')).toBe('/developer')
    expect(localeHref('ko', 'developer')).toBe('/ko/developer')
  })

  it('uses explicit /en prefix in development (real dev-server route)', () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'development')
    expect(localeHref('en')).toBe('/en')
    expect(localeHref('en', '/developer')).toBe('/en/developer')
    jest.replaceProperty(process.env, 'NODE_ENV', 'test')
  })
})

describe('stripLocalePrefix', () => {
  it('strips a leading /en segment', () => {
    expect(stripLocalePrefix('/en')).toBe('')
    expect(stripLocalePrefix('/en/developer')).toBe('/developer')
  })

  it('strips a leading /ko segment', () => {
    expect(stripLocalePrefix('/ko')).toBe('')
    expect(stripLocalePrefix('/ko/developer')).toBe('/developer')
  })

  it('leaves prefix-less paths unchanged', () => {
    expect(stripLocalePrefix('/developer')).toBe('/developer')
    expect(stripLocalePrefix('/')).toBe('/')
  })

  it('does not strip category names that merely start with en/ko (e.g. /enable)', () => {
    expect(stripLocalePrefix('/enable')).toBe('/enable')
  })
})
