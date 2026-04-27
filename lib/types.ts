export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface Mission {
  id: string
  text: string
  emoji: string
  completed: boolean        // true only for past weeks display
  checkins: string[]        // "YYYY-MM-DD" dates checked this week
  weekOf: string            // "YYYY-MM-DD" of that week's Monday
  createdAt: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface Friend {
  id: string
  name: string
  initials: string
  streak: number
  missions: Pick<Mission, 'id' | 'text' | 'emoji' | 'completed'>[]
}
