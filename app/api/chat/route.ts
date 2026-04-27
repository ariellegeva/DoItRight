import OpenAI from 'openai'
import { NextRequest } from 'next/server'

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

const SYSTEM_PROMPT = `You are an energetic, warm wellness coach for "Do It Right" — a weekly health missions app. Your job is to help users pick 3–7 personalized weekly missions that push them toward a healthier lifestyle.

MISSION FORMAT RULE (very important):
Whenever you suggest missions, list each one on its own line using EXACTLY this format:
[MISSION] 💧 Drink at least 10 cups of water every day this week

Pick a fitting emoji for each mission. Keep mission text specific and measurable (e.g. "at least 3 times", "every day", "for 20 minutes").

FIRST MESSAGE instructions:
1. One warm, punchy greeting sentence (e.g. "Let's build your week! 🔥")
2. Immediately suggest 5 balanced starter missions related to hydration, sleep, exercise, nutrition, or mindfulness
3. End with: "Happy with these, or want to swap any out?"

For follow-up messages: if the user asks to change, add, or remove missions, respond with an updated full list using the [MISSION] format, plus a short encouraging line.

Keep all responses concise — max 4 sentences of prose before the mission list. Use exclamation points. Be hype but not cringe. Remind users we recommend 3–7 missions per week.`

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
