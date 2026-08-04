'use client'

import { useEffect, useRef, useState } from 'react'
import {
  checkVisaRequirement,
  type VisaRequirementResult,
} from '@/lib/utils/visaRequirementChecker'
import { COUNTRIES, type Country } from '@/lib/config/visaRequirements'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'

// ── Types ────────────────────────────────────────────────────────────────────

type SavedCountries = { from: string; to: string }
type RequirementType = VisaRequirementResult['requirementType']

// ── Helpers ──────────────────────────────────────────────────────────────────

const BADGE_LABEL: Record<RequirementType, string> = {
  'visa-free': 'Visa-free',
  'e-visa': 'e-Visa / ETA required',
  'visa-required': 'Visa required',
  unknown: 'Unknown',
}

const BADGE_CLASS: Record<RequirementType, string> = {
  'visa-free': 'border-neutral-600 bg-neutral-800 text-neutral-200',
  'e-visa': 'border-amber-900/50 bg-amber-950/20 text-amber-200',
  'visa-required': 'border-neutral-700 bg-neutral-800 text-neutral-300',
  unknown: 'border-neutral-800 bg-neutral-900 text-neutral-500',
}

/** Normalize maxStayDays to a 0–100 percentage for the progress bar. Cap at 180 days. */
function stayBarPercent(days: number): number {
  return Math.min(Math.round((days / 180) * 100), 100)
}

// ── Searchable country combobox ───────────────────────────────────────────────

