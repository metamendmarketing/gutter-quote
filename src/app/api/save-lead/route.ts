import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { redis as kv } from '@/lib/redis'

export async function POST(req: Request) {
  try {
    const { address } = await req.json()

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    // AI Enrichment
    let enrichedData = "N/A"
    try {
      const apiKey = process.env.GEMINI_API_KEY
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          tools: [{ googleSearch: {} } as any],
        })

        const prompt = `Search for public property records and real estate listings (like Zillow or Redfin) for the address: ${address}. Extract the following: Year Built, Number of Stories, Square Footage. Format the response strictly as a single line, comma-separated string like: "Year Built: 1990, Stories: 2, SqFt: 2500". If a piece of data is missing or you cannot find it, write "Unknown" for that field.`
        
        const result = await model.generateContent(prompt)
        enrichedData = result.response.text().trim()
      } else {
        enrichedData = "Gemini API Key missing"
      }
    } catch (aiError) {
      console.error("Failed to enrich data via AI:", aiError)
      enrichedData = "AI Enrichment Failed"
    }

    const now = new Date()
    const dateStr = now.toLocaleDateString()
    const timeStr = now.toLocaleTimeString()

    const newLead = {
      date: dateStr,
      time: timeStr,
      address,
      aiData: enrichedData
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
