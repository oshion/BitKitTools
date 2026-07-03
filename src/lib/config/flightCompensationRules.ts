/**
 * Static compensation rules for flight delay claims.
 *
 * Sources:
 *   - EU: Regulation (EC) No 261/2004 of the European Parliament and of the Council
 *     https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32004R0261
 *   - US: US DOT 14 CFR Part 259 (Customer Service Plans) — note that the US has
 *     no statutory fixed-amount compensation for delays (only tarmac delay rules ≥3h
 *     for domestic, ≥4h for international). Airlines determine delay compensation
 *     individually per their customer service commitments.
 *
 * IMPORTANT: This is a static reference table, NOT a live government data feed.
 * Rules may change. Always verify with the relevant authority before filing a claim.
 */

export type DistanceCategory = 'short' | 'medium' | 'long'
export type RegulationType = 'EU261' | 'US_DOT'

export type CompensationAmount = {
  /** Minimum compensation in the regulation's currency */
  min: number
  /** Maximum compensation in the regulation's currency */
  max: number
  currency: string
}

export type DelayRule = {
  /** Minimum arrival delay in hours for this rule to apply */
  minDelayHours: number
  compensation: CompensationAmount
  /** Human-readable note explaining the rule */
  note: { en: string; ko: string }
}

export type DistanceCategoryRule = {
  /** Max km for this category (undefined = no upper limit) */
  maxKm: number | null
  /** Min km for this category */
  minKm: number
  label: { en: string; ko: string }
  rules: DelayRule[]
  forceMajeureSuffix: { en: string; ko: string }
}

export type RegulationConfig = {
  id: RegulationType
  name: { en: string; ko: string }
  /** Source citation for UI display */
  sourceName: { en: string; ko: string }
  sourceUrl: string
  applies: { en: string; ko: string }
  categories: Record<DistanceCategory, DistanceCategoryRule>
  forceMajeureNote: { en: string; ko: string }
  noCompensationNote: { en: string; ko: string }
}

/**
 * EU261/2004 — applies to:
 *   - All flights departing from an EU airport (any airline)
 *   - Flights arriving at an EU airport operated by an EU-based carrier
 * Compensation is for arrival delay ≥3 hours. Force majeure (extraordinary circumstances
 * such as severe weather, security risks, or ATC strikes) exempts the airline from payment.
 */
const EU261: RegulationConfig = {
  id: 'EU261',
  name: { en: 'EU Regulation 261/2004', ko: 'EU 규정 261/2004' },
  sourceName: {
    en: 'Regulation (EC) No 261/2004 — EUR-Lex',
    ko: 'EU 규정(EC) 261/2004 — EUR-Lex',
  },
  sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32004R0261',
  applies: {
    en: 'Flights departing from an EU airport (all airlines) or arriving at an EU airport on an EU-based carrier.',
    ko: 'EU 공항에서 출발하는 모든 항공편, 또는 EU 항공사가 운항하는 EU 도착 항공편에 적용됩니다.',
  },
  categories: {
    short: {
      minKm: 0,
      maxKm: 1500,
      label: { en: 'Short-haul (up to 1,500 km)', ko: '단거리 (1,500 km 이하)' },
      rules: [
        {
          minDelayHours: 3,
          compensation: { min: 250, max: 250, currency: 'EUR' },
          note: {
            en: 'Arrival delay of 3 hours or more: €250 per passenger.',
            ko: '도착 지연 3시간 이상: 승객 1인당 €250.',
          },
        },
      ],
      forceMajeureSuffix: {
        en: 'Force majeure (extraordinary circumstances) may exempt the airline from paying compensation.',
        ko: '불가항력(비상 상황)의 경우 항공사는 보상 의무를 면제받을 수 있습니다.',
      },
    },
    medium: {
      minKm: 1501,
      maxKm: 3500,
      label: { en: 'Medium-haul (1,500–3,500 km)', ko: '중거리 (1,500–3,500 km)' },
      rules: [
        {
          minDelayHours: 3,
          compensation: { min: 400, max: 400, currency: 'EUR' },
          note: {
            en: 'Arrival delay of 3 hours or more: €400 per passenger.',
            ko: '도착 지연 3시간 이상: 승객 1인당 €400.',
          },
        },
      ],
      forceMajeureSuffix: {
        en: 'Force majeure (extraordinary circumstances) may exempt the airline from paying compensation.',
        ko: '불가항력(비상 상황)의 경우 항공사는 보상 의무를 면제받을 수 있습니다.',
      },
    },
    long: {
      minKm: 3501,
      maxKm: null,
      label: { en: 'Long-haul (over 3,500 km)', ko: '장거리 (3,500 km 초과)' },
      rules: [
        {
          minDelayHours: 3,
          compensation: { min: 300, max: 300, currency: 'EUR' },
          note: {
            en: 'Arrival delay of 3–4 hours: €300 per passenger (reduced by 50% when offered re-routing).',
            ko: '도착 지연 3~4시간: 승객 1인당 €300 (우회 노선 제공 시 50% 감액 가능).',
          },
        },
        {
          minDelayHours: 4,
          compensation: { min: 600, max: 600, currency: 'EUR' },
          note: {
            en: 'Arrival delay of 4 hours or more: €600 per passenger.',
            ko: '도착 지연 4시간 이상: 승객 1인당 €600.',
          },
        },
      ],
      forceMajeureSuffix: {
        en: 'Force majeure (extraordinary circumstances) may exempt the airline from paying compensation.',
        ko: '불가항력(비상 상황)의 경우 항공사는 보상 의무를 면제받을 수 있습니다.',
      },
    },
  },
  forceMajeureNote: {
    en: 'Under EU261, airlines are not required to pay compensation for delays caused by "extraordinary circumstances" — events that could not have been avoided even if all reasonable measures had been taken. This includes severe weather, airport/ATC strikes, security risks, and political instability. However, airlines must still provide care (meals, accommodation) regardless of the cause.',
    ko: 'EU261에 따르면, 항공사는 "비상 상황"으로 인한 지연에 대해 보상할 의무가 없습니다. 이는 모든 합리적인 조치를 취했더라도 피할 수 없었던 사건(기상 이변, 공항/ATC 파업, 보안 위협, 정치적 불안 등)을 말합니다. 그러나 원인과 무관하게 항공사는 식사·숙박 등 기본 케어를 제공해야 합니다.',
  },
  noCompensationNote: {
    en: 'Compensation may not apply. Based on the information provided, this delay may fall under extraordinary circumstances where EU261 compensation is not mandatory. We recommend checking with your airline or a passenger rights service for your specific case.',
    ko: '보상이 적용되지 않을 수 있습니다. 입력하신 정보를 바탕으로, 이 지연은 EU261 보상 의무가 면제되는 비상 상황에 해당할 수 있습니다. 항공사 또는 승객 권리 서비스에 문의하여 구체적인 상황을 확인하시기 바랍니다.',
  },
}

