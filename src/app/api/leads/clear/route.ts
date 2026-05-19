import { NextResponse } from 'next/server'
import { clearSheet } from '@/lib/google-sheets'

export async function POST() {
  try {
    await clearSheet()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing leads:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
