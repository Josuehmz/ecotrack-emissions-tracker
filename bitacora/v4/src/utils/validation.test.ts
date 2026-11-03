import { describe, expect, it } from 'vitest'
import { parseDecimal, validateEmissionForm } from './validation.ts'

describe('parseDecimal', () => {
  it.each([
    ['1.234,5', 1234.5],
    ['1234.5', 1234.5],
    ['1234,5', 1234.5],
    ['12.345.678', 12345678],
    ['0', 0],
    ['  42  ', 42],
    ['-3', -3],
  ])('acepta %s', (input, expected) => {
    expect(parseDecimal(input)).toBe(expected)
  })

  it.each(['', '1,2,3', 'abc', 'Infinity', '1e5', '12.34.5', ',5', '5,'])('rechaza %j', (input) => {
    expect(parseDecimal(input)).toBeNull()
  })
})

describe('validateEmissionForm', () => {
  it('devuelve la medición normalizada si todo es válido', () => {
    const result = validateEmissionForm({ sourceName: '  Caldera norte ', category: 'Energía', co2Kg: '1.234,5' })
    expect(result).toEqual({ ok: true, value: { sourceName: 'Caldera norte', category: 'Energía', co2Kg: 1234.5 } })
  })

  it('omite los campos sin error (no escribe undefined)', () => {
    const result = validateEmissionForm({ sourceName: '', category: 'Energía', co2Kg: '10' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(['sourceName'])
  })

  it('rechaza negativos con un mensaje propio', () => {
    const result = validateEmissionForm({ sourceName: 'Flota', category: 'Transporte', co2Kg: '-3' })
    expect(result).toEqual({ ok: false, errors: { co2Kg: 'No puede ser negativo.' } })
  })

  it('rechaza el vacío y lo que no es número', () => {
    const vacio = validateEmissionForm({ sourceName: 'Flota', category: 'Transporte', co2Kg: '  ' })
    const texto = validateEmissionForm({ sourceName: 'Flota', category: 'Transporte', co2Kg: '1,2,3' })
    expect(vacio.ok || texto.ok).toBe(false)
  })

  it('rechaza nombres de más de 80 caracteres', () => {
    const result = validateEmissionForm({ sourceName: 'x'.repeat(81), category: 'Residuos', co2Kg: '1' })
    expect(result).toEqual({ ok: false, errors: { sourceName: 'Máximo 80 caracteres.' } })
  })
})
