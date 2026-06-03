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
          subject: "Your Roofing Quote — Noland's Roofing",
          html: `
            <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #222222; background-color: #ffffff;">
              
              <!-- Header -->
              <div style="background-color: #1A1A1A; padding: 28px 32px; border-radius: 8px 8px 0 0;">
                <p style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">Noland's Roofing</p>
                <p style="color: #999999; font-size: 13px; margin: 4px 0 0 0;">Florida's Trusted Roofing Experts</p>
              </div>

              <!-- Body -->
              <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                <h1 style="font-size: 26px; font-weight: 700; color: #1A1A1A; margin: 0 0 8px 0;">Your Instant Quote is Ready</h1>
                <p style="font-size: 15px; color: #555555; line-height: 1.6; margin: 0 0 24px 0;">
                  Thanks for using our quoting tool! Here's your estimate for the property at <strong>${address}</strong>.
                </p>

                <!-- Price Box -->
                <div style="background-color: #fdf0f2; border-left: 4px solid #b80028; padding: 20px 24px; border-radius: 6px; margin-bottom: 28px;">
                  <p style="font-size: 13px; font-weight: 600; color: #b80028; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Estimated Price</p>
                  <p style="font-size: 38px; font-weight: 800; color: #1A1A1A; margin: 0;">$${quote}</p>
                  <p style="font-size: 13px; color: #777777; margin: 6px 0 0 0;">Based on ${perimeter} linear feet of roof line.</p>
                </div>

                <!-- Details -->
                <h2 style="font-size: 16px; font-weight: 700; color: #1A1A1A; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Property Details</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
                  <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 10px 0; color: #555555; font-weight: 600;">Stories</td>
                    <td style="padding: 10px 0; color: #222222; text-align: right;">${stories}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #f0f0f0;">
                    <td style="padding: 10px 0; color: #555555; font-weight: 600;">Tree Coverage</td>
                    <td style="padding: 10px 0; color: #222222; text-align: right;">${treeCoverage}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #555555; font-weight: 600;">Steep Roof</td>
                    <td style="padding: 10px 0; color: #222222; text-align: right;">${steepRoof ? 'Yes' : 'No'}</td>
                  </tr>
                </table>

                ${selectedServices && selectedServices.length > 0 ? `
                  <h2 style="font-size: 16px; font-weight: 700; color: #1A1A1A; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">Additional Services</h2>
                  <ul style="padding-left: 20px; color: #555555; font-size: 14px; margin-bottom: 24px;">
                    ${selectedServices.map((service: string) => `<li style="padding: 4px 0; text-transform: capitalize;">${service}</li>`).join('')}
                  </ul>
                ` : ''}

                <!-- CTA -->
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; text-align: center; margin-top: 16px;">
                  <p style="font-size: 15px; color: #444444; margin: 0 0 16px 0; font-weight: 500;">Ready to get started? Our team is standing by.</p>
                  <a href="https://nolandsroofing.com/contact" style="background-color: #b80028; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 700; font-size: 15px; display: inline-block; letter-spacing: 0.3px;">Schedule Your Service →</a>
                </div>

                <!-- Footer -->
                <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="font-size: 12px; color: #aaaaaa; margin: 0;">© Noland's Roofing · Florida's Trusted Roofing Experts</p>
                  <p style="font-size: 12px; color: #aaaaaa; margin: 4px 0 0 0;">This is an automated estimate. Final pricing may vary after an on-site assessment.</p>
                </div>
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
