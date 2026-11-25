import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from './Avatar'

describe('Avatar', () => {
  it('cae a las iniciales cuando la foto no carga', () => {
    render(<Avatar name="Ada Lovelace" photoUrl="https://example.com/rota.jpg" />)

    fireEvent.error(screen.getByRole('img', { name: 'Foto de Ada Lovelace' }))

    const fallback = screen.getByRole('img', { name: 'Foto de Ada Lovelace' })
    expect(fallback).toHaveTextContent('AD')
  })

  it('expone un nombre accesible aunque no haya foto', () => {
    render(<Avatar name="Ada Lovelace" />)

    expect(screen.getByRole('img', { name: 'Foto de Ada Lovelace' })).toBeInTheDocument()
  })
})
