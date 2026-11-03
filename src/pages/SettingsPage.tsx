import { setUnit, useUnit, type Unit } from '../lib/units'

const OPTIONS: { value: Unit; label: string }[] = [
  { value: 'kg', label: 'Kilos (kg)' },
  { value: 'lb', label: 'Libras (lb)' },
]

/** Preferencia de unidad (se muestra dentro de Perfil). */
export default function UnitSettings() {
  const unit = useUnit()
  return (
    <section className="card space-y-3">
      <h3 className="font-semibold">Unidad de peso</h3>
      <div className="flex gap-2">
        {OPTIONS.map((o) => (
          <button key={o.value} onClick={() => setUnit(o.value)}
            className={unit === o.value ? 'btn-primary flex-1' : 'btn-ghost flex-1'}>
            {o.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-zinc-500">Se usa para cargas, scores y el cálculo de porcentajes.</p>
    </section>
  )
}
