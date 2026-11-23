import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('muestra el rango y permite avanzar', async () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        page={1}
        pageCount={3}
        total={25}
        pageSize={10}
        onPageChange={onPageChange}
        label="Páginas de prueba"
      />,
    )

    expect(screen.getByRole('navigation', { name: 'Páginas de prueba' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Página 1 de 3 · 1–10 de 25')

    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('no renderiza nada si hay una sola pagina', () => {
    const { container } = render(
      <Pagination page={1} pageCount={1} total={4} pageSize={10} onPageChange={vi.fn()} />,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
