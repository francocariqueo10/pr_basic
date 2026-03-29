import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../api'
import type { Team } from '../../types'

const PALETTE = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#e91e63','#00bcd4','#8bc34a']

interface Props {
  team: Team
  colorIndex: number
  onClose: () => void
}

export default function PlayerProfileModal({ team, colorIndex, onClose }: Props) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const color = team.flag_url ?? PALETTE[colorIndex % PALETTE.length]

  const [name, setName] = useState(team.name)
  const [nickname, setNickname] = useState(team.nickname ?? '')
  const [email, setEmail] = useState(team.email ?? '')
  const [avatarUrl, setAvatarUrl] = useState(team.avatar_url ?? '')
  const [avatarPreview, setAvatarPreview] = useState(team.avatar_url ?? '')
  const [error, setError] = useState('')
  const [inviteMsg, setInviteMsg] = useState('')

  const saveMutation = useMutation({
    mutationFn: () => api.adminTeams.update(team.id, {
      name,
      nickname: nickname || null,
      email: email || null,
      avatar_url: avatarPreview || null,
      fifa_team: team.fifa_team,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      qc.invalidateQueries({ queryKey: ['matches'] })
      onClose()
    },
    onError: (e: any) => setError(e.response?.data?.detail ?? 'Error al guardar'),
  })

  const inviteMutation = useMutation({
    mutationFn: () => api.adminTeams.invite(team.id),
    onSuccess: (data: any) => setInviteMsg(data.message),
    onError: (e: any) => setError(e.response?.data?.detail ?? 'Error al enviar invitación'),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      setAvatarPreview(result)
      setAvatarUrl(result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0d1526] border border-[#1e2a4a] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between border-b border-[#1e2a4a]"
          style={{ background: `linear-gradient(135deg, ${color}15 0%, transparent 100%)` }}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={name}
                  className="w-14 h-14 rounded-2xl object-cover border-2"
                  style={{ borderColor: color + '66' }}
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black"
                  style={{ backgroundColor: color + '22', color, border: `2px solid ${color}44` }}
                >
                  {team.code.slice(0, 2)}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold"
              >
                📷
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            <div>
              <h2 className="font-black text-lg">{team.name}</h2>
              {team.fifa_team && <p className="text-xs text-[#d4af37]/70">⚽ {team.fifa_team}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-700/40 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          {inviteMsg && (
            <div className="bg-green-900/30 border border-green-700/40 text-green-400 text-sm rounded-xl px-4 py-3">
              ✓ {inviteMsg}
            </div>
          )}

          {/* Avatar URL or upload */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Foto de perfil</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="URL de imagen (o sube una foto)"
                value={avatarUrl.startsWith('data:') ? '' : avatarUrl}
                onChange={e => { setAvatarUrl(e.target.value); setAvatarPreview(e.target.value) }}
                className="flex-1 bg-[#1e2a4a] border border-[#2a3a6a] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37]"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="px-3 py-2 border border-[#2a3a6a] text-gray-400 rounded-xl text-sm hover:bg-[#1e2a4a] hover:text-white transition-colors flex-shrink-0"
              >
                📁 Subir
              </button>
              {avatarPreview && (
                <button
                  onClick={() => { setAvatarPreview(''); setAvatarUrl('') }}
                  className="px-3 py-2 border border-red-900/50 text-red-400 rounded-xl text-sm hover:bg-red-900/20"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30}
              className="w-full bg-[#1e2a4a] border border-[#2a3a6a] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Apodo <span className="text-gray-600">(opcional)</span></label>
            <input
              type="text"
              placeholder="Ej: El Depredador"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={30}
              className="w-full bg-[#1e2a4a] border border-[#2a3a6a] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              placeholder="jugador@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#1e2a4a] border border-[#2a3a6a] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !name.trim()}
              className="flex-1 py-2.5 bg-[#d4af37] text-[#06091a] font-bold rounded-xl text-sm hover:bg-[#e6c84a] transition-colors disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Guardando...' : '✓ Guardar perfil'}
            </button>
            <button
              onClick={() => { setError(''); setInviteMsg(''); inviteMutation.mutate() }}
              disabled={inviteMutation.isPending || !email}
              title={!email ? 'Agrega un email primero' : 'Enviar invitación por email'}
              className="px-4 py-2.5 border border-[#d4af37]/40 text-[#d4af37] font-bold rounded-xl text-sm hover:bg-[#d4af37]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {inviteMutation.isPending ? '...' : '✉️ Invitar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
