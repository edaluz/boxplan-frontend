import type { Block } from '../api/client'
import { SCORE_LABEL } from '../lib/scores'
import SetsCalculator from './SetsCalculator'
import YouTubeEmbed from './YouTubeEmbed'
import { useState } from 'react'
import TimerRun from '../timers/TimerRun'
import { BLOCK_TYPE_LABEL, timerConfigFor, timingLabel } from '../lib/blockTypes'

export default function BlockView({ block, children, calculator }: { block: Block; children?: React.ReactNode; calculator?: boolean }) {
  return (
    <div className="border-l-2 border-lime-400/60 pl-3">
      <div className="flex flex-wrap items-baseline gap-2">
        {block.title && <h4 className="font-semibold">{block.title}</h4>}
        <span className="text-xs uppercase tracking-wide text-zinc-400">{BLOCK_TYPE_LABEL[block.type]}</span>
        {block.scoreType && <span className="text-xs text-lime-400">· {SCORE_LABEL[block.scoreType]}</span>}
      </div>
      {timingLabel(block) && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-200">{timingLabel(block)}</span>
          <StartTimerButton block={block} />
        </div>
      )}
      {block.movement && <p className="mt-1 text-sm font-semibold text-zinc-100">{block.movement}</p>}
      {!!block.sets?.length && (calculator && block.sets.some((s) => s.percent != null)
        ? <SetsCalculator block={block} />
        : <p className="mt-1 font-mono text-sm text-lime-200">{formatSets(block.sets)}</p>)}
      {block.content && <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">{block.content}</p>}
      {block.videoUrl && <YouTubeEmbed url={block.videoUrl} />}
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

/** Abre el timer ya configurado, encima de la pantalla actual (al salir quedás donde estabas). */
function StartTimerButton({ block }: { block: Block }) {
  const [open, setOpen] = useState(false)
  const config = timerConfigFor(block)
  if (!config) return null
  return (
    <>
      <button type="button" className="text-xs font-semibold text-lime-300 hover:text-lime-200" onClick={() => setOpen(true)}>
        ⏱ Iniciar timer
      </button>
      {open && (
        <TimerRun config={config} routine={{ title: block.title, text: block.content }} onExit={() => setOpen(false)} />
      )}
    </>
  )
}
