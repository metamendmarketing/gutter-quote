import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST() {
  try {
    const filePath = path.join(process.cwd(), 'leads.json')
    // Simply overwrite the file with an empty array
    await fs.writeFile(filePath, JSON.stringify([], null, 2), 'utf8')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing leads:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
