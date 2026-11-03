import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
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

/** Promesa que la prueba resuelve cuando quiere (para observar estados intermedios). */
function deferred<T>() {
  let resolve: (value: T) => void = () => {}
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe('useEmissions', () => {
  it('carga el listado: loading y después success', async () => {
    const { result } = renderHook(() => useEmissions(fakeRepository()))
    expect(result.current.status).toBe('loading')

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current.emissions).toEqual([SAMPLE])
    expect(result.current.loadError).toBeNull()
  })

  it('regresión v2: un repositorio nuevo en cada render no provoca recargas sin fin', async () => {
    const list = vi.fn(async () => [SAMPLE])
    const { result, rerender } = renderHook(() => useEmissions(fakeRepository({ list })))
    await waitFor(() => expect(result.current.status).toBe('success'))
    rerender()
    rerender()
    expect(list).toHaveBeenCalledTimes(1)
  })

  it('si la carga falla expone el mensaje; reload vuelve a intentar', async () => {
    let attempts = 0
    const repo = fakeRepository({
      list: async () => {
        attempts++
        if (attempts === 1) throw new Error('No se pudo conectar con Supabase.')
        return [SAMPLE]
      },
    })
    const { result } = renderHook(() => useEmissions(repo))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.loadError).toBe('No se pudo conectar con Supabase.')

    await act(() => result.current.reload())
    expect(result.current.status).toBe('success')
    expect(result.current.loadError).toBeNull()
    expect(result.current.emissions).toEqual([SAMPLE])
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

    act(() => result.current.clearSubmitError())
    expect(result.current.submitError).toBeNull()
  })

  it('bloquea el doble envío mientras hay una inserción en curso', async () => {
    const pending = deferred<Emission>()
    const insert = vi.fn(() => pending.promise)
    const { result } = renderHook(() => useEmissions(fakeRepository({ insert })))
    await waitFor(() => expect(result.current.status).toBe('success'))

    let first: Promise<boolean> = Promise.resolve(false)
    let second = true
    await act(async () => {
      first = result.current.addEmission(NEW)
      second = await result.current.addEmission(NEW)
    })
    expect(second).toBe(false)
    expect(insert).toHaveBeenCalledTimes(1)
    expect(result.current.isSubmitting).toBe(true)

    await act(async () => {
      pending.resolve({ ...NEW, id: 'e-9', measuredAt: '2026-11-03T12:00:00Z' })
      await first
    })
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.emissions[0]?.id).toBe('e-9')
  })

  it('el objeto devuelto es estable entre renders si nada cambió (useMemo)', async () => {
    const { result, rerender } = renderHook(() => useEmissions(fakeRepository()))
    await waitFor(() => expect(result.current.status).toBe('success'))
    const before = result.current
    rerender()
    expect(result.current).toBe(before)
  })
})
