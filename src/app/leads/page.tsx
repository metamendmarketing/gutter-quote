import { redis as kv } from '@/lib/redis'
import { FileSpreadsheet, MapPin } from 'lucide-react'
import LeadsActions from '@/components/LeadsActions'

// Force dynamic rendering so it always reads the latest file contents
export const dynamic = 'force-dynamic'

type Lead = {
  date: string
  time: string
  address: string
  aiData: string
}

export default async function LeadsDashboard() {
  let leads: Lead[] = []

  try {
    // Get all leads from the 'leads' list
    const rawLeads = await kv.lrange('leads', 0, -1)
    
    // In Vercel KV, lrange on a list of JSON strings might return parsed objects or strings
    // We handle both cases just to be safe
    leads = rawLeads.map(l => typeof l === 'string' ? JSON.parse(l) : l)
    
  } catch (err) {
    console.error('Failed to fetch leads from KV:', err)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-brand-secondary text-white py-6 px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-primary/20 p-2 rounded-lg text-brand-primary">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-heading uppercase tracking-wide">Leads Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-brand-secondary-hover text-slate-300 px-4 py-2 rounded-lg text-sm font-medium">
              Total Leads: <span className="text-white font-bold ml-1">{leads.length}</span>
            </div>
            <LeadsActions leads={leads} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
          {leads.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No leads captured yet.</p>
              <p className="text-sm mt-1">Addresses searched on the main page will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider font-bold">
                    <th className="py-4 px-6">Date & Time</th>
                    <th className="py-4 px-6">Property Address</th>
                    <th className="py-4 px-6">AI Enrichment Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-semibold text-brand-secondary">{lead.date}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{lead.time}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-800 flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
                          {lead.address}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="bg-brand-primary/5 text-brand-secondary px-4 py-3 rounded-xl text-sm border border-brand-primary/20 font-medium leading-relaxed max-w-xl">
                          {lead.aiData.replace(/(City|State|ZIP):\s*[^,]+(,\s*)?/gi, '').replace(/,\s*$/, '')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
