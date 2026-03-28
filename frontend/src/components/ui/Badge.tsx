type Variant = 'live' | 'completed' | 'scheduled' | 'gold' | 'gray' | 'green' | 'red'

const variants: Record<Variant, string> = {
  live: 'bg-red-600 text-white animate-pulse',
  completed: 'bg-gray-700 text-gray-300',
  scheduled: 'bg-blue-900 text-blue-300',
  gold: 'bg-[#d4af37] text-[#06091a]',
  gray: 'bg-[#1e2a4a] text-gray-300',
  green: 'bg-green-900 text-green-300',
  red: 'bg-red-900 text-red-300',
}

export default function Badge({ label, variant = 'gray' }: { label: string; variant?: Variant }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${variants[variant]}`}>
      {label}
    </span>
  )
}
