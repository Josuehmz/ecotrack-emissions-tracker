import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Emission, EmissionsRepository, NewEmission } from '../types/emissions.ts'
import { useEmissions } from './useEmissions.ts'

const SAMPLE: Emission = {
  id: 'e-1',
  sourceName: 'Caldera planta norte',
  category: 'Energía',
  co2Kg: 120,
  measuredAt: '2026-11-03T10:00:00Z',
}

const NEW: NewEmission = { sourceName: 'Camión 12', category: 'Transporte', co2Kg: 45.5 }

/** Repositorio falso: cada prueba decide qué devuelve o qué error lanza. */
function fakeRepository(overrides: Partial<EmissionsRepository> = {}): EmissionsRepository {
  return {
    mode: 'demo',
    list: async () => [SAMPLE],
    insert: async (input) => ({ ...input, id: 'e-2', measuredAt: '2026-11-03T11:00:00Z' }),
    ...overrides,
  }
}

describe('useEmissions', () => {
  it('carga el listado: loading y después success', async () => {
    const { result } = renderHook(() => useEmissions(fakeRepository()))
    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.emissions).toEqual([SAMPLE])
    expect(result.current.loadError).toBeNull()
  })

  it('si la carga falla expone el mensaje y status error', async () => {
    const repo = fakeRepository({
      list: async () => {
        throw new Error('No se pudo conectar con Supabase.')
      },
    })
    const { result } = renderHook(() => useEmissions(repo))

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.loadError).toBe('No se pudo conectar con Supabase.')
    expect(result.current.emissions).toEqual([])
  })

  it('inserta y pone la nueva medición de primera', async () => {
    const { result } = renderHook(() => useEmissions(fakeRepository()))
    await waitFor(() => expect(result.current.status).toBe('success'))

    let ok = false
    await act(async () => {
      ok = await result.current.addEmission(NEW)
    })

    expect(ok).toBe(true)
    expect(result.current.emissions.map((e) => e.id)).toEqual(['e-2', 'e-1'])
    expect(result.current.isSubmitting).toBe(false)
  })

  it('si la inserción falla conserva la lista y expone submitError', async () => {
    const repo = fakeRepository({
      insert: async () => {
        throw new Error('No tienes permiso para esta operación (política RLS).')
      },
    })
    const { result } = renderHook(() => useEmissions(repo))
    await waitFor(() => expect(result.current.status).toBe('success'))

    let ok = true
    await act(async () => {
      ok = await result.current.addEmission(NEW)
    })

    expect(ok).toBe(false)
    expect(result.current.submitError).toBe('No tienes permiso para esta operación (política RLS).')
    expect(result.current.emissions).toEqual([SAMPLE])
    expect(result.current.isSubmitting).toBe(false)
  })
})
