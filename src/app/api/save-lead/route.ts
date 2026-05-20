import { NextResponse } from 'next/server'
import { redis as kv } from '@/lib/redis'
import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function POST(req: Request) {
  try {
    const { 
      id,
      address, 
      email,
      quote,
      perimeter,
      stories,
      treeCoverage,
      steepRoof,
      selectedServices
    } = await req.json()

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    }

    const leadId = id || crypto.randomUUID()
    
    // Check if lead already exists
    const existingLeadStr = await kv.hget('leads', leadId)
    const existingLead = typeof existingLeadStr === 'string' 
      ? JSON.parse(existingLeadStr) 
      : existingLeadStr || {}

    const now = new Date()
    const dateStr = now.toLocaleDateString()
    const timeStr = now.toLocaleTimeString()

    // Merge with existing lead data (if any), but don't overwrite original date/time if it exists
    const newLead = {
      date: existingLead.date || dateStr,
      time: existingLead.time || timeStr,
      address: address || existingLead.address,
      email: email || existingLead.email || ''
    }

    // Save to Vercel KV Hash
    await kv.hset('leads', { [leadId]: JSON.stringify(newLead) })

    // Send Email via Resend
    if (resend && email) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
        const emailResponse = await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: 'Your Gutter Cleaning Quote - Metamend',
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #1e293b;">
              <h1 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Your Instant Quote</h1>
              <p>Thank you for using our quoting tool! Here is the breakdown for your property at <strong>${address}</strong>.</p>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #2563eb; font-size: 32px; margin: 0 0 10px 0;">Estimated Price: $${quote}</h2>
                <p style="margin: 0; font-size: 14px; color: #64748b;">Based on ${perimeter} linear feet of gutters.</p>
              </div>

              <h3>Property Details</h3>
              <ul style="list-style: none; padding: 0; margin: 0;">
                <li style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Stories:</strong> ${stories}</li>
                <li style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Tree Coverage:</strong> ${treeCoverage}</li>
                <li style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><strong>Steep Roof:</strong> ${steepRoof ? 'Yes' : 'No'}</li>
              </ul>

              ${selectedServices && selectedServices.length > 0 ? `
                <h3>Additional Services Included</h3>
                <ul style="padding-left: 20px; color: #475569;">
                  ${selectedServices.map((service: string) => `<li><span style="text-transform: capitalize;">${service}</span></li>`).join('')}
                </ul>
              ` : ''}

              <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center;">
                <p style="margin-bottom: 20px;">Ready to book your service?</p>
                <a href="https://metamendmarketing.com/contact" style="background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Contact Us to Schedule</a>
              </div>
            </div>
          `
        })
      } catch (emailError) {
        console.error('Failed to send email via Resend:', emailError)
      }
    } else {
      console.warn("RESEND_API_KEY is missing. Skipping email delivery.")
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error saving lead:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
