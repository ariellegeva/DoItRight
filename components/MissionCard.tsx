'use client'

import { useState } from 'react'
import { Trash2, Check, Pencil, X } from 'lucide-react'
import clsx from 'clsx'
import { deleteMission, updateMissionText, checkInToday, uncheckToday, getToday } from '@/lib/storage'
import type { Mission } from '@/lib/types'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function getWeekDays(weekOf: string): string[] {
  const monday = new Date(weekOf + 'T12:00:00')
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

interface Props {
  mission: Mission
  onUpdate: () => void
  readonly?: boolean
}

export default function MissionCard({ mission, onUpdate, readonly = false }: Props) {
  const [editing, setEditing]       = useState(false)
  const [editText, setEditText]     = useState(mission.text)
  const [editEmoji, setEditEmoji]   = useState(mission.emoji)
  const [showDone, setShowDone]     = useState(false)

  const today      = getToday()
  const checkins   = mission.checkins ?? []
  const doneToday  = checkins.includes(today)
  const weekDays   = getWeekDays(mission.weekOf)
  const totalDone  = checkins.length

  function handleCheck() {
    if (doneToday) {
      uncheckToday(mission.id)
    } else {
      checkInToday(mission.id)
      setShowDone(true)
      setTimeout(() => setShowDone(false), 2200)
    }
    onUpdate()
  }

  function handleDelete() {
    deleteMission(mission.id)
    onUpdate()
  }

  function handleSave() {
    if (editText.trim()) {
      updateMissionText(mission.id, editText.trim(), editEmoji)
      onUpdate()
    }
    setEditing(false)
  }

  return (
    <div className={clsx(
      'relative rounded-2xl p-4 transition-all duration-300 animate-fade-in overflow-hidden',
      doneToday ? 'border border-ice-400/30' : 'glass',
    )}
    style={doneToday ? { background: 'rgba(56,189,248,0.07)' } : {}}>

      {/* "Done for today!" flash banner */}
      {showDone && (
        <div className="absolute inset-x-0 top-0 flex items-center justify-center py-1.5 rounded-t-2xl animate-fade-in"
             style={{ background: 'linear-gradient(90deg, rgba(56,189,248,0.3), rgba(14,165,233,0.3))' }}>
          <span className="text-xs font-black text-ice-200 tracking-wide">Done for today! 🎉</span>
        </div>
      )}

      {editing ? (
        <div className="flex items-center gap-2">
          <input value={editEmoji} onChange={e => setEditEmoji(e.target.value)}
                 className="w-10 text-xl bg-transparent border border-ice-400/20 rounded-xl p-1 text-center focus:outline-none"
                 maxLength={2} />
          <input value={editText} onChange={e => setEditText(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleSave()}
                 className="flex-1 bg-transparent border border-ice-400/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-ice-400/70 font-semibold"
                 autoFocus />
          <button onClick={handleSave} className="p-2 text-ice-400 hover:text-ice-200 transition-colors">
            <Check size={18} />
          </button>
          <button onClick={() => setEditing(false)} className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>
      ) : (
        <div className={clsx('flex items-center gap-3', showDone && 'mt-5')}>
          {/* Daily check button */}
          {!readonly && (
            <button onClick={handleCheck}
                    className={clsx(
                      'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                      doneToday
                        ? 'border-ice-400 scale-110'
                        : 'border-ice-400/30 hover:border-ice-400/60',
                    )}
                    style={doneToday ? { background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', boxShadow: '0 0 12px rgba(56,189,248,0.6)' } : {}}>
              {doneToday && <Check size={14} className="text-dark-950" strokeWidth={3} />}
            </button>
          )}

          <span className="text-xl flex-shrink-0">{mission.emoji}</span>

          {/* Mission text — never crossed out mid-week */}
          <span className={clsx('flex-1 text-sm font-semibold leading-snug',
            mission.completed ? 'text-slate-500 line-through' : 'text-white')}>
            {mission.text}
          </span>

          {!readonly && (
            <div className="flex gap-1 ml-auto">
              <button onClick={() => setEditing(true)}
                      className="p-1.5 text-slate-600 hover:text-ice-300 transition-colors rounded-lg hover:bg-ice-400/10">
                <Pencil size={13} />
              </button>
              <button onClick={handleDelete}
                      className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10">
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Weekly day dots */}
      {!editing && (
        <div className="flex items-center gap-1.5 mt-3 ml-11">
          {weekDays.map((day, i) => {
            const checked  = checkins.includes(day)
            const isToday  = day === today
            return (
              <div key={day} className="flex flex-col items-center gap-0.5">
                <div className={clsx(
                  'w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300',
                  checked
                    ? 'shadow-[0_0_6px_rgba(56,189,248,0.6)]'
                    : isToday
                    ? 'border-2 border-ice-400/40'
                    : 'border border-slate-700',
                )}
                style={checked ? { background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)' } : {}}>
                  {checked && <Check size={9} className="text-dark-950" strokeWidth={3} />}
                </div>
                <span className={clsx('text-[8px] font-black',
                  isToday ? 'text-ice-400' : 'text-slate-600')}>
                  {DAY_LABELS[i]}
                </span>
              </div>
            )
          })}
          {totalDone > 0 && (
            <span className="ml-1 text-[10px] font-black text-ice-400/60">{totalDone}×</span>
          )}
        </div>
      )}
    </div>
  )
}
