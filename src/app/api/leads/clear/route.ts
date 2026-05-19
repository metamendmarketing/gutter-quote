import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export async function POST() {
  try {
    // Delete the 'leads' key from KV
    await kv.del('leads')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing leads:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
