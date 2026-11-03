import { describe, expect, it } from 'vitest'
import { createDemoRepository, simulationFromSearch } from './demoRepository.ts'

const NEW = { sourceName: 'Camión 12', category: 'Transporte', co2Kg: 45.5 } as const

describe('simulationFromSearch', () => {
  it.each([
    ['?simular=lento', 'lento'],
    ['?simular=error-carga', 'error-carga'],
    ['?simular=error-guardado', 'error-guardado'],
    ['?simular=vacio', 'vacio'],
    ['?simular=otra-cosa', null],
    ['', null],
  ])('%j → %j', (search, expected) => {
    expect(simulationFromSearch(search)).toBe(expected)
  })
})

describe('createDemoRepository', () => {
  it('sin simulación trae los 5 datos de ejemplo y guarda en memoria', async () => {
    const repo = createDemoRepository({ delayMs: 0 })
    expect(repo.mode).toBe('demo')
    expect(await repo.list()).toHaveLength(5)
    const created = await repo.insert(NEW)
    expect(created.id).toMatch(/^demo-/)
    expect((await repo.list())[0]).toEqual(created)
  })

  it('vacio arranca sin mediciones', async () => {
    expect(await createDemoRepository({ delayMs: 0, simulation: 'vacio' }).list()).toEqual([])
  })

  it('error-carga falla la primera vez y funciona al reintentar', async () => {
    const repo = createDemoRepository({ delayMs: 0, simulation: 'error-carga' })
    await expect(repo.list()).rejects.toThrow('(simulado)')
    expect(await repo.list()).toHaveLength(5)
  })

  it('error-guardado rechaza toda inserción y no cambia la lista', async () => {
    const repo = createDemoRepository({ delayMs: 0, simulation: 'error-guardado' })
    await expect(repo.insert(NEW)).rejects.toThrow('política RLS')
    expect(await repo.list()).toHaveLength(5)
  })
})
