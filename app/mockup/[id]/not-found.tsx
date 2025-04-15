import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Mockup no encontrado</h2>
        <p className="text-slate-600 mb-6">El mockup que estás buscando no existe o ha sido eliminado.</p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
