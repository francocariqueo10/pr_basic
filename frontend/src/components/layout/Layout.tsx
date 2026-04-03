import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-ucl-black text-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-white/8 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-ucl-blue text-lg font-black tracking-widest">✦ ✦ ✦</span>
            <span className="text-xs text-ucl-silver uppercase tracking-[0.15em]">Campeonato FIFA 2026</span>
          </div>
          <span className="text-xs text-ucl-silver/50">Torneo privado · Todos los derechos reservados</span>
        </div>
      </footer>
    </div>
  )
}
