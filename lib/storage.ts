import type { User, Mission, Friend } from './types'

const KEYS = {
  USER: 'dir_user',
  MISSIONS: 'dir_missions',
} as const

function isBrowser() {
  return typeof window !== 'undefined'
}

// ── User ──────────────────────────────────────────────────────────────────────

export function getUser(): User | null {
  if (!isBrowser()) return null
  const raw = localStorage.getItem(KEYS.USER)
  return raw ? (JSON.parse(raw) as User) : null
}

export function saveUser(user: User): void {
  localStorage.setItem(KEYS.USER, JSON.stringify(user))
}

export function clearUser(): void {
  localStorage.removeItem(KEYS.USER)
}

// ── Missions ──────────────────────────────────────────────────────────────────

export function getMissions(): Mission[] {
  if (!isBrowser()) return []
  const raw = localStorage.getItem(KEYS.MISSIONS)
  return raw ? (JSON.parse(raw) as Mission[]) : []
}

export function saveMissions(missions: Mission[]): void {
  localStorage.setItem(KEYS.MISSIONS, JSON.stringify(missions))
}

export function addMissions(newMissions: Mission[]): void {
  const existing = getMissions()
  saveMissions([...existing, ...newMissions])
}

export function toggleMission(id: string): void {
  const missions = getMissions()
  saveMissions(missions.map(m => m.id === id ? { ...m, completed: !m.completed } : m))
}

export function deleteMission(id: string): void {
  saveMissions(getMissions().filter(m => m.id !== id))
}

export function updateMissionText(id: string, text: string, emoji: string): void {
  saveMissions(getMissions().map(m => m.id === id ? { ...m, text, emoji } : m))
}

// ── Week helpers ──────────────────────────────────────────────────────────────

export function getCurrentWeekMonday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

export function getMissionsForWeek(weekOf: string): Mission[] {
  return getMissions().filter(m => m.weekOf === weekOf)
}

export function formatWeekLabel(weekOf: string): string {
  const date = new Date(weekOf + 'T12:00:00')
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function getPastWeeks(): string[] {
  const missions = getMissions()
  const current = getCurrentWeekMonday()
  const weeks = Array.from(new Set(missions.map(m => m.weekOf)))
    .filter(w => w < current)
    .sort((a, b) => b.localeCompare(a))
  return weeks
}

// ── Streak ────────────────────────────────────────────────────────────────────

export function calculateStreak(): number {
  const missions = getMissions()
  if (missions.length === 0) return 0

  const weekSet = new Set(
    missions.filter(m => m.completed).map(m => m.weekOf)
  )

  let streak = 0
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1)
  const cursor = new Date(today)
  cursor.setDate(diff)
  cursor.setHours(0, 0, 0, 0)

  // Start from last week if current week has no completions yet
  const currentKey = cursor.toISOString().split('T')[0]
  if (!weekSet.has(currentKey)) {
    cursor.setDate(cursor.getDate() - 7)
  }

  while (true) {
    const key = cursor.toISOString().split('T')[0]
    if (!weekSet.has(key)) break
    streak++
    cursor.setDate(cursor.getDate() - 7)
  }

  return streak
}

// ── Mock Friends (replaced by Firebase later) ─────────────────────────────────

export const MOCK_FRIENDS: Friend[] = [
  {
    id: '1',
    name: 'Sarah K.',
    initials: 'SK',
    streak: 8,
    missions: [
      { id: 'f1m1', text: 'Drink 10 glasses of water daily', emoji: '💧', completed: true },
      { id: 'f1m2', text: 'Morning yoga for 20 minutes', emoji: '🧘', completed: true },
      { id: 'f1m3', text: 'No processed snacks this week', emoji: '🥗', completed: false },
    ],
  },
  {
    id: '2',
    name: 'Mike R.',
    initials: 'MR',
    streak: 3,
    missions: [
      { id: 'f2m1', text: 'Hit the gym 3 times this week', emoji: '🏋️', completed: true },
      { id: 'f2m2', text: 'Sleep by 11pm every night', emoji: '😴', completed: false },
      { id: 'f2m3', text: 'Walk 10,000 steps daily', emoji: '🚶', completed: true },
    ],
  },
  {
    id: '3',
    name: 'Emma L.',
    initials: 'EL',
    streak: 12,
    missions: [
      { id: 'f3m1', text: 'Run 5km at least 4 times', emoji: '🏃', completed: true },
      { id: 'f3m2', text: 'Meditate for 10 minutes daily', emoji: '🌟', completed: true },
      { id: 'f3m3', text: 'Cook dinner at home 5 nights', emoji: '🍳', completed: true },
    ],
  },
]
