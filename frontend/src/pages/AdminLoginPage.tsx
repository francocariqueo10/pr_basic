import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminStore } from '../store/adminStore'

export default function AdminLoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)
  const login = useAdminStore(s => s.login)
  const navigate = useNavigate()

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError(false)
    if (next.length === 4) {
      if (login(next)) {
        navigate('/admin')
      } else {
        setShake(true)
        setError(true)
        setTimeout(() => { setPin(''); setShake(false) }, 600)
      }
    }
  }

  const handleDelete = () => { setPin(p => p.slice(0, -1)); setError(false) }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">⚙️</div>
          <h1 className="text-xl font-bold text-white">Acceso Administrador</h1>
          <p className="text-gray-500 text-sm mt-1">Ingresa tu PIN para continuar</p>
        </div>

        {/* PIN dots */}
        <div className={`flex justify-center gap-4 mb-10 ${shake ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                i < pin.length
                  ? error ? 'bg-red-500 border-red-500' : 'bg-[#d4af37] border-[#d4af37]'
                  : 'border-gray-600'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mb-6">PIN incorrecto</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="h-16 rounded-2xl bg-[#1e2a4a] text-white text-xl font-bold hover:bg-[#2a3a6a] active:bg-[#d4af37] active:text-[#06091a] transition-colors"
            >
              {d}
            </button>
          ))}
          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-[#0d1526] text-gray-500 text-lg hover:bg-[#1e2a4a] transition-colors"
          >
            ←
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-[#1e2a4a] text-white text-xl font-bold hover:bg-[#2a3a6a] active:bg-[#d4af37] active:text-[#06091a] transition-colors"
          >
            0
          </button>
          <div />
        </div>
      </div>
    </div>
  )
}
