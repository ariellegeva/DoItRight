'use client'

import { useState } from 'react'
import { Trash2, Check, Pencil, X } from 'lucide-react'
import clsx from 'clsx'
import { toggleMission, deleteMission, updateMissionText } from '@/lib/storage'
import type { Mission } from '@/lib/types'

interface Props {
  mission: Mission
  onUpdate: () => void
  readonly?: boolean
}

export default function MissionCard({ mission, onUpdate, readonly = false }: Props) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(mission.text)
  const [editEmoji, setEditEmoji] = useState(mission.emoji)

  function handleToggle() {
    toggleMission(mission.id)
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
      'relative rounded-2xl p-4 transition-all duration-300 animate-fade-in',
      mission.completed
        ? 'bg-ice-900/20 border border-ice-700/20'
        : 'glass',
    )}>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            value={editEmoji}
            onChange={e => setEditEmoji(e.target.value)}
            className="w-10 text-xl bg-transparent border border-ice-400/20 rounded-xl p-1 text-center focus:outline-none focus:border-ice-400/60"
            maxLength={2}
          />
          <input
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="flex-1 bg-transparent border border-ice-400/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-ice-400/70 font-semibold"
            autoFocus
          />
          <button onClick={handleSave} className="p-2 text-ice-400 hover:text-ice-200 transition-colors">
            <Check size={18} />
          </button>
          <button onClick={() => setEditing(false)} className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
            <X size={18} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={!readonly ? handleToggle : undefined}
            className={clsx(
              'flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200',
              mission.completed
                ? 'bg-ice-500 border-ice-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                : 'border-ice-400/30 hover:border-ice-400/60',
              readonly && 'cursor-default'
            )}>
            {mission.completed && <Check size={14} className="text-dark-950 font-bold" strokeWidth={3} />}
          </button>

          <span className="text-xl flex-shrink-0">{mission.emoji}</span>

          <span className={clsx(
            'flex-1 text-sm font-semibold leading-snug',
            mission.completed ? 'text-slate-500 line-through' : 'text-white'
          )}>
            {mission.text}
          </span>

          {!readonly && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
              <button onClick={() => setEditing(true)}
                      className="p-1.5 text-slate-500 hover:text-ice-300 transition-colors rounded-lg hover:bg-ice-400/10">
                <Pencil size={14} />
              </button>
              <button onClick={handleDelete}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/10">
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {!readonly && !editing && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
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
  )
}
