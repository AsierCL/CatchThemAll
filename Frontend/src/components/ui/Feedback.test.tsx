import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ErrorState, LoadingGrid } from './Feedback'

describe('Feedback', () => {
  it('anuncia la carga una sola vez con role status', () => {
    render(<LoadingGrid count={3} label="Cargando catálogo" />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando catálogo')
  })

  it('anuncia los errores como alert', () => {
    render(
      <ErrorState
        error={{ kind: 'network', status: null, title: 'Sin conexión', message: 'Revisá tu conexión.', details: [] }}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión')
  })
})