function CountryCombobox({
  value,
  onChange,
  label,
  placeholder,
  excludeCode,
}: {
  value: string
  onChange: (code: string) => void
  label: string
  placeholder: string
  excludeCode?: string
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = COUNTRIES.find((c) => c.code === value)

  const filtered = COUNTRIES.filter(
    (c) =>
      c.code !== excludeCode &&
      (c.name.en.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 10)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function handleSelect(country: Country) {
    onChange(country.code)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <label className="block text-sm text-neutral-400">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={open ? search : (selected?.name.en ?? '')}
          onFocus={() => {
            setOpen(true)
            setSearch('')
          }}
          onChange={(e) => {
            setSearch(e.target.value)
            setOpen(true)
          }}
          placeholder={placeholder}
          className="w-full rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm text-white focus:border-neutral-600 outline-none transition-colors"
          autoComplete="off"
        />
        {value && !open && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-neutral-500">
            {value}
          </span>
        )}
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-900 shadow-lg max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-neutral-500">No matches found</p>
          ) : (
            filtered.map((country) => (
              <button
                key={country.code}
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800 flex items-center gap-3 transition-colors"
                onMouseDown={() => handleSelect(country)}
              >
                <span className="font-mono text-xs text-neutral-500 w-7 shrink-0">
                  {country.code}
                </span>
                <span>{country.name.en}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VisaRequirementCheckerTool() {
  const { sendEvent } = useAnalyticsEvent()

  // Persist the last-used country pair across visits
  const [countries, setCountries] = useLocalStorage<SavedCountries>(
    'visa-checker-countries',
    { from: '', to: '' }
  )

  // Derive result as a pure computation — no state needed
  const result: VisaRequirementResult | null =
    countries.from && countries.to
      ? checkVisaRequirement(countries.from, countries.to)
      : null

  // A stable key that changes when the country pair changes, to retrigger fade-in
  const resultKey = `${countries.from}:${countries.to}`

  // Track previous countries to fire analytics only on actual changes
  const prevCountriesRef = useRef<SavedCountries>({ from: '', to: '' })
  const inputEnteredRef = useRef<boolean>(false)

  useEffect(() => {
    sendEvent('tool_open')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fire analytics when a new valid combination is selected
  useEffect(() => {
    if (
      countries.from &&
      countries.to &&
      (countries.from !== prevCountriesRef.current.from ||
        countries.to !== prevCountriesRef.current.to)
    ) {
      prevCountriesRef.current = { from: countries.from, to: countries.to }
      sendEvent('calculate')
    }
  }, [countries]) // eslint-disable-line react-hooks/exhaustive-deps

  const fromCountry = COUNTRIES.find((c) => c.code === countries.from)
  const toCountry = COUNTRIES.find((c) => c.code === countries.to)

  function fireInputEnterOnce() {
    if (!inputEnteredRef.current) {
      inputEnteredRef.current = true
      sendEvent('input_enter')
    }
  }

  function handleFromChange(code: string) {
    fireInputEnterOnce()
    setCountries((prev) => ({ ...prev, from: code }))
  }

  function handleToChange(code: string) {
    fireInputEnterOnce()
    setCountries((prev) => ({ ...prev, to: code }))
  }

  return (
    <div className="space-y-6">
      {/* Country selectors */}
      <section className="rounded-lg bg-[#141414] border border-neutral-800 p-5 space-y-4">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wide">
          Select Countries
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CountryCombobox
            value={countries.from}
            onChange={handleFromChange}
            label="Passport / Departure country"
            placeholder="Search country…"
            excludeCode={countries.to}
          />
          <CountryCombobox
            value={countries.to}
            onChange={handleToChange}
            label="Destination country"
            placeholder="Search country…"
            excludeCode={countries.from}
          />
        </div>

        {countries.from && countries.to && (
          <p className="text-xs text-neutral-500">
            {fromCountry?.name.en ?? countries.from} passport → entering{' '}
            {toCountry?.name.en ?? countries.to}
          </p>
        )}
      </section>

      {/* Result card */}
      {result && (
        <div key={resultKey} className="animate-fade-in space-y-4">
          <div className="rounded-lg border border-neutral-700 bg-[#141414] p-5 space-y-4">
            {/* Badge + headline */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <p className="text-xs text-neutral-500 uppercase tracking-wide">
                  Visa requirement
                </p>
                <p className="text-2xl font-bold text-white">
                  {BADGE_LABEL[result.requirementType]}
                </p>
              </div>
              <span
                className={`shrink-0 mt-1 px-2.5 py-1 rounded text-xs font-medium border ${BADGE_CLASS[result.requirementType]}`}
              >
                {BADGE_LABEL[result.requirementType]}
              </span>
            </div>

            {/* Max stay progress bar */}
            {result.maxStayDays !== undefined && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Maximum stay</span>
                  <span className="font-semibold text-[#f59e0b] tabular-nums">
                    {result.maxStayDays} days
                  </span>
                </div>
                <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#f59e0b]/70 transition-all duration-500"
                    style={{ width: `${stayBarPercent(result.maxStayDays)}%` }}
                    role="progressbar"
                    aria-valuenow={result.maxStayDays}
                    aria-valuemin={0}
                    aria-valuemax={180}
                    aria-label={`Maximum stay: ${result.maxStayDays} days`}
                  />
                </div>
                <p className="text-xs text-neutral-600">
                  Bar shows days relative to 180-day reference
                </p>
              </div>
            )}

            {/* Note */}
            <p className="text-sm text-neutral-300 leading-relaxed border-t border-neutral-800 pt-4">
              {result.note}
            </p>

            {/* Mandatory always-visible notice — do not remove */}
            <div className="rounded-lg border border-amber-900/40 bg-amber-950/10 px-3 py-2.5 text-xs text-amber-200 leading-relaxed">
              <strong>Always verify before travel.</strong> Visa policies change frequently.
              Confirm requirements with the official embassy, consulate, or government travel
              portal of your destination country. This tool uses a static data snapshot and is
              not a live government database.
            </div>
          </div>

          {/* Travel insurance recommendation */}
          <div className="rounded-lg border border-neutral-800 bg-[#141414] p-5 space-y-3">
            <h3 className="text-sm font-medium text-neutral-300">Travel Insurance Guidance</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Regardless of visa requirements, travel insurance is strongly recommended for all
              international trips. Consider coverage that includes:
            </p>
            <ul className="text-xs text-neutral-400 space-y-1.5">
              <li>• Medical emergencies and emergency evacuation</li>
              <li>• Trip cancellation and interruption</li>
              <li>• Lost, stolen, or delayed baggage</li>
              <li>• Travel delay expenses (accommodation, meals)</li>
              <li>• Personal liability</li>
            </ul>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Some destinations (particularly EU/Schengen visa applicants) require proof of
              travel medical insurance covering at least €30,000 as part of the visa application.
              Compare plans from multiple insurers to find coverage suited to your trip length
              and activities.
            </p>
          </div>
        </div>
      )}

      {/* Empty state prompt */}
      {!countries.from && !countries.to && (
        <div className="rounded-lg border border-dashed border-neutral-800 bg-neutral-900/40 p-6 text-center">
          <p className="text-sm text-neutral-500">
            Select your passport country and destination above to see visa requirements.
          </p>
        </div>
      )}

      {/* Data source note — always visible */}
      <p className="text-xs text-neutral-600 leading-relaxed">
        Data based on a static reference snapshot (last reviewed 2026-07-03). Sources include
        official embassy and consulate pages, IATA Travel Centre, and Henley Passport Index.
        Not a live government data feed — always reconfirm before booking.
      </p>
    </div>
  )
}
