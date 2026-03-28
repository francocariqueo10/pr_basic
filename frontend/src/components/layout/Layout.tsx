import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-[#1e2a4a] mt-16 py-6 text-center text-sm text-gray-500">
        FIFA World Cup 2026 — Tracker
      </footer>
    </div>
  )
}