/**
 * US DOT — unlike EU261, the United States does NOT have a statutory regulation
 * that mandates fixed compensation payments to passengers for flight delays.
 * Airlines set their own delay compensation policies per their customer service plans
 * (required to be published under 14 CFR Part 259).
 *
 * The tarmac delay rule (14 CFR 259.4) does require airlines to allow passengers
 * to deplane after 3 hours (domestic) or 4 hours (international) on the tarmac.
 * Violation of this rule can result in DOT fines against the airline, but does not
 * directly create a passenger entitlement to a fixed cash payment.
 *
 * This section surfaces an informational note rather than a fixed compensation range.
 */
const US_DOT: RegulationConfig = {
  id: 'US_DOT',
  name: { en: 'US DOT (Domestic Flights)', ko: '미국 DOT (국내선)' },
  sourceName: {
    en: 'US DOT 14 CFR Part 259 — Customer Service Plans',
    ko: '미국 DOT 14 CFR Part 259 — 고객 서비스 플랜',
  },
  sourceUrl: 'https://www.ecfr.gov/current/title-14/chapter-II/subchapter-D/part-259',
  applies: {
    en: 'Domestic US flights and international flights to/from the United States.',
    ko: '미국 국내선 및 미국 출·도착 국제선 항공편에 적용됩니다.',
  },
  categories: {
    short: {
      minKm: 0,
      maxKm: 1500,
      label: { en: 'Short-haul', ko: '단거리' },
      rules: [
        {
          minDelayHours: 3,
          compensation: { min: 0, max: 0, currency: 'USD' },
          note: {
            en: 'No fixed statutory compensation. Airlines determine delay compensation per their individual customer service plans.',
            ko: '법적으로 정해진 고정 보상금이 없습니다. 지연 보상은 각 항공사의 고객 서비스 플랜에 따라 결정됩니다.',
          },
        },
      ],
      forceMajeureSuffix: {
        en: '',
        ko: '',
      },
    },
    medium: {
      minKm: 1501,
      maxKm: 3500,
      label: { en: 'Medium-haul', ko: '중거리' },
      rules: [
        {
          minDelayHours: 3,
          compensation: { min: 0, max: 0, currency: 'USD' },
          note: {
            en: 'No fixed statutory compensation. Airlines determine delay compensation per their individual customer service plans.',
            ko: '법적으로 정해진 고정 보상금이 없습니다. 지연 보상은 각 항공사의 고객 서비스 플랜에 따라 결정됩니다.',
          },
        },
      ],
      forceMajeureSuffix: {
        en: '',
        ko: '',
      },
    },
    long: {
      minKm: 3501,
      maxKm: null,
      label: { en: 'Long-haul', ko: '장거리' },
      rules: [
        {
          minDelayHours: 4,
          compensation: { min: 0, max: 0, currency: 'USD' },
          note: {
            en: 'No fixed statutory compensation. Airlines determine delay compensation per their individual customer service plans.',
            ko: '법적으로 정해진 고정 보상금이 없습니다. 지연 보상은 각 항공사의 고객 서비스 플랜에 따라 결정됩니다.',
          },
        },
      ],
      forceMajeureSuffix: {
        en: '',
        ko: '',
      },
    },
  },
  forceMajeureNote: {
    en: 'US airlines are generally not required to compensate passengers for delays caused by circumstances outside their control (weather, ATC, security). Each airline\'s customer service plan specifies what is offered for controllable vs. uncontrollable delays.',
    ko: '미국 항공사는 일반적으로 통제 불가능한 상황(기상, ATC, 보안)으로 인한 지연에 대해 보상할 의무가 없습니다. 각 항공사의 고객 서비스 플랜에서 통제 가능/불가능한 지연에 대해 제공하는 보상 내용을 확인할 수 있습니다.',
  },
  noCompensationNote: {
    en: 'Under US DOT rules, there is no statutory fixed compensation for flight delays. Contact your airline directly to inquire about their voluntary customer service commitments for your delay.',
    ko: '미국 DOT 규정에 따르면, 항공편 지연에 대한 법적 고정 보상금이 없습니다. 항공사에 직접 문의하여 지연에 대한 자발적 고객 서비스 약정을 확인하시기 바랍니다.',
  },
}

export const FLIGHT_COMPENSATION_RULES: Record<RegulationType, RegulationConfig> = {
  EU261,
  US_DOT,
}
