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
 * - La carga es una suscripción: el efecto lanza la promesa y solo aplica el
 *   resultado si sigue activo (StrictMode monta dos veces; "Reintentar" puede
 *   llegar antes que una respuesta lenta).
 * - La UI solo habla con este hook; nunca con services/ ni con Supabase.
 */
export function useEmissions(repository: EmissionsRepository = defaultRepository): UseEmissionsResult {
  const [repo] = useState(() => repository)

  const [emissions, setEmissions] = useState<readonly Emission[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Cambiarlo vuelve a disparar el efecto de carga ("Reintentar").
  const [loadRequest, setLoadRequest] = useState(0)

  const mountedRef = useRef(false)
  // Bloqueo síncrono de doble envío: el estado isSubmitting llega un render tarde.
  const submittingRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let active = true
    repo.list().then(
      (rows) => {
        if (!active) return
        setEmissions(rows)
        setStatus('success')
      },
      (error: unknown) => {
        if (!active) return
        setLoadError(messageOf(error))
        setStatus('error')
      },
    )
    return () => {
      active = false
    }
  }, [repo, loadRequest])

  const reload = useCallback(() => {
    setStatus('loading')
    setLoadError(null)
    setLoadRequest((n) => n + 1)
  }, [])

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
      simulation: repo.simulation,
      emissions,
      status,
      loadError,
      isSubmitting,
      submitError,
      addEmission,
      reload,
      clearSubmitError,
    }),
    [repo, emissions, status, loadError, isSubmitting, submitError, addEmission, reload, clearSubmitError],
  )
}
