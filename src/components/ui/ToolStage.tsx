type ToolStageProps = {
  children: React.ReactNode
}

// Wraps the page title + tool so the tool fills the first screen on entry.
// min-height = viewport minus header (~3.5rem); together with the page's top
// padding this pushes the following SEO content ("About This Tool" etc.) below the fold.
export default function ToolStage({ children }: ToolStageProps) {
  return (
    <div data-testid="tool-stage" className="min-h-[calc(100svh-3.5rem)] flex flex-col gap-8">
      {children}
    </div>
  )
}
