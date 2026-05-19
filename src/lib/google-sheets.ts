import { google } from 'googleapis'

type Lead = {
  date: string
  time: string
  address: string
  aiData: string
}

export async function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL
  // Handle newlines in private key securely
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!email || !privateKey) {
    throw new Error('Google Sheets credentials are not fully set in environment variables.')
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const authClient = await auth.getClient()
  // Type assertion needed because googleapis type definitions for getClient are slightly loose
  const sheets = google.sheets({ version: 'v4', auth: authClient as any })
  return sheets
}

export async function appendLeadToSheet(lead: Lead) {
  const sheets = await getGoogleSheetsClient()
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!sheetId) throw new Error('GOOGLE_SHEET_ID is not set.')

  // We append to the first sheet (usually Sheet1)
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Sheet1!A:D',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [lead.date, lead.time, lead.address, lead.aiData]
      ]
    }
  })
}

export async function getLeadsFromSheet(): Promise<Lead[]> {
  try {
    const sheets = await getGoogleSheetsClient()
    const sheetId = process.env.GOOGLE_SHEET_ID
    if (!sheetId) return []

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:D',
    })

    const rows = response.data.values
    if (!rows || rows.length === 0) return []

    // Map rows to Lead objects. We assume header is first row or no header. 
    // Let's assume there's a header if the first row is "Date", "Time", etc.
    const leads: Lead[] = []
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (i === 0 && row[0] === 'Date') continue // Skip header
      
      leads.push({
        date: row[0] || '',
        time: row[1] || '',
        address: row[2] || '',
        aiData: row[3] || ''
      })
    }

    return leads.reverse() // Newest at top
  } catch (error) {
    console.error('Failed to get leads from sheet:', error)
    return []
  }
}

export async function clearSheet() {
  const sheets = await getGoogleSheetsClient()
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!sheetId) return

  // Clear everything except the header row (assuming row 1 is header)
  // Let's just clear A2:D1000 to be safe
  await sheets.spreadsheets.values.clear({
    spreadsheetId: sheetId,
    range: 'Sheet1!A2:D10000',
  })
}
