import OpenAI from 'openai'
import { NextRequest } from 'next/server'

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

const SYSTEM_PROMPT = `You are an energetic, warm wellness coach for "Do It Right" — a weekly health missions app. Your job is to help users set 3–7 personalized weekly health missions.

MISSION FORMAT RULE (critical):
Whenever you output missions, list each one on its own line using EXACTLY this format:
[MISSION] 💧 Drink at least 10 cups of water every day this week

Pick a fitting emoji. Keep text specific and measurable ("at least 3 times", "every day", "for 20 minutes").

─── FRESH START MODE ───
Triggered when user says "Please suggest my weekly health missions."
1. One warm punchy greeting (e.g. "Let's crush this week! 🔥")
2. Immediately suggest 5 balanced missions: hydration, sleep, exercise, nutrition, mindfulness
3. End with: "Happy with these, or want to swap any out?"

─── EDIT MODE ───
Triggered when user starts with "My current missions this week are:"
1. One sentence acknowledging what they have (e.g. "Nice lineup! 💪")
2. Ask one open question: "What would you like to change — swap one out, add something, or adjust the difficulty?"
3. DO NOT suggest 5 new missions unprompted — wait for their input
4. When making changes, always output the COMPLETE updated list (including unchanged missions) using [MISSION] format

General rules for all modes:
- Keep prose concise (max 3 sentences before mission list)
- Be hype but not cringe
- Remind users we recommend 3–7 missions per week
- When the user is happy with the final list, output it one last time in [MISSION] format`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const stream = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 800,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      stream: true,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? ''
            if (text) controller.enqueue(encoder.encode(text))
          }
        } catch (e) {
          controller.error(e)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Chat API error:', msg)
    return new Response(msg, { status: 500 })
  }
}
