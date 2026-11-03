import { useCallback, useEffect, useRef, useState } from 'react'
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
 * Recibe el repositorio por parámetro (Supabase o demo por defecto) para que
 * las pruebas puedan inyectar uno falso sin red. La UI solo habla con este hook.
 */
export function useEmissions(repository: EmissionsRepository = defaultRepository): UseEmissionsResult {
  const [emissions, setEmissions] = useState<readonly Emission[]>([])
  const [status, setStatus] = useState<LoadStatus>('idle')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Evita setState después de desmontar (StrictMode monta, desmonta y vuelve a montar).
  const mountedRef = useRef(false)
  // Solo la última carga pedida puede escribir el estado (si se pulsa "Reintentar" dos veces).
  const lastRequestRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const reload = useCallback(async () => {
    const requestId = ++lastRequestRef.current
    setStatus('loading')
    setLoadError(null)
    try {
      const rows = await repository.list()
      if (!mountedRef.current || requestId !== lastRequestRef.current) return
      setEmissions(rows)
      setStatus('success')
    } catch (error) {
      if (!mountedRef.current || requestId !== lastRequestRef.current) return
      setLoadError(messageOf(error))
      setStatus('error')
    }
  }, [repository])

  useEffect(() => {
    void reload()
  }, [reload])

  const addEmission = useCallback(
    async (input: NewEmission) => {
      setIsSubmitting(true)
      setSubmitError(null)
      try {
        // Pesimista: el id y la fecha vienen de la base de datos.
        const created = await repository.insert(input)
        if (mountedRef.current) setEmissions((prev) => [created, ...prev])
        return true
      } catch (error) {
        if (mountedRef.current) setSubmitError(messageOf(error))
        return false
      } finally {
        if (mountedRef.current) setIsSubmitting(false)
      }
    },
    [repository],
  )

  const clearSubmitError = useCallback(() => setSubmitError(null), [])

  return {
    mode: repository.mode,
    emissions,
    status,
    loadError,
    isSubmitting,
    submitError,
    addEmission,
    reload,
    clearSubmitError,
  }
}
