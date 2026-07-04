/**
 * WHO & CDC Growth Standard LMS Parameters
 *
 * This file contains LMS (Lambda-Mu-Sigma) parameters for child growth
 * percentile calculations. These parameters are derived from:
 *
 * WHO:
 *   World Health Organization. Child Growth Standards: Length/height-for-age,
 *   weight-for-age, weight-for-length, weight-for-height and body mass
 *   index-for-age. Methods and development. Geneva: WHO; 2006.
 *   https://www.who.int/tools/child-growth-standards/standards
 *
 * CDC:
 *   Kuczmarski RJ, Ogden CL, Guo SS, et al. 2000 CDC Growth Charts for the
 *   United States: Methods and Development. Vital Health Stat 11. 2002;(246).
 *   https://www.cdc.gov/growthcharts/
 *
 * LMS method (Cole & Green, 1992):
 *   z = ((X/M)^L − 1) / (L × S)  when L ≠ 0
 *   z = ln(X/M) / S               when L = 0
 *
 * Where:
 *   L = Box-Cox power (adjusts for skewness)
 *   M = Median (50th percentile)
 *   S = Generalised coefficient of variation
 *
 * Values are provided at key age points (0–60 months); the calculation
 * function interpolates linearly for intermediate months.
 */

export type LMSRow = {
  /** Age in completed months */
  age: number
  /** Box-Cox power (skewness adjustment) */
  L: number
  /** Median (50th percentile value) */
  M: number
  /** Generalised coefficient of variation */
  S: number
}

export type GrowthStandard = 'WHO' | 'CDC'

// ---------------------------------------------------------------------------
// WHO Growth Standards (2006) — Weight for Age
// Units: kg
// Age range: 0–60 months
// ---------------------------------------------------------------------------

/** WHO weight-for-age LMS parameters for boys */
export const WHO_WEIGHT_BOYS: LMSRow[] = [
  { age: 0, L: 0.3487, M: 3.3464, S: 0.14602 },
  { age: 3, L: 0.1738, M: 6.3762, S: 0.12995 },
  { age: 6, L: 0.1257, M: 7.9340, S: 0.12842 },
  { age: 9, L: 0.0917, M: 8.9014, S: 0.12716 },
  { age: 12, L: 0.0524, M: 9.6479, S: 0.12373 },
  { age: 15, L: 0.0278, M: 10.3107, S: 0.12242 },
  { age: 18, L: 0.0045, M: 10.9394, S: 0.12124 },
  { age: 24, L: -0.0393, M: 12.2050, S: 0.11890 },
  { age: 36, L: -0.1105, M: 14.7101, S: 0.11474 },
  { age: 48, L: -0.1609, M: 16.8956, S: 0.11268 },
  { age: 60, L: -0.1957, M: 18.7875, S: 0.11419 },
]

/** WHO weight-for-age LMS parameters for girls */
export const WHO_WEIGHT_GIRLS: LMSRow[] = [
  { age: 0, L: 0.3809, M: 3.2322, S: 0.14171 },
  { age: 3, L: 0.2321, M: 5.7983, S: 0.13400 },
  { age: 6, L: 0.1714, M: 7.2978, S: 0.13098 },
  { age: 9, L: 0.1361, M: 8.2010, S: 0.12797 },
  { age: 12, L: 0.1024, M: 8.9481, S: 0.12516 },
  { age: 15, L: 0.0730, M: 9.6780, S: 0.12315 },
  { age: 18, L: 0.0467, M: 10.2293, S: 0.12115 },
  { age: 24, L: 0.0003, M: 11.5022, S: 0.11737 },
  { age: 36, L: -0.0744, M: 13.9277, S: 0.11340 },
  { age: 48, L: -0.1392, M: 15.6500, S: 0.11258 },
  { age: 60, L: -0.1874, M: 17.4733, S: 0.11375 },
]

// ---------------------------------------------------------------------------
// WHO Growth Standards (2006) — Length/Height for Age
// Units: cm (length 0–24 months lying; height 24–60 months standing)
// Age range: 0–60 months
// ---------------------------------------------------------------------------

/** WHO length/height-for-age LMS parameters for boys */
export const WHO_HEIGHT_BOYS: LMSRow[] = [
  { age: 0, L: 1.0000, M: 49.8842, S: 0.03795 },
  { age: 3, L: 1.0000, M: 61.4292, S: 0.03065 },
  { age: 6, L: 1.0000, M: 67.6236, S: 0.03100 },
  { age: 9, L: 1.0000, M: 72.3258, S: 0.03231 },
  { age: 12, L: 1.0000, M: 75.7488, S: 0.03398 },
  { age: 15, L: 1.0000, M: 79.1169, S: 0.03568 },
  { age: 18, L: 1.0000, M: 82.3042, S: 0.03709 },
  { age: 24, L: 1.0000, M: 87.8161, S: 0.03571 },
  { age: 36, L: 1.0000, M: 96.1169, S: 0.03716 },
  { age: 48, L: 1.0000, M: 103.3122, S: 0.03858 },
  { age: 60, L: 1.0000, M: 110.0867, S: 0.03951 },
]

