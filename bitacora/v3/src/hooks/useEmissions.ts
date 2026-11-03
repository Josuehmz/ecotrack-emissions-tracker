import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { defaultRepository } from '../services/index.ts'
import type {
  Emission,
  EmissionsRepository,
  LoadStatus,
  NewEmission,
  UseEmissionsResult,
} from '../types/emissions.ts'

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}

/**
 * Estado de la pantalla de emisiones: carga, inserción y errores.
 *
 * - El repositorio entra por parámetro (Supabase o demo por defecto) para probar
 *   sin red. Se fija el del PRIMER render: si quien llama crea uno nuevo en cada
 *   render, el hook no recarga sin fin (bug encontrado en v2).
 * - La UI solo habla con este hook; nunca con services/ ni con Supabase.
 */
export function useEmissions(repository: EmissionsRepository = defaultRepository): UseEmissionsResult {
  const [repo] = useState(() => repository)

  const [emissions, setEmissions] = useState<readonly Emission[]>([])
  // Empieza en 'loading': así el efecto no necesita un setState síncrono.
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Solo la última carga pedida escribe el estado; desmontar invalida todas.
  const lastRequestRef = useRef(0)
  const mountedRef = useRef(false)
  // Bloqueo síncrono de doble envío: el estado isSubmitting llega un render tarde.
  const submittingRef = useRef(false)

  /** Pide el listado y aplica el resultado si sigue siendo la última petición. No hace setState síncrono. */
  const fetchList = useCallback(async () => {
    const requestId = ++lastRequestRef.current
    try {
      const rows = await repo.list()
      if (requestId !== lastRequestRef.current) return
      setEmissions(rows)
      setStatus('success')
    } catch (error) {
      if (requestId !== lastRequestRef.current) return
      setLoadError(messageOf(error))
      setStatus('error')
    }
  }, [repo])

  useEffect(() => {
    mountedRef.current = true
    void fetchList()
    return () => {
      mountedRef.current = false
      lastRequestRef.current++ // descarta la respuesta en vuelo (StrictMode monta dos veces)
    }
  }, [fetchList])

  const reload = useCallback(async () => {
    setStatus('loading')
    setLoadError(null)
    await fetchList()
  }, [fetchList])

  const addEmission = useCallback(
    async (input: NewEmission) => {
      if (submittingRef.current) return false
      submittingRef.current = true
      setIsSubmitting(true)
      setSubmitError(null)
      try {
        // Pesimista: el id y la fecha vienen de la base de datos.
        const created = await repo.insert(input)
        if (mountedRef.current) setEmissions((prev) => [created, ...prev])
        return true
      } catch (error) {
        if (mountedRef.current) setSubmitError(messageOf(error))
        return false
      } finally {
        submittingRef.current = false
        if (mountedRef.current) setIsSubmitting(false)
      }
    },
    [repo],
  )

  const clearSubmitError = useCallback(() => setSubmitError(null), [])

  // Objeto estable mientras nada cambie: los componentes memorizados no se re-renderizan de más.
  return useMemo(
    () => ({
      mode: repo.mode,
      emissions,
      status,
      loadError,
      isSubmitting,
      submitError,
      addEmission,
      reload,
      clearSubmitError,
    }),
    [repo.mode, emissions, status, loadError, isSubmitting, submitError, addEmission, reload, clearSubmitError],
  )
}
