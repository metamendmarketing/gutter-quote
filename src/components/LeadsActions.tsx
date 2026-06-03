'use client'

import { Download, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Lead = {
  date: string
  time: string
  address: string
  email: string
}

export default function LeadsActions({ leads }: { leads: Lead[] }) {
  const router = useRouter()
  const [isClearing, setIsClearing] = useState(false)

  const handleExportCSV = () => {
    if (leads.length === 0) return

    const headers = ['Date', 'Time', 'Address', 'Email']
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        `"${lead.date}"`,
        `"${lead.time}"`,
        `"${lead.address.replace(/"/g, '""')}"`,
        `"${(lead.email || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClear = async () => {
    if (!confirm('Are you sure you want to delete all leads? This cannot be undone.')) return
    
    setIsClearing(true)
    try {
      await fetch('/neds/demo/api/leads/clear', { method: 'POST' })
      router.refresh()
    } catch (err) {
      console.error('Failed to clear leads', err)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleExportCSV}
        disabled={leads.length === 0}
        className="bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
      >
        <Download className="w-4 h-4" />
        Export CSV
      </button>
      <button
        onClick={handleClear}
        disabled={leads.length === 0 || isClearing}
        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        {isClearing ? 'Clearing...' : 'Clear All'}
      </button>
    </div>
  )
}
