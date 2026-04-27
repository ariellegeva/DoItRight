import {
  collection, doc, getDocs, setDoc, deleteDoc,
  updateDoc, writeBatch, query, orderBy,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Mission } from './types'

const missionsCol = (uid: string) => collection(db, 'users', uid, 'missions')
const missionDoc  = (uid: string, id: string) => doc(db, 'users', uid, 'missions', id)

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getMissions(uid: string): Promise<Mission[]> {
  const snap = await getDocs(query(missionsCol(uid), orderBy('createdAt')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Mission))
}

export async function getMissionsForWeek(uid: string, weekOf: string): Promise<Mission[]> {
  const all = await getMissions(uid)
  return all.filter(m => m.weekOf === weekOf)
}

export async function getLastWeekMissions(uid: string): Promise<Mission[]> {
  const current = getCurrentWeekMonday()
  const d = new Date(current + 'T12:00:00')
  d.setDate(d.getDate() - 7)
  const lastWeek = d.toISOString().split('T')[0]
  const all = await getMissions(uid)
  return all.filter(m => m.weekOf === lastWeek)
}

export async function getPastWeeks(uid: string): Promise<string[]> {
  const all  = await getMissions(uid)
  const curr = getCurrentWeekMonday()
  return Array.from(new Set(all.map(m => m.weekOf)))
    .filter(w => w < curr)
    .sort((a, b) => b.localeCompare(a))
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function replaceWeekMissions(uid: string, weekOf: string, missions: Mission[]): Promise<void> {
  const batch   = writeBatch(db)
  const existing = await getMissions(uid)
  existing.filter(m => m.weekOf === weekOf).forEach(m => batch.delete(missionDoc(uid, m.id)))
  missions.forEach(m => batch.set(missionDoc(uid, m.id), m))
  await batch.commit()
}

export async function deleteMission(uid: string, id: string): Promise<void> {
  await deleteDoc(missionDoc(uid, id))
}

export async function updateMissionText(uid: string, id: string, text: string, emoji: string): Promise<void> {
  await updateDoc(missionDoc(uid, id), { text, emoji })
}

export async function checkInToday(uid: string, id: string): Promise<void> {
  const today = getToday()
  const all   = await getMissions(uid)
  const m     = all.find(x => x.id === id)
  if (!m) return
  const checkins = m.checkins ?? []
  if (checkins.includes(today)) return
  await updateDoc(missionDoc(uid, id), { checkins: [...checkins, today] })
}

export async function uncheckToday(uid: string, id: string): Promise<void> {
  const today = getToday()
  const all   = await getMissions(uid)
  const m     = all.find(x => x.id === id)
  if (!m) return
  await updateDoc(missionDoc(uid, id), { checkins: (m.checkins ?? []).filter(d => d !== today) })
}

// ── User profile ──────────────────────────────────────────────────────────────

export async function saveUserProfile(uid: string, name: string, email: string): Promise<void> {
  await setDoc(doc(db, 'users', uid), { name, email, createdAt: new Date().toISOString() }, { merge: true })
}

export async function getUserProfile(uid: string): Promise<{ name: string; email: string; createdAt: string } | null> {
  const { getDoc } = await import('firebase/firestore')
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as { name: string; email: string; createdAt: string }) : null
}

// ── Streak ────────────────────────────────────────────────────────────────────

export function calculateStreakFromMissions(missions: Mission[]): number {
  const weekSet = new Set(missions.filter(m => m.checkins?.length).map(m => m.weekOf))
  let streak = 0
  const cursor = new Date(getCurrentWeekMonday() + 'T12:00:00')
  const currKey = cursor.toISOString().split('T')[0]
  if (!weekSet.has(currKey)) cursor.setDate(cursor.getDate() - 7)
  while (true) {
    const key = cursor.toISOString().split('T')[0]
    if (!weekSet.has(key)) break
    streak++
    cursor.setDate(cursor.getDate() - 7)
  }
  return streak
}

// ── Date helpers (kept here for colocation) ───────────────────────────────────

export function getCurrentWeekMonday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

export function formatWeekLabel(weekOf: string): string {
  const date = new Date(weekOf + 'T12:00:00')
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0]
}
