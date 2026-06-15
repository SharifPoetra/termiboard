import { Terminal } from 'lucide-react'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-emerald-400 p-8 font-mono flex flex-col items-center justify-center">
      <div className="bg-slate-900 border border-emerald-500/30 p-6 rounded-lg shadow-xl shadow-emerald-950/20 max-w-md w-full">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-4">
          <Terminal className="text-emerald-400 animate-pulse" size={28} />
          <h1 className="text-xl font-bold tracking-wider text-slate-100">TermiBoard v1.0</h1>
        </div>
        
        <p className="text-sm text-slate-400 leading-relaxed">
          Sistem <span className="text-emerald-300 font-semibold">Tailwind CSS v4</span> berhasil terintegrasi dengan React-Vite di dalam arsitektur Monorepo!
        </p>
        
        <div className="mt-6 flex justify-end">
          <button className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold uppercase tracking-widest py-2 px-4 rounded transition-all duration-200 shadow-md shadow-emerald-500/10">
            Initialize Client
          </button>
        </div>
      </div>
    </div>
  )
}
