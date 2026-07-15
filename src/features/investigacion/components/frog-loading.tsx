export function FrogLoading({ message }: { message?: string; fullScreen?: boolean; className?: string }) {
  return (
    <div className="flex items-center justify-center p-6">
      <p className="text-gray-500 font-mono text-sm">{message || 'Cargando...'}</p>
    </div>
  )
}
