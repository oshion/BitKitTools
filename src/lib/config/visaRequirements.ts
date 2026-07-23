/**
 * Static visa requirement reference data.
 *
 * IMPORTANT: This is a static snapshot — NOT a live government data feed.
 * Visa policies change frequently. Always verify with the relevant embassy
 * or consulate before travel.
 *
 * Last reviewed: 2026-07-03
 *
 * Sources consulted:
 *   - IATA Travel Centre (https://www.iata.org/en/services/travel-centre/)
 *   - Henley Passport Index (https://www.henleypassportindex.com/)
 *   - Individual government official sites (consulate/embassy pages)
 *   - EU ETIAS (https://travel-europe.europa.eu/etias_en)
 *   - US State Department (https://travel.state.gov/)
 *   - Australian DFAT (https://smartraveller.gov.au/)
 *   - Wikipedia "Visa policy of ___" articles (used as a secondary aggregator for the
 *     2026-07-23 country-list expansion below; these articles cite official government
 *     sources per-entry — always verify current policy directly before travel)
 *
 * Country list last expanded: 2026-07-23 (added AT, BR, CH, CZ, EG, HK, IE, IL, NZ, PL, TW, ZA
 * plus KR/US/GB-origin entries for each, and DE-origin Schengen entries for CH/AT/PL/CZ).
 */

export type VisaRequirementType = 'visa-free' | 'e-visa' | 'visa-required'

export type VisaRequirementEntry = {
  requirementType: VisaRequirementType
  /** Maximum stay duration in days, undefined when not clearly bounded */
  maxStayDays?: number
  /** English-language note with key details and caveats */
  note: string
}

export type Country = {
  code: string
  name: {
    en: string
    ko: string
  }
}

/** Supported countries available in the dropdowns (sorted by EN name) */
export const COUNTRIES: Country[] = [
  { code: 'AE', name: { en: 'United Arab Emirates', ko: '아랍에미리트' } },
  { code: 'AT', name: { en: 'Austria', ko: '오스트리아' } },
  { code: 'AU', name: { en: 'Australia', ko: '호주' } },
  { code: 'BR', name: { en: 'Brazil', ko: '브라질' } },
  { code: 'CA', name: { en: 'Canada', ko: '캐나다' } },
  { code: 'CH', name: { en: 'Switzerland', ko: '스위스' } },
  { code: 'CN', name: { en: 'China', ko: '중국' } },
  { code: 'CZ', name: { en: 'Czech Republic', ko: '체코' } },
  { code: 'DE', name: { en: 'Germany', ko: '독일' } },
  { code: 'EG', name: { en: 'Egypt', ko: '이집트' } },
  { code: 'ES', name: { en: 'Spain', ko: '스페인' } },
  { code: 'FR', name: { en: 'France', ko: '프랑스' } },
  { code: 'GB', name: { en: 'United Kingdom', ko: '영국' } },
  { code: 'GR', name: { en: 'Greece', ko: '그리스' } },
  { code: 'HK', name: { en: 'Hong Kong', ko: '홍콩' } },
  { code: 'ID', name: { en: 'Indonesia', ko: '인도네시아' } },
  { code: 'IE', name: { en: 'Ireland', ko: '아일랜드' } },
  { code: 'IL', name: { en: 'Israel', ko: '이스라엘' } },
  { code: 'IN', name: { en: 'India', ko: '인도' } },
  { code: 'IT', name: { en: 'Italy', ko: '이탈리아' } },
  { code: 'JP', name: { en: 'Japan', ko: '일본' } },
  { code: 'KR', name: { en: 'South Korea', ko: '대한민국' } },
  { code: 'MX', name: { en: 'Mexico', ko: '멕시코' } },
  { code: 'MY', name: { en: 'Malaysia', ko: '말레이시아' } },
  { code: 'NL', name: { en: 'Netherlands', ko: '네덜란드' } },
  { code: 'NZ', name: { en: 'New Zealand', ko: '뉴질랜드' } },
  { code: 'PH', name: { en: 'Philippines', ko: '필리핀' } },
  { code: 'PL', name: { en: 'Poland', ko: '폴란드' } },
  { code: 'PT', name: { en: 'Portugal', ko: '포르투갈' } },
  { code: 'SG', name: { en: 'Singapore', ko: '싱가포르' } },
  { code: 'TH', name: { en: 'Thailand', ko: '태국' } },
  { code: 'TR', name: { en: 'Turkey (Türkiye)', ko: '튀르키예' } },
  { code: 'TW', name: { en: 'Taiwan', ko: '대만' } },
  { code: 'US', name: { en: 'United States', ko: '미국' } },
  { code: 'VN', name: { en: 'Vietnam', ko: '베트남' } },
  { code: 'ZA', name: { en: 'South Africa', ko: '남아프리카공화국' } },
]

