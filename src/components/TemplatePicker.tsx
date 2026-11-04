import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../api/client'
import type { components } from '../api/schema'
import { BLOCK_TYPE_LABEL } from '../lib/blockTypes'
import ErrorText from './ErrorText'

type BlockInput = components['schemas']['BlockInputDto']
export const templatesKey = ['me', 'templates']

/** Lista de plantillas del coach: usar (agrega sus bloques) o borrar. */
export default function TemplatePicker({ onUse }: { onUse: (blocks: BlockInput[]) => void }) {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: templatesKey, queryFn: () => unwrap(api.GET('/me/templates')) })
  const remove = useMutation({
    mutationFn: (id: string) => unwrap(api.DELETE('/me/templates/{id}', { params: { path: { id } } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: templatesKey }),
  })

  return (
    <div className="space-y-2 rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
      <p className="text-sm font-semibold">Tus plantillas</p>
      {q.isLoading && <p className="text-sm text-zinc-400">Cargando…</p>}
      <ErrorText error={q.error ?? remove.error} />
      {q.data?.length === 0 && (
        <p className="text-sm text-zinc-500">Todavía no tenés. Usá "☆ Plantilla" en un bloque o "☆ Guardar día como plantilla".</p>
      )}
      <ul className="divide-y divide-zinc-800">
        {q.data?.map((t) => (
          <li key={t.id} className="flex items-center gap-2 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{t.name}</p>
              <p className="truncate text-xs text-zinc-500">
                {t.blocks.length === 1
                  ? `${BLOCK_TYPE_LABEL[t.blocks[0].type]}${t.blocks[0].title ? ` · ${t.blocks[0].title}` : ''}`
                  : `${t.blocks.length} bloques: ${t.blocks.map((b) => b.title || BLOCK_TYPE_LABEL[b.type]).join(', ')}`}
              </p>
            </div>
            <button type="button" className="btn-primary px-3 py-1 text-xs" onClick={() => onUse(t.blocks)}>Usar</button>
            <button type="button" className="px-2 text-zinc-500 hover:text-red-300" title="Borrar plantilla"
              onClick={() => confirm(`¿Borrar la plantilla "${t.name}"?`) && remove.mutate(t.id)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
