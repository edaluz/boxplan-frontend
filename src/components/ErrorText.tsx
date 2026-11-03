export default function ErrorText({ error }: { error: unknown }) {
  if (!error) return null
  return <p className="text-sm text-red-400">{error instanceof Error ? error.message : String(error)}</p>
}