/**
 * Keyed by "FROM:TO" (uppercase ISO 3166-1 alpha-2 country codes).
 * Only covers the most commonly searched combinations for the supported
 * country list above. Unknown pairs return requirementType: 'unknown'.
 */
export const VISA_REQUIREMENTS: Record<string, VisaRequirementEntry> = {
  // ── Korean passport (KR) ────────────────────────────────────────────────
  'KR:US': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'ESTA (Electronic System for Travel Authorization) required. Apply online at esta.cbp.dhs.gov at least 72 hours before travel. ESTA is valid for 2 years and allows multiple entries for up to 90 days each.',
  },
  'KR:JP': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days for tourism or business. Passport must be valid for the duration of your stay.',
  },
  'KR:DE': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period across all Schengen member states combined. ETIAS authorization may be required from 2026; verify before travel.',
  },
  'KR:FR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS authorization may be required from 2026; verify before travel.',
  },
  'KR:IT': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS authorization may be required from 2026; verify before travel.',
  },
  'KR:ES': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS authorization may be required from 2026; verify before travel.',
  },
  'KR:NL': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS authorization may be required from 2026; verify before travel.',
  },
  'KR:GR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS authorization may be required from 2026; verify before travel.',
  },
  'KR:PT': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS authorization may be required from 2026; verify before travel.',
  },
  'KR:GB': {
    requirementType: 'visa-free',
    maxStayDays: 180,
    note: 'No visa required for stays up to 6 months as a visitor. Electronic Travel Authorisation (ETA) is required; apply via the UK ETA app or GOV.UK website before travel.',
  },
  'KR:TH': {
    requirementType: 'visa-free',
    maxStayDays: 60,
    note: 'Visa exemption for up to 60 days for tourism (Thailand extended exemption for Korean nationals). Extendable once at a Thai Immigration office for an additional 30 days.',
  },
  'KR:VN': {
    requirementType: 'visa-free',
    maxStayDays: 45,
    note: 'Visa-free for up to 45 days. A single-entry e-visa is also available if a longer stay is needed.',
  },
  'KR:SG': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days for social visits, tourism, or business.',
  },
  'KR:AU': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'ETA (Electronic Travel Authority, subclass 601) required. Apply through the Australian ETA app or a registered travel agent. Valid for 12 months, multiple entries, up to 90 days per visit.',
  },
  'KR:CN': {
    requirementType: 'visa-free',
    maxStayDays: 15,
    note: 'Visa-free for up to 15 days for tourism or business (bilateral agreement as of 2024). Verify current status before travel as policy may change with little notice.',
  },
  'KR:MY': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'No visa required for stays up to 30 days.',
  },
  'KR:IN': {
    requirementType: 'e-visa',
    maxStayDays: 60,
    note: 'e-Visa required. Apply online via indianvisaonline.gov.in at least 4 business days before arrival. Tourist e-Visa is typically valid for 60 days from the date of arrival.',
  },
  'KR:TR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free for up to 90 days in any 180-day period.',
  },
  'KR:ID': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'Visa-free for tourism for up to 30 days. Entry is through designated international airports and seaports.',
  },
  'KR:PH': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'No visa required for an initial stay of up to 30 days. Can be extended at the Bureau of Immigration.',
  },
  'KR:CA': {
    requirementType: 'e-visa',
    maxStayDays: 180,
    note: 'eTA (Electronic Travel Authorization) required for air travel to Canada. Apply online at canada.ca/eta. Valid for 5 years or until passport expires. Each visit may be up to 6 months.',
  },
  'KR:AE': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free on arrival for up to 90 days for tourism.',
  },
  'KR:MX': {
    requirementType: 'visa-free',
    maxStayDays: 180,
    note: 'No visa required for stays up to 180 days as a tourist.',
  },
  'KR:CH': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS authorization may be required from 2026; verify before travel.',
  },
  'KR:AT': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS authorization may be required from 2026; verify before travel.',
  },
  'KR:PL': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS authorization may be required from 2026; verify before travel.',
  },
  'KR:CZ': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS authorization may be required from 2026; verify before travel.',
  },
  'KR:IE': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days for tourism. Ireland is not part of the Schengen Area, so this is a separate allowance from any Schengen visit.',
  },
  'KR:NZ': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'NZeTA (New Zealand Electronic Travel Authority) required before travel — apply online. Valid for 2 years, allows stays up to 3 months per visit. International Visitor Conservation and Tourism Levy (IVL, NZ$100) also applies.',
  },
  'KR:TW': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days for tourism.',
  },
  'KR:HK': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days for tourism or business.',
  },
  'KR:EG': {
    requirementType: 'e-visa',
    maxStayDays: 30,
    note: 'e-Visa or visa-on-arrival available for tourism, valid for up to 30 days. Passport must be valid for at least 6 months from arrival.',
  },
  'KR:IL': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'ETA-IL (Electronic Travel Authorization) required before travel, effective from January 2025. Valid for 2 years or until passport expiry. Allows stays up to 90 days for tourism.',
  },
  'KR:ZA': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'Visa-exempt for up to 30 days; a Port of Entry Visa is issued on arrival. Passport must be valid for at least 1 month after departure with one blank page.',
  },
  'KR:BR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for tourism for up to 90 days. Combined stays within any 12-month period may not exceed 180 days.',
  },

  // ── US passport (US) ────────────────────────────────────────────────────
  'US:JP': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days for tourism or business.',
  },
  'US:KR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free for up to 90 days. K-ETA (Korea Electronic Travel Authorization) was temporarily waived; verify current requirements before travel.',
  },
  'US:DE': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS authorization may be required from 2026; verify before travel.',
  },
  'US:FR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'US:IT': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'US:ES': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'US:NL': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'US:GR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'US:PT': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'US:GB': {
    requirementType: 'visa-free',
    maxStayDays: 180,
    note: 'No visa required for up to 6 months as a visitor. Electronic Travel Authorisation (ETA) required; apply before travel via GOV.UK.',
  },
  'US:TH': {
    requirementType: 'visa-free',
    maxStayDays: 60,
    note: 'Visa exemption for up to 60 days. Extendable once at a Thai Immigration office.',
  },
  'US:VN': {
    requirementType: 'visa-free',
    maxStayDays: 45,
    note: 'Visa-free for up to 45 days.',
  },
  'US:SG': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days.',
  },
  'US:AU': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'ETA (Electronic Travel Authority) required. Apply via the Australian ETA app. Valid for 12 months, multiple entries, up to 90 days per visit.',
  },
  'US:CN': {
    requirementType: 'visa-free',
    maxStayDays: 10,
    note: 'Visa-free for up to 10 days (bilateral trial as of 2025). Policy may change; verify current requirements before booking.',
  },
  'US:MY': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days.',
  },
  'US:IN': {
    requirementType: 'e-visa',
    maxStayDays: 60,
    note: 'e-Visa required. Apply online at indianvisaonline.gov.in at least 4 business days before arrival.',
  },
  'US:TR': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'e-Visa required. Apply online at evisa.gov.tr. Valid for 180 days from issue date, single or multiple entry up to 90 days.',
  },
  'US:ID': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'Visa-free for up to 30 days for tourism. Entry at designated international ports.',
  },
  'US:PH': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'No visa required for stays up to 30 days. Extendable at the Bureau of Immigration.',
  },
  'US:CA': {
    requirementType: 'visa-free',
    maxStayDays: 180,
    note: 'No visa required. US citizens do not need an eTA for land or sea entry; air travelers may need an eTA — verify with your carrier.',
  },
  'US:MX': {
    requirementType: 'visa-free',
    maxStayDays: 180,
    note: 'No visa required. A Forma Migratoria Múltiple (FMM) tourist card is required; obtainable on arrival or online.',
  },
  'US:AE': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free on arrival for up to 90 days for tourism.',
  },
  'US:CH': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'US:AT': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'US:PL': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'US:CZ': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'US:IE': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days for tourism. Ireland is not part of the Schengen Area.',
  },
  'US:NZ': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'NZeTA required before travel — apply online. Valid for 2 years, allows stays up to 3 months per visit. IVL levy (NZ$100) also applies.',
  },
  'US:TW': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days. Passport need only be valid for the duration of the stay (not the usual 6-month rule).',
  },
  'US:HK': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days for tourism or business. Does not apply to holders of US diplomatic passports.',
  },
  'US:EG': {
    requirementType: 'e-visa',
    maxStayDays: 30,
    note: 'e-Visa or visa-on-arrival available for tourism, valid for up to 30 days. Passport must be valid for at least 6 months from arrival.',
  },
  'US:IL': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'ETA-IL required before travel, effective from January 2025. Valid for 2 years or until passport expiry. Allows stays up to 90 days for tourism.',
  },
  'US:ZA': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-exempt for up to 90 days; a Port of Entry Visa is issued on arrival. Passport must be valid for at least 1 month after departure with one blank page.',
  },
  'US:BR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for tourism for up to 90 days (an e-Visa remains available as an alternative for all visitor categories). Combined stays within any 12-month period may not exceed 180 days.',
  },

  // ── Japanese passport (JP) ──────────────────────────────────────────────
  'JP:KR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days. K-ETA requirements — verify current status before travel.',
  },
  'JP:US': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'ESTA required. Apply at esta.cbp.dhs.gov at least 72 hours before travel. Japan is a Visa Waiver Program (VWP) participant.',
  },
  'JP:DE': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'JP:FR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'JP:IT': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'JP:ES': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'JP:GB': {
    requirementType: 'visa-free',
    maxStayDays: 180,
    note: 'No visa required for up to 6 months. UK ETA required; apply via GOV.UK.',
  },
  'JP:TH': {
    requirementType: 'visa-free',
    maxStayDays: 60,
    note: 'Visa-free for up to 60 days.',
  },
  'JP:VN': {
    requirementType: 'visa-free',
    maxStayDays: 45,
    note: 'Visa-free for up to 45 days.',
  },
  'JP:SG': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days.',
  },
  'JP:AU': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'ETA required. Apply via the Australian ETA app before travel.',
  },
  'JP:CN': {
    requirementType: 'visa-free',
    maxStayDays: 15,
    note: 'Visa-free for up to 15 days (bilateral agreement; verify current status before travel).',
  },
  'JP:MY': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days.',
  },
  'JP:IN': {
    requirementType: 'e-visa',
    maxStayDays: 60,
    note: 'e-Visa required. Apply online at indianvisaonline.gov.in.',
  },
  'JP:TR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free for up to 90 days.',
  },
  'JP:ID': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'Visa-free for up to 30 days for tourism.',
  },
  'JP:PH': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'No visa required for stays up to 30 days.',
  },
  'JP:AE': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free on arrival for up to 90 days.',
  },

  // ── UK passport (GB) ────────────────────────────────────────────────────
  'GB:US': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'ESTA required. Apply at esta.cbp.dhs.gov. UK is a Visa Waiver Program participant. ESTA is valid for 2 years.',
  },
  'GB:JP': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days.',
  },
  'GB:KR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free for up to 90 days. K-ETA requirements — verify current status.',
  },
  'GB:AU': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'eVisitor visa (subclass 651) required — free of charge. Apply online before travel.',
  },
  'GB:DE': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period (post-Brexit). ETIAS may be required from 2026; verify before travel.',
  },
  'GB:FR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'GB:IT': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'GB:ES': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'GB:GR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'GB:TH': {
    requirementType: 'visa-free',
    maxStayDays: 60,
    note: 'Visa-free for up to 60 days. Extendable at Thai Immigration.',
  },
  'GB:VN': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'e-Visa available online. Single or multiple entry up to 90 days.',
  },
  'GB:SG': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days.',
  },
  'GB:IN': {
    requirementType: 'e-visa',
    maxStayDays: 60,
    note: 'e-Visa required. Apply online at indianvisaonline.gov.in at least 4 business days before arrival.',
  },
  'GB:TR': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'e-Visa required. Apply online at evisa.gov.tr.',
  },
  'GB:ID': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'Visa-free for up to 30 days for tourism.',
  },
  'GB:CN': {
    requirementType: 'visa-free',
    maxStayDays: 10,
    note: 'Visa-free for up to 10 days (bilateral arrangement, verify before travel as policy may change).',
  },
  'GB:CA': {
    requirementType: 'e-visa',
    maxStayDays: 180,
    note: 'eTA required for air travel. Apply online at canada.ca/eta.',
  },
  'GB:AE': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free on arrival for up to 90 days.',
  },
  'GB:CH': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period (post-Brexit). ETIAS may be required from 2026; verify before travel.',
  },
  'GB:AT': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'GB:PL': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'GB:CZ': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'GB:IE': {
    requirementType: 'visa-free',
    note: 'No visa required under the UK–Ireland Common Travel Area (CTA, established 1923), which permits British and Irish citizens freedom of movement with minimal or no identity documents. No fixed maximum-stay limit applies under the CTA.',
  },
  'GB:NZ': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'NZeTA required before travel — apply online. Valid for 2 years, allows stays up to 3 months per visit. IVL levy (NZ$100) also applies.',
  },
  'GB:TW': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days for tourism. UK citizens may extend their initial 90-day stay to 180 days for free after arrival.',
  },
  'GB:HK': {
    requirementType: 'visa-free',
    maxStayDays: 180,
    note: 'Visa-free for up to 180 days for British citizens only (other UK passport types may have shorter allowances — verify passport type before travel).',
  },
  'GB:EG': {
    requirementType: 'e-visa',
    maxStayDays: 30,
    note: 'e-Visa or visa-on-arrival available for tourism, valid for up to 30 days. Passport must be valid for at least 6 months from arrival.',
  },
  'GB:IL': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'ETA-IL required before travel, effective from January 2025. Valid for 2 years or until passport expiry. Allows stays up to 90 days for tourism.',
  },
  'GB:ZA': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-exempt for up to 90 days for holders of ordinary passports only; a Port of Entry Visa is issued on arrival.',
  },
  'GB:BR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for tourism for up to 90 days. Combined stays within any 12-month period may not exceed 180 days.',
  },

  // ── Canadian passport (CA) ───────────────────────────────────────────────
  'CA:US': {
    requirementType: 'visa-free',
    maxStayDays: 180,
    note: 'No visa required. Canadian citizens do not need ESTA or an eTA for any port of entry.',
  },
  'CA:JP': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days.',
  },
  'CA:KR': {
    requirementType: 'visa-free',
    maxStayDays: 180,
    note: 'Visa-free for up to 6 months.',
  },
  'CA:AU': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'eVisitor visa required — free. Apply online before travel.',
  },
  'CA:DE': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'CA:FR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'CA:GB': {
    requirementType: 'e-visa',
    maxStayDays: 180,
    note: 'UK ETA required. Apply via GOV.UK before travel.',
  },
  'CA:TH': {
    requirementType: 'visa-free',
    maxStayDays: 60,
    note: 'Visa-free for up to 60 days.',
  },
  'CA:IN': {
    requirementType: 'e-visa',
    maxStayDays: 60,
    note: 'e-Visa required. Apply online at indianvisaonline.gov.in.',
  },
  'CA:TR': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'e-Visa required. Apply online at evisa.gov.tr.',
  },
  'CA:MX': {
    requirementType: 'visa-free',
    maxStayDays: 180,
    note: 'No visa required for stays up to 180 days.',
  },
  'CA:AE': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free on arrival for up to 90 days.',
  },

  // ── Australian passport (AU) ─────────────────────────────────────────────
  'AU:US': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'ESTA required. Apply at esta.cbp.dhs.gov. Australia is a Visa Waiver Program participant.',
  },
  'AU:JP': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days.',
  },
  'AU:KR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free for up to 90 days.',
  },
  'AU:DE': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'AU:FR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free within the Schengen Area — up to 90 days in any 180-day period. ETIAS may be required from 2026.',
  },
  'AU:GB': {
    requirementType: 'e-visa',
    maxStayDays: 180,
    note: 'UK ETA required. Apply via GOV.UK or the UK ETA app.',
  },
  'AU:TH': {
    requirementType: 'visa-free',
    maxStayDays: 60,
    note: 'Visa-free for up to 60 days.',
  },
  'AU:VN': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'e-Visa available. Apply online before travel.',
  },
  'AU:ID': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'Visa-free for up to 30 days for tourism.',
  },
  'AU:SG': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days.',
  },
  'AU:MY': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free for up to 90 days.',
  },
  'AU:IN': {
    requirementType: 'e-visa',
    maxStayDays: 60,
    note: 'e-Visa required. Apply online at indianvisaonline.gov.in.',
  },
  'AU:CN': {
    requirementType: 'visa-required',
    note: 'Visa required. Apply at the Chinese consulate or embassy before travel. Allow sufficient processing time.',
  },
  'AU:CA': {
    requirementType: 'e-visa',
    maxStayDays: 180,
    note: 'eTA required for air travel to Canada. Apply online at canada.ca/eta.',
  },
  'AU:AE': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free on arrival for up to 90 days.',
  },

  // ── German passport (DE) ─────────────────────────────────────────────────
  'DE:US': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'ESTA required. Apply at esta.cbp.dhs.gov. Germany is a Visa Waiver Program participant.',
  },
  'DE:JP': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days.',
  },
  'DE:KR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free for up to 90 days.',
  },
  'DE:GB': {
    requirementType: 'visa-free',
    maxStayDays: 180,
    note: 'No visa required for up to 6 months as a visitor. UK ETA required for German nationals from early 2025; apply via GOV.UK.',
  },
  'DE:AU': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'eVisitor visa required — free. Apply online before travel.',
  },
  'DE:CN': {
    requirementType: 'visa-free',
    maxStayDays: 15,
    note: 'Visa-free for up to 15 days (bilateral agreement; verify current status before travel).',
  },
  'DE:TR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free for up to 90 days.',
  },
  'DE:TH': {
    requirementType: 'visa-free',
    maxStayDays: 60,
    note: 'Visa-free for up to 60 days.',
  },
  'DE:VN': {
    requirementType: 'visa-free',
    maxStayDays: 45,
    note: 'Visa-free for up to 45 days.',
  },
  'DE:IN': {
    requirementType: 'e-visa',
    maxStayDays: 60,
    note: 'e-Visa required. Apply online at indianvisaonline.gov.in.',
  },
  'DE:ID': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'Visa-free for up to 30 days for tourism.',
  },
  'DE:SG': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'No visa required for stays up to 90 days.',
  },
  'DE:AE': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free on arrival for up to 90 days.',
  },
  'DE:MX': {
    requirementType: 'visa-free',
    maxStayDays: 180,
    note: 'No visa required for stays up to 180 days.',
  },

  // ── Intra-Schengen (free movement) ──────────────────────────────────────
  'DE:FR': {
    requirementType: 'visa-free',
    note: 'Free movement within the Schengen Area. No border checks between Schengen member states; a national ID card is sufficient.',
  },
  'FR:DE': {
    requirementType: 'visa-free',
    note: 'Free movement within the Schengen Area.',
  },
  'DE:IT': {
    requirementType: 'visa-free',
    note: 'Free movement within the Schengen Area.',
  },
  'DE:ES': {
    requirementType: 'visa-free',
    note: 'Free movement within the Schengen Area.',
  },
  'DE:NL': {
    requirementType: 'visa-free',
    note: 'Free movement within the Schengen Area.',
  },
  'DE:GR': {
    requirementType: 'visa-free',
    note: 'Free movement within the Schengen Area.',
  },
  'DE:PT': {
    requirementType: 'visa-free',
    note: 'Free movement within the Schengen Area.',
  },
  'DE:CH': {
    requirementType: 'visa-free',
    note: 'Free movement within the Schengen Area (Switzerland is a Schengen member though not an EU member).',
  },
  'DE:AT': {
    requirementType: 'visa-free',
    note: 'Free movement within the Schengen Area.',
  },
  'DE:PL': {
    requirementType: 'visa-free',
    note: 'Free movement within the Schengen Area.',
  },
  'DE:CZ': {
    requirementType: 'visa-free',
    note: 'Free movement within the Schengen Area.',
  },
  'FR:IT': { requirementType: 'visa-free', note: 'Free movement within the Schengen Area.' },
  'FR:ES': { requirementType: 'visa-free', note: 'Free movement within the Schengen Area.' },
  'FR:NL': { requirementType: 'visa-free', note: 'Free movement within the Schengen Area.' },
  'IT:ES': { requirementType: 'visa-free', note: 'Free movement within the Schengen Area.' },
  'IT:GR': { requirementType: 'visa-free', note: 'Free movement within the Schengen Area.' },
  'ES:PT': { requirementType: 'visa-free', note: 'Free movement within the Schengen Area.' },
  'NL:DE': { requirementType: 'visa-free', note: 'Free movement within the Schengen Area.' },
  'NL:FR': { requirementType: 'visa-free', note: 'Free movement within the Schengen Area.' },
  'GR:IT': { requirementType: 'visa-free', note: 'Free movement within the Schengen Area.' },
  'PT:ES': { requirementType: 'visa-free', note: 'Free movement within the Schengen Area.' },

  // Schengen to Non-Schengen EU
  'FR:GB': {
    requirementType: 'visa-free',
    maxStayDays: 180,
    note: 'No visa required for stays up to 6 months. UK ETA required from 2025; apply via GOV.UK.',
  },
  'IT:GB': {
    requirementType: 'visa-free',
    maxStayDays: 180,
    note: 'No visa required for stays up to 6 months. UK ETA required; apply via GOV.UK.',
  },
  'ES:GB': {
    requirementType: 'visa-free',
    maxStayDays: 180,
    note: 'No visa required for stays up to 6 months. UK ETA required; apply via GOV.UK.',
  },

  // ── Indian passport (IN) ─────────────────────────────────────────────────
  'IN:TH': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'Visa-free on arrival for up to 30 days for tourism (Thailand extended exemption for Indian nationals; verify current policy).',
  },
  'IN:MY': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'eNTRI note allows up to 15 days; for longer stays, obtain a visa in advance. Verify current requirements.',
  },
  'IN:SG': {
    requirementType: 'visa-required',
    note: 'Visa required. Apply at the Singapore Embassy or online via the Singapore Tourism Board (ICA). Processing typically takes 3–5 business days.',
  },
  'IN:US': {
    requirementType: 'visa-required',
    note: 'B-1/B-2 visitor visa required. Apply at the US Embassy or Consulate. Interview required; processing times vary significantly — apply well in advance.',
  },
  'IN:GB': {
    requirementType: 'visa-required',
    note: 'Standard Visitor Visa required. Apply online via GOV.UK. Processing typically 3 weeks; priority and super priority services available for a fee.',
  },
  'IN:AE': {
    requirementType: 'e-visa',
    maxStayDays: 30,
    note: 'Visa on arrival or e-Visa available for eligible Indian passport holders. 14-day or 30-day options. Apply online or obtain at entry.',
  },
  'IN:JP': {
    requirementType: 'visa-required',
    note: 'Japanese visa required. Apply at the Japanese Embassy or Consulate. Processing typically takes 5 business days.',
  },
  'IN:VN': {
    requirementType: 'e-visa',
    maxStayDays: 90,
    note: 'e-Visa available online. Single or multiple entry up to 90 days.',
  },
  'IN:ID': {
    requirementType: 'visa-required',
    note: 'Visa on arrival available at major international airports (30 days, extendable once). Fee payable in USD or IDR at the port of entry.',
  },
  'IN:TR': {
    requirementType: 'e-visa',
    maxStayDays: 30,
    note: 'e-Visa required. Apply online at evisa.gov.tr. Valid for 180 days from issue, single entry.',
  },
  'IN:DE': {
    requirementType: 'visa-required',
    note: 'Schengen visa (short-stay, Type C) required. Apply at the German Embassy or Consulate — processing takes 15 working days on average.',
  },
  'IN:FR': {
    requirementType: 'visa-required',
    note: 'Schengen visa (short-stay, Type C) required. Apply at the French Embassy or Consulate.',
  },
  'IN:AU': {
    requirementType: 'visa-required',
    note: 'Visitor visa (subclass 600) required. Apply online via ImmiAccount on the Australian Department of Home Affairs website.',
  },
  'IN:KR': {
    requirementType: 'visa-required',
    note: 'Korean visa required. Apply at the Korean Embassy or Consulate. K-ETA is not available for Indian passport holders.',
  },

  // ── Thailand (TH) as origin ──────────────────────────────────────────────
  'TH:JP': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'Visa-free for up to 30 days.',
  },
  'TH:KR': {
    requirementType: 'visa-free',
    maxStayDays: 90,
    note: 'Visa-free for up to 90 days. K-ETA requirements — verify current status.',
  },
  'TH:SG': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'No visa required for stays up to 30 days.',
  },
  'TH:US': {
    requirementType: 'visa-required',
    note: 'B-1/B-2 visitor visa required. Apply at the US Embassy in Bangkok. Appointment and interview required.',
  },
  'TH:GB': {
    requirementType: 'visa-required',
    note: 'Standard Visitor Visa required. Apply online via GOV.UK.',
  },
  'TH:DE': {
    requirementType: 'visa-required',
    note: 'Schengen visa required. Apply at the German Embassy or Consulate in Thailand.',
  },

  // ── Vietnam (VN) as origin ───────────────────────────────────────────────
  'VN:JP': {
    requirementType: 'visa-required',
    note: 'Japanese visa required. Apply at the Japanese Embassy or Consulate in Vietnam.',
  },
  'VN:KR': {
    requirementType: 'visa-required',
    note: 'Korean visa required. Apply at the Korean Embassy or Consulate. K-ETA not available for Vietnamese passport holders.',
  },
  'VN:SG': {
    requirementType: 'visa-required',
    note: 'Visa required. Apply through the Singapore ICA website or at the Singapore Embassy.',
  },
  'VN:TH': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'Visa-free for up to 30 days for tourism.',
  },
  'VN:MY': {
    requirementType: 'visa-free',
    maxStayDays: 30,
    note: 'No visa required for stays up to 30 days.',
  },
}
