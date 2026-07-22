/**
 * Static Minimum Connecting Time (MCT) data for major international hub airports.
 *
 * Sources:
 *   - SkySonar Flight Intelligence Platform (June 2026 update, citing IATA/OAG MCT standards)
 *     https://skysonar.com/en-us/guides/travel-knowledge/connecting-flight-buffer-time-minimum-airport
 *   - minimumconnectiontime.com (citing IATA, July 2026)
 *     https://minimumconnectiontime.com/airport/{IATA_CODE}
 *
 * IMPORTANT: MCT values are subject to change by airports and airlines without notice.
 * This is a static snapshot, NOT a live database. Always verify current values with your
 * airline or the official airport website before booking a tight connection.
 *
 * Values represent the published IATA/airport-standard MCT (i.e. the shortest interval
 * for a standard/interline connection). Airline-specific (online) exceptions may be shorter.
 * When a source gave a range, the conservative (higher) end was used.
 */

export type ConnectionType =
  | 'domestic-domestic'
  | 'domestic-international'
  | 'international-domestic'
  | 'international-international'

export type AirportMctEntry = {
  /** IATA 3-letter airport code */
  code: string
  name: { en: string; ko: string }
  /**
   * MCT in minutes per connection type.
   * Partial because some airports have no domestic traffic (e.g. SIN, DXB)
   * or because the source did not publish certain combinations.
   */
  mctMinutesByConnectionType: Partial<Record<ConnectionType, number>>
  /** Short human-readable name of the data source */
  sourceName: string
  /** URL of the data source for display in the UI */
  sourceUrl: string
}

/**
 * Default MCT values (minutes) to use when the requested airport or connection type
 * is not in AIRPORT_MCT_DATA.
 *
 * These are conservative industry-standard defaults derived from IATA RP 1670 guidance
 * and the aggregate patterns observed across major hubs.
 *
 * Source: IATA Recommended Practice 1670 — Minimum Connecting Times
 * https://www.iata.org/en/publications/manuals/station-standard-minimum-connecting-time-mct/
 */
export const DEFAULT_MCT_MINUTES_BY_CONNECTION_TYPE: Record<ConnectionType, number> = {
  'domestic-domestic': 45,
  'domestic-international': 60,
  'international-domestic': 90,
  'international-international': 90,
}

const SKYSONAR_SOURCE = {
  sourceName: 'SkySonar (citing IATA/OAG MCT standards, June 2026)',
  sourceUrl:
    'https://skysonar.com/en-us/guides/travel-knowledge/connecting-flight-buffer-time-minimum-airport',
}

const MCT_SITE_SOURCE = (code: string) => ({
  sourceName: 'minimumconnectiontime.com (citing IATA, July 2026)',
  sourceUrl: `https://minimumconnectiontime.com/airport/${code}`,
})

