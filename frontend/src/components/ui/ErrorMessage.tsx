export default function ErrorMessage({ message = 'Error al cargar los datos' }: { message?: string }) {
  return (
    <div className="flex justify-center items-center py-12 text-red-400 gap-2">
      <span>⚠</span>
      <span>{message}</span>
    </div>
  )
}
