import type { AdSlotConfig } from '@/types/tool'

type AdSlotProps = {
  position: AdSlotConfig['position']
  minHeightPx: number
}

export default function AdSlot({ position, minHeightPx }: AdSlotProps) {
  return (
    <div
      data-ad-position={position}
      className="w-full bg-neutral-900 border border-dashed border-neutral-800"
      style={{ minHeight: minHeightPx }}
      aria-hidden="true"
    />
  )
}