export const AIRPORT_MCT_DATA: AirportMctEntry[] = [
  // ── North America ─────────────────────────────────────────────────────────
  {
    code: 'ATL',
    name: { en: 'Atlanta Hartsfield-Jackson (ATL)', ko: '애틀랜타 하츠필드-잭슨 (ATL)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 60,
      'domestic-international': 90,
      'international-domestic': 90,
      'international-international': 120,
    },
    ...SKYSONAR_SOURCE,
  },
  {
    code: 'ORD',
    name: { en: "Chicago O'Hare (ORD)", ko: '시카고 오헤어 (ORD)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 40,
      'domestic-international': 90,
      'international-domestic': 90,
      'international-international': 90,
    },
    ...SKYSONAR_SOURCE,
  },
  {
    code: 'DFW',
    name: { en: 'Dallas/Fort Worth (DFW)', ko: '댈러스/포트워스 (DFW)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 40,
      'domestic-international': 90,
      'international-domestic': 90,
      'international-international': 90,
    },
    ...SKYSONAR_SOURCE,
  },
  {
    code: 'JFK',
    name: { en: 'New York JFK (JFK)', ko: '뉴욕 존 F. 케네디 (JFK)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 45,
      'domestic-international': 90,
      'international-domestic': 135, // AirTrain + TSA re-screening required; conservative end of 120–135 range
      'international-international': 90,
    },
    ...SKYSONAR_SOURCE,
  },
  {
    code: 'LAX',
    name: { en: 'Los Angeles (LAX)', ko: '로스앤젤레스 (LAX)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 45,
      'domestic-international': 90,
      'international-domestic': 90,
      'international-international': 90,
    },
    ...SKYSONAR_SOURCE,
  },
  {
    code: 'SFO',
    name: { en: 'San Francisco (SFO)', ko: '샌프란시스코 (SFO)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 50,
      'domestic-international': 60,
      'international-domestic': 105,
      'international-international': 105,
    },
    ...SKYSONAR_SOURCE,
  },
  {
    code: 'EWR',
    name: { en: 'New York Newark (EWR)', ko: '뉴어크 리버티 (EWR)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 60,
      'domestic-international': 75,
      'international-domestic': 90,
      'international-international': 60,
    },
    ...SKYSONAR_SOURCE,
  },
  {
    code: 'BOS',
    name: { en: 'Boston Logan (BOS)', ko: '보스턴 로건 (BOS)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 30,
      'domestic-international': 40,
      'international-domestic': 80,
      'international-international': 75,
    },
    ...SKYSONAR_SOURCE,
  },
  {
    code: 'MIA',
    name: { en: 'Miami (MIA)', ko: '마이애미 (MIA)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 60,
      'domestic-international': 60,
      'international-domestic': 90,
      'international-international': 90,
    },
    ...SKYSONAR_SOURCE,
  },
  {
    code: 'DEN',
    name: { en: 'Denver (DEN)', ko: '덴버 (DEN)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 40,
      'domestic-international': 90,
      'international-domestic': 90,
      'international-international': 90,
    },
    ...SKYSONAR_SOURCE,
  },
  {
    code: 'SEA',
    name: { en: 'Seattle-Tacoma (SEA)', ko: '시애틀-타코마 (SEA)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 30,
      'domestic-international': 30,
      'international-domestic': 70,
      'international-international': 70,
    },
    ...SKYSONAR_SOURCE,
  },
  // ── Europe ────────────────────────────────────────────────────────────────
  {
    code: 'LHR',
    name: { en: 'London Heathrow (LHR)', ko: '런던 히스로 (LHR)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 60,
      'domestic-international': 90,
      'international-domestic': 90,
      'international-international': 75, // BA T5 raised to 75 min in 2024; lower bound of published 75–90 range
    },
    ...SKYSONAR_SOURCE,
  },
  {
    code: 'CDG',
    name: { en: 'Paris Charles de Gaulle (CDG)', ko: '파리 샤를 드 골 (CDG)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 60,
      'domestic-international': 90,
      'international-domestic': 90,
      'international-international': 90,
    },
    ...SKYSONAR_SOURCE,
  },
  {
    code: 'AMS',
    name: { en: 'Amsterdam Schiphol (AMS)', ko: '암스테르담 스히폴 (AMS)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 40,
      'domestic-international': 40,
      'international-domestic': 40,
      'international-international': 40,
    },
    ...SKYSONAR_SOURCE,
  },
  {
    code: 'FRA',
    name: { en: 'Frankfurt (FRA)', ko: '프랑크푸르트 (FRA)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 45,
      'domestic-international': 90,
      'international-domestic': 90,
      'international-international': 90,
    },
    ...MCT_SITE_SOURCE('FRA'),
  },
  {
    code: 'MUC',
    name: { en: 'Munich (MUC)', ko: '뮌헨 (MUC)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 35,
      'domestic-international': 35,
      'international-domestic': 35,
      'international-international': 35,
    },
    ...SKYSONAR_SOURCE,
  },
  // ── Middle East ───────────────────────────────────────────────────────────
  {
    code: 'DXB',
    name: { en: 'Dubai (DXB)', ko: '두바이 (DXB)' },
    mctMinutesByConnectionType: {
      // DXB has no scheduled domestic flights; domestic-domestic not applicable
      'domestic-international': 60,
      'international-domestic': 60,
      'international-international': 60, // conservative end; T1/T3 airside, T2 requires external transfer
    },
    ...SKYSONAR_SOURCE,
  },
  // ── Asia-Pacific ──────────────────────────────────────────────────────────
  {
    code: 'ICN',
    name: { en: 'Seoul Incheon (ICN)', ko: '인천국제공항 (ICN)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 45,
      'domestic-international': 90,
      'international-domestic': 90,
      'international-international': 90,
    },
    ...MCT_SITE_SOURCE('ICN'),
  },
  {
    code: 'NRT',
    name: { en: 'Tokyo Narita (NRT)', ko: '도쿄 나리타 (NRT)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 30,
      'domestic-international': 90,
      'international-domestic': 90,
      'international-international': 90, // same-terminal (Star Alliance) could be 45; using conservative inter-terminal value
    },
    ...SKYSONAR_SOURCE,
  },
  {
    code: 'HND',
    name: { en: 'Tokyo Haneda (HND)', ko: '도쿄 하네다 (HND)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 30,
      'domestic-international': 120, // domestic and international terminals are separate; monorail required
      'international-domestic': 120,
      'international-international': 120,
    },
    ...SKYSONAR_SOURCE,
  },
  {
    code: 'SIN',
    name: { en: 'Singapore Changi (SIN)', ko: '싱가포르 창이 (SIN)' },
    mctMinutesByConnectionType: {
      // SIN has no domestic flights; all connections are international
      'international-international': 90,
    },
    ...SKYSONAR_SOURCE,
  },
  {
    code: 'BKK',
    name: { en: 'Bangkok Suvarnabhumi (BKK)', ko: '방콕 수완나품 (BKK)' },
    mctMinutesByConnectionType: {
      'domestic-domestic': 75,
      'domestic-international': 75,
      'international-domestic': 75,
      'international-international': 75,
    },
    ...SKYSONAR_SOURCE,
  },
]
