import { render, screen } from '@testing-library/react'
import ToolStage from './ToolStage'

describe('ToolStage', () => {
  it('renders its children', () => {
    render(
      <ToolStage>
        <h1>Tool Title</h1>
        <p>Tool body</p>
      </ToolStage>
    )
    expect(screen.getByRole('heading', { name: 'Tool Title' })).toBeInTheDocument()
    expect(screen.getByText('Tool body')).toBeInTheDocument()
  })

  it('fills at least the viewport below the header so following content starts below the fold', () => {
    render(
      <ToolStage>
        <p>Tool body</p>
      </ToolStage>
    )
    const stage = screen.getByTestId('tool-stage')
    expect(stage).toHaveClass('min-h-[calc(100svh-3.5rem)]')
  })
})
