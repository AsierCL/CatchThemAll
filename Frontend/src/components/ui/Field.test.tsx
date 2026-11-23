import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Input } from './Field'

describe('Field', () => {
  it('mantiene el hint y el error en aria-describedby a la vez', () => {
    render(<Input label="Nombre" hint="Mínimo 2 caracteres" error="Campo obligatorio" />)

    const input = screen.getByLabelText('Nombre')
    const describedBy = input.getAttribute('aria-describedby')?.split(' ') ?? []

    expect(describedBy).toHaveLength(2)
    expect(screen.getByText('Mínimo 2 caracteres')).toHaveAttribute('id', describedBy[0])
    expect(screen.getByText('Campo obligatorio')).toHaveAttribute('id', describedBy[1])
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })
})
