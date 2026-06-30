export function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-primary/20" />
        <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-primary" />
      </div>
    </div>
  )
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-400">
      <p className="text-lg font-semibold mb-1">Erreur</p>
      <p className="text-sm opacity-80">{message}</p>
    </div>
  )
}