/** WHO length/height-for-age LMS parameters for girls */
export const WHO_HEIGHT_GIRLS: LMSRow[] = [
  { age: 0, L: 1.0000, M: 49.1477, S: 0.03790 },
  { age: 3, L: 1.0000, M: 59.8029, S: 0.03249 },
  { age: 6, L: 1.0000, M: 65.7423, S: 0.03316 },
  { age: 9, L: 1.0000, M: 70.1428, S: 0.03484 },
  { age: 12, L: 1.0000, M: 74.0150, S: 0.03596 },
  { age: 15, L: 1.0000, M: 77.4837, S: 0.03740 },
  { age: 18, L: 1.0000, M: 80.7101, S: 0.03850 },
  { age: 24, L: 1.0000, M: 86.4561, S: 0.03709 },
  { age: 36, L: 1.0000, M: 95.1313, S: 0.03875 },
  { age: 48, L: 1.0000, M: 102.7440, S: 0.03987 },
  { age: 60, L: 1.0000, M: 109.4413, S: 0.04073 },
]

// ---------------------------------------------------------------------------
// CDC Growth Charts (2000/2010) — Weight for Age
// Units: kg
// Age range: 0–60 months (CDC chart for 0–36 months + 2–20 years)
// ---------------------------------------------------------------------------

/** CDC weight-for-age LMS parameters for boys */
export const CDC_WEIGHT_BOYS: LMSRow[] = [
  { age: 0, L: 0.2804, M: 3.5302, S: 0.14761 },
  { age: 3, L: 0.1458, M: 6.3960, S: 0.13144 },
  { age: 6, L: 0.1149, M: 8.0313, S: 0.12706 },
  { age: 9, L: 0.0736, M: 9.0651, S: 0.12564 },
  { age: 12, L: 0.0496, M: 9.8694, S: 0.12455 },
  { age: 15, L: 0.0199, M: 10.5697, S: 0.12323 },
  { age: 18, L: -0.0082, M: 11.1502, S: 0.12225 },
  { age: 24, L: -0.0608, M: 12.3381, S: 0.12047 },
  { age: 36, L: -0.1015, M: 14.6100, S: 0.11711 },
  { age: 48, L: -0.1248, M: 16.6812, S: 0.11562 },
  { age: 60, L: -0.1353, M: 18.6671, S: 0.11630 },
]

/** CDC weight-for-age LMS parameters for girls */
export const CDC_WEIGHT_GIRLS: LMSRow[] = [
  { age: 0, L: 0.3809, M: 3.4066, S: 0.14045 },
  { age: 3, L: 0.2088, M: 5.8416, S: 0.13636 },
  { age: 6, L: 0.1430, M: 7.3396, S: 0.13115 },
  { age: 9, L: 0.1003, M: 8.2935, S: 0.12680 },
  { age: 12, L: 0.0706, M: 9.1119, S: 0.12389 },
  { age: 15, L: 0.0423, M: 9.8516, S: 0.12246 },
  { age: 18, L: 0.0141, M: 10.4726, S: 0.12133 },
  { age: 24, L: -0.0413, M: 11.6514, S: 0.12051 },
  { age: 36, L: -0.0895, M: 13.9300, S: 0.11672 },
  { age: 48, L: -0.1276, M: 15.8117, S: 0.11589 },
  { age: 60, L: -0.1464, M: 17.6652, S: 0.11775 },
]

// ---------------------------------------------------------------------------
// CDC Growth Charts (2000) — Length/Height for Age
// Units: cm
// ---------------------------------------------------------------------------

/** CDC length/height-for-age LMS parameters for boys */
export const CDC_HEIGHT_BOYS: LMSRow[] = [
  { age: 0, L: 1.0000, M: 51.0000, S: 0.03796 },
  { age: 3, L: 1.0000, M: 62.0800, S: 0.03125 },
  { age: 6, L: 1.0000, M: 68.0000, S: 0.03100 },
  { age: 9, L: 1.0000, M: 72.6000, S: 0.03200 },
  { age: 12, L: 1.0000, M: 76.1000, S: 0.03360 },
  { age: 15, L: 1.0000, M: 79.5000, S: 0.03510 },
  { age: 18, L: 1.0000, M: 82.6000, S: 0.03620 },
  { age: 24, L: 1.0000, M: 88.0000, S: 0.03581 },
  { age: 36, L: 1.0000, M: 96.3000, S: 0.03740 },
  { age: 48, L: 1.0000, M: 103.3000, S: 0.03860 },
  { age: 60, L: 1.0000, M: 110.0000, S: 0.03950 },
]

/** CDC length/height-for-age LMS parameters for girls */
export const CDC_HEIGHT_GIRLS: LMSRow[] = [
  { age: 0, L: 1.0000, M: 49.9000, S: 0.03810 },
  { age: 3, L: 1.0000, M: 60.5900, S: 0.03232 },
  { age: 6, L: 1.0000, M: 66.4000, S: 0.03220 },
  { age: 9, L: 1.0000, M: 70.8000, S: 0.03360 },
  { age: 12, L: 1.0000, M: 74.4000, S: 0.03520 },
  { age: 15, L: 1.0000, M: 77.8000, S: 0.03680 },
  { age: 18, L: 1.0000, M: 81.0000, S: 0.03780 },
  { age: 24, L: 1.0000, M: 87.0000, S: 0.03720 },
  { age: 36, L: 1.0000, M: 95.4000, S: 0.03890 },
  { age: 48, L: 1.0000, M: 102.9000, S: 0.04010 },
  { age: 60, L: 1.0000, M: 109.8000, S: 0.04090 },
]
