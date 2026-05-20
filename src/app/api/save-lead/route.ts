import { NextResponse } from 'next/server'
import { redis as kv } from '@/lib/redis'

export async function POST(req: Request) {
  try {
    const { address, email } = await req.json()

    if (!address || !email) {
      return NextResponse.json({ error: 'Address and email are required' }, { status: 400 })
    }

    const now = new Date()
    const dateStr = now.toLocaleDateString()
    const timeStr = now.toLocaleTimeString()

    const newLead = {
      date: dateStr,
      time: timeStr,
      address,
      email
    }

    // Save to Vercel KV
    // We will store leads in a list called 'leads'
    await kv.lpush('leads', JSON.stringify(newLead))

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error saving lead:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

