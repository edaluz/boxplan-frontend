import type { Block } from '../api/client'
import { SCORE_LABEL } from '../lib/scores'
import SetsCalculator from './SetsCalculator'

const TYPE_LABEL: Record<Block['type'], string> = {
  AMRAP: 'AMRAP', EMOM: 'EMOM', FOR_TIME: 'For time', STRENGTH: 'Fuerza / LPO', FREE: 'Libre',
}

export default function BlockView({ block, children, calculator }: { block: Block; children?: React.ReactNode; calculator?: boolean }) {
  return (
    <div className="border-l-2 border-lime-400/60 pl-3">
      <div className="flex flex-wrap items-baseline gap-2">
        {block.title && <h4 className="font-semibold">{block.title}</h4>}
        <span className="text-xs uppercase tracking-wide text-zinc-400">{TYPE_LABEL[block.type]}</span>
        {block.scoreType && <span className="text-xs text-lime-400">· {SCORE_LABEL[block.scoreType]}</span>}
      </div>
      {block.movement && <p className="mt-1 text-sm font-semibold text-zinc-100">{block.movement}</p>}
      {!!block.sets?.length && (calculator && block.sets.some((s) => s.percent != null)
        ? <SetsCalculator block={block} />
        : <p className="mt-1 font-mono text-sm text-lime-200">{formatSets(block.sets)}</p>)}
      {block.content && <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">{block.content}</p>}
      {children}
    </div>
  )
}

/** [{sets:3,reps:'2',percent:60}] → "3x2 al 60%" */
export function formatSets(sets: NonNullable<Block['sets']>): string {
  return sets.map(formatSet).join(' · ')
}

export function formatSet(s: NonNullable<Block['sets']>[number]): string {
  const reps = s.sets > 1 && s.reps.includes('+') ? `(${s.reps})` : s.reps
  return `${s.sets > 1 ? `${s.sets}x` : ''}${reps}${s.percent != null ? ` al ${s.percent}%` : ''}`
}
